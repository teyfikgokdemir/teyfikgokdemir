import { Router } from 'express';
import { z } from 'zod';
import { pool } from './db.js';
import { runAudit } from './audit.js';
import { clientInviteRouter } from './client-invites.js';
import { clientPortalRouter } from './client-portal.js';
import { projectLifecycleRouter } from './project-lifecycle.js';
import { workspaceActivityRouter } from './workspace-activity.js';
import { assertProjectAccess, listWorkspaceProjects, requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const workspaceRouter=Router();
workspaceRouter.use('/:workspaceId/activity',workspaceActivityRouter);
workspaceRouter.use('/:workspaceId/clients',clientPortalRouter);
workspaceRouter.use('/:workspaceId/invites',clientInviteRouter);
workspaceRouter.use('/:workspaceId/project-lifecycle',projectLifecycleRouter);

async function persistWorkspaceAudit(workspaceId:string,domain:string,projectName?:string){
  const result=await runAudit(domain);
  const hostname=new URL(result.domain).hostname.replace(/^www\./,'');
  const existing=await pool.query('select id,status from projects where workspace_id=$1 and lower(domain)=lower($2) limit 1',[workspaceId,hostname]);
  if(existing.rows[0]?.status==='archived')throw new Error('PROJECT_ARCHIVED');

  const projectResult=await pool.query(`
    insert into projects(name,domain,workspace_id)
    values($1,$2,$3)
    on conflict(workspace_id,domain) do update set name=excluded.name
    returning id,name,domain,workspace_id,client_id`,[projectName||hostname,hostname,workspaceId]);
  const project=projectResult.rows[0];

  const previousResult=await pool.query('select payload from audits where project_id=$1 order by created_at desc limit 1',[project.id]);
  const previous=previousResult.rows[0]?.payload as {overallScore?:number}|undefined;
  const inserted=await pool.query(`
    insert into audits(project_id,domain,overall_score,seo_score,geo_score,aeo_score,aio_score,ads_readiness_score,payload)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9)
    returning id,created_at`,[project.id,result.domain,result.overallScore,result.scores.seo,result.scores.geo,result.scores.aeo,result.scores.aio,result.scores.adsReadiness,result]);
  const auditId=inserted.rows[0].id;

  const client=await pool.connect();
  try{
    await client.query('begin');
    await client.query("update alerts set status='resolved',resolved_at=now() where project_id=$1 and source='audit_engine' and status='open'",[project.id]);
    await client.query("update recommendations set status='superseded',decided_at=now() where project_id=$1 and source='audit_engine' and status='proposed'",[project.id]);
    for(const issue of result.issues.filter(i=>i.status==='fail')){
      await client.query("insert into recommendations(project_id,source,priority,title,rationale,proposed_action,status) values($1,'audit_engine',$2,$3,$4,$5,'proposed')",[project.id,issue.severity,issue.title,issue.detail,{type:'site_fix',issueKey:issue.key,recommendation:issue.recommendation,auditId}]);
      if(['critical','high'].includes(issue.severity)){
        await client.query("insert into alerts(project_id,source,severity,title,message,status,payload) values($1,'audit_engine',$2,$3,$4,'open',$5)",[project.id,issue.severity,issue.title,issue.recommendation,{issueKey:issue.key,auditId}]);
      }
    }
    await client.query('commit');
  }catch(error){await client.query('rollback');throw error}finally{client.release()}

  const previousScore=Number(previous?.overallScore??0);
  return {
    project,
    audit:{...result,id:auditId,createdAt:inserted.rows[0].created_at},
    comparison:previous?{previousScore,currentScore:result.overallScore,scoreDelta:result.overallScore-previousScore}:null
  };
}

workspaceRouter.get('/me',async(req,res)=>{
  try{
    const actor=await resolveWorkspaceActor(req);
    const [workspace,branding,projects]=await Promise.all([
      pool.query('select id,name,slug,status,plan,settings,created_at,updated_at from agency_workspaces where id=$1',[actor.workspaceId]),
      pool.query('select brand_name,logo_url,primary_color,accent_color,custom_domain,report_footer,settings,updated_at from workspace_branding where workspace_id=$1',[actor.workspaceId]),
      listWorkspaceProjects(actor)
    ]);
    res.json({actor,workspace:workspace.rows[0]||null,branding:branding.rows[0]||null,projects});
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});

workspaceRouter.get('/:workspaceId',async(req,res)=>{
  try{
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    const [workspace,branding,members,clients,projects]=await Promise.all([
      pool.query('select id,name,slug,status,plan,settings,created_at,updated_at from agency_workspaces where id=$1',[actor.workspaceId]),
      pool.query('select brand_name,logo_url,primary_color,accent_color,custom_domain,report_footer,settings,updated_at from workspace_branding where workspace_id=$1',[actor.workspaceId]),
      pool.query("select id,email,display_name,role,status,permissions,created_at,updated_at from workspace_members where workspace_id=$1 and status='active' order by created_at",[actor.workspaceId]),
      pool.query("select id,name,domain,status,metadata,created_at,updated_at from agency_clients where workspace_id=$1 order by created_at desc",[actor.workspaceId]),
      listWorkspaceProjects(actor)
    ]);
    res.json({actor,workspace:workspace.rows[0]||null,branding:branding.rows[0]||null,members:members.rows,clients:clients.rows,projects});
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});

workspaceRouter.post('/:workspaceId/audit',async(req,res)=>{
  const parsed=z.object({domain:z.string().min(3),projectName:z.string().min(1).max(160).optional()}).safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Geçerli bir domain girin.'});
  try{
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    requireRole(actor,'analyst');
    res.json(await persistWorkspaceAudit(actor.workspaceId,parsed.data.domain,parsed.data.projectName));
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});

workspaceRouter.get('/:workspaceId/projects/:projectId',async(req,res)=>{
  try{
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    const project=await assertProjectAccess(actor,req.params.projectId);
    res.json({actor,project});
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});

workspaceRouter.put('/:workspaceId/branding',async(req,res)=>{
  const parsed=z.object({
    brandName:z.string().min(1).max(100).nullable().optional(),
    logoUrl:z.string().url().nullable().optional(),
    primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
    accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
    customDomain:z.string().min(3).max(255).nullable().optional(),
    reportFooter:z.string().max(500).nullable().optional()
  }).safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Branding alanları geçersiz.'});
  try{
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    requireRole(actor,'admin');
    const d=parsed.data;
    const {rows}=await pool.query(`
      insert into workspace_branding(workspace_id,brand_name,logo_url,primary_color,accent_color,custom_domain,report_footer)
      values($1,$2,$3,$4,$5,$6,$7)
      on conflict(workspace_id) do update set
        brand_name=coalesce(excluded.brand_name,workspace_branding.brand_name),
        logo_url=coalesce(excluded.logo_url,workspace_branding.logo_url),
        primary_color=coalesce(excluded.primary_color,workspace_branding.primary_color),
        accent_color=coalesce(excluded.accent_color,workspace_branding.accent_color),
        custom_domain=coalesce(excluded.custom_domain,workspace_branding.custom_domain),
        report_footer=coalesce(excluded.report_footer,workspace_branding.report_footer),
        updated_at=now()
      returning *`,[actor.workspaceId,d.brandName??null,d.logoUrl??null,d.primaryColor??null,d.accentColor??null,d.customDomain??null,d.reportFooter??null]);
    res.json({branding:rows[0],actor:{email:actor.email,role:actor.role}});
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});

workspaceRouter.post('/:workspaceId/members',async(req,res)=>{
  const parsed=z.object({email:z.string().email(),displayName:z.string().min(1).max(120).optional(),role:z.enum(['admin','analyst','viewer']).default('viewer')}).safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Üye bilgileri geçersiz.'});
  try{
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    requireRole(actor,'owner');
    const d=parsed.data;
    const {rows}=await pool.query(`
      insert into workspace_members(workspace_id,email,display_name,role,status)
      values($1,lower($2),$3,$4,'active')
      on conflict(workspace_id,email) do update set display_name=excluded.display_name,role=excluded.role,status='active',updated_at=now()
      returning id,email,display_name,role,status,permissions,created_at,updated_at`,[actor.workspaceId,d.email,d.displayName||null,d.role]);
    res.status(201).json({member:rows[0]});
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});