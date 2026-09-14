import type { RequestHandler } from 'express';
import { pool } from './db.js';
import { assertActiveProjectAccess, assertProjectAccess, listWorkspaceProjects, requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

const INTERNAL_WORKSPACE_ID='00000000-0000-4000-8000-000000000001';
const REQUIRED_SCHEMA_MIGRATION='001_workspace_scoped_project_domains';

async function projectIdForResource(table:'recommendations'|'execution_jobs'|'audits',id:string){
  const {rows}=await pool.query(`select project_id from ${table} where id=$1 limit 1`,[id]);
  if(!rows[0]?.project_id)throw new Error('PROJECT_ACCESS_DENIED');
  return String(rows[0].project_id);
}

function isReadOnly(method:string){
  return method==='GET'||method==='HEAD';
}

function normalizeDomain(value:unknown){
  if(typeof value!=='string')return '';
  const trimmed=value.trim();
  if(!trimmed)return '';
  try{
    const url=new URL(/^https?:\/\//i.test(trimmed)?trimmed:`https://${trimmed}`);
    return url.hostname.replace(/^www\./i,'').toLowerCase();
  }catch{
    return trimmed.replace(/^https?:\/\//i,'').split('/')[0].replace(/^www\./i,'').toLowerCase();
  }
}

export const legacyWorkspaceGuard:RequestHandler=async(req,res,next)=>{
  const path=req.path;
  if(path==='/health/ready'){
    const time=new Date().toISOString();
    try{
      await pool.query('select 1');
    }catch(error){
      console.error('Readiness database check failed',error);
      return res.status(503).json({ok:false,ready:false,database:'unreachable',schema:'unknown',service:'growth-os-api',time});
    }
    try{
      const migration=await pool.query('select 1 from schema_migrations where version=$1 limit 1',[REQUIRED_SCHEMA_MIGRATION]);
      if(!migration.rows[0]){
        console.error('Readiness schema check failed: required migration missing');
        return res.status(503).json({ok:false,ready:false,database:'reachable',schema:'not_ready',service:'growth-os-api',time});
      }
    }catch(error){
      console.error('Readiness schema check failed',error);
      return res.status(503).json({ok:false,ready:false,database:'reachable',schema:'not_ready',service:'growth-os-api',time});
    }
    return res.json({ok:true,ready:true,database:'reachable',schema:'ready',service:'growth-os-api',time});
  }
  if(path==='/health'||path==='/capabilities'||path.startsWith('/workspaces/')||path==='/workspaces'||path.startsWith('/oauth/'))return next();

  try{
    const actor=await resolveWorkspaceActor(req);

    if(req.method==='GET'&&path==='/projects'){
      return res.json(await listWorkspaceProjects(actor));
    }

    if(req.method==='POST'&&path==='/audit'){
      requireRole(actor,'analyst');
      if(actor.workspaceId!==INTERNAL_WORKSPACE_ID)return res.status(403).json({error:'Yeni audit bu workspace için workspace-scoped endpoint üzerinden başlatılmalı.'});
      const domain=normalizeDomain((req.body as {domain?:unknown}|undefined)?.domain);
      if(domain){
        const {rows}=await pool.query(
          `select id,status from projects where workspace_id=$1 and lower(domain)=lower($2) limit 1`,
          [actor.workspaceId,domain]
        );
        if(rows[0]?.status==='archived')throw new Error('PROJECT_ARCHIVED');
      }
      // Keep the legacy frontend contract while routing writes through the tenant-scoped audit path.
      req.url=`/workspaces/${encodeURIComponent(actor.workspaceId)}/audit`;
      return next();
    }

    const projectMatch=path.match(/^\/projects\/([^/]+)/);
    if(projectMatch){
      if(isReadOnly(req.method))await assertProjectAccess(actor,projectMatch[1]);
      else{
        requireRole(actor,'analyst');
        await assertActiveProjectAccess(actor,projectMatch[1]);
      }
      return next();
    }

    const recommendationMatch=path.match(/^\/recommendations\/([^/]+)/);
    if(recommendationMatch){
      const projectId=await projectIdForResource('recommendations',recommendationMatch[1]);
      if(isReadOnly(req.method))await assertProjectAccess(actor,projectId);
      else{
        requireRole(actor,'analyst');
        await assertActiveProjectAccess(actor,projectId);
        if(req.method==='POST'&&/^\/recommendations\/[^/]+\/approve$/.test(path)){
          const body=req.body&&typeof req.body==='object'?req.body:{};
          req.body={...body,approvedBy:actor.email};
        }
      }
      return next();
    }

    const executionMatch=path.match(/^\/execution-jobs\/([^/]+)/);
    if(executionMatch){
      const projectId=await projectIdForResource('execution_jobs',executionMatch[1]);
      if(isReadOnly(req.method))await assertProjectAccess(actor,projectId);
      else{
        requireRole(actor,'analyst');
        await assertActiveProjectAccess(actor,projectId);
      }
      return next();
    }

    const auditMatch=path.match(/^\/audits\/([^/]+)/);
    if(auditMatch){
      const projectId=await projectIdForResource('audits',auditMatch[1]);
      await assertProjectAccess(actor,projectId);
      return next();
    }

    return next();
  }catch(error){
    return res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)});
  }
};
