import type { RequestHandler } from 'express';
import { pool } from './db.js';
import { assertActiveProjectAccess, assertProjectAccess, listWorkspaceProjects, requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

const INTERNAL_WORKSPACE_ID='00000000-0000-4000-8000-000000000001';

async function projectIdForResource(table:'recommendations'|'execution_jobs'|'audits',id:string){
  const {rows}=await pool.query(`select project_id from ${table} where id=$1 limit 1`,[id]);
  if(!rows[0]?.project_id)throw new Error('PROJECT_ACCESS_DENIED');
  return String(rows[0].project_id);
}

function isReadOnly(method:string){
  return method==='GET'||method==='HEAD';
}

export const legacyWorkspaceGuard:RequestHandler=async(req,res,next)=>{
  const path=req.path;
  if(path==='/health'||path==='/capabilities'||path.startsWith('/workspaces/')||path==='/workspaces'||path.startsWith('/oauth/'))return next();

  try{
    const actor=await resolveWorkspaceActor(req);

    if(req.method==='GET'&&path==='/projects'){
      return res.json(await listWorkspaceProjects(actor));
    }

    if(req.method==='POST'&&path==='/audit'){
      requireRole(actor,'analyst');
      if(actor.workspaceId!==INTERNAL_WORKSPACE_ID)return res.status(403).json({error:'Yeni audit bu workspace için workspace-scoped endpoint üzerinden başlatılmalı.'});
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
