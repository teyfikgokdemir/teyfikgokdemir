import { Router, type RequestHandler } from 'express';
import { pool } from './db.js';
import { requireRole, resolveWorkspaceActor, verifiedActorEmailFromRequest, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const clientPortalRouter = Router({ mergeParams: true });

let schemaReady = false;
let schemaInitializing: Promise<void> | undefined;

async function ensureClientPortalSchema(): Promise<void> {
  if (schemaReady) return;
  if (!schemaInitializing) {
    schemaInitializing = (async () => {
      await pool.query(`
        create table if not exists client_portal_users (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid not null references agency_workspaces(id) on delete cascade,
          client_id uuid not null references agency_clients(id) on delete cascade,
          email text not null,
          display_name text,
          role text not null default 'client_viewer',
          status text not null default 'active',
          permissions jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique(workspace_id,client_id,email)
        );
        create table if not exists client_decisions (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid not null references agency_workspaces(id) on delete cascade,
          client_id uuid not null references agency_clients(id) on delete cascade,
          project_id uuid not null references projects(id) on delete cascade,
          recommendation_id uuid not null references recommendations(id) on delete cascade,
          decided_by text not null,
          decision text not null,
          note text,
          created_at timestamptz not null default now(),
          unique(client_id,recommendation_id)
        );
        create index if not exists idx_client_portal_users_access on client_portal_users(workspace_id,client_id,status);
        create index if not exists idx_client_decisions_client on client_decisions(client_id,created_at desc);
      `);
      schemaReady = true;
    })().catch((error) => {
      schemaInitializing = undefined;
      throw error;
    });
  }
  await schemaInitializing;
}

async function assertClient(workspaceId:string,clientId:string){
  const {rows}=await pool.query("select id,workspace_id,name,domain,status,metadata from agency_clients where id=$1 and workspace_id=$2 and status='active'",[clientId,workspaceId]);
  if(!rows[0])throw new Error('CLIENT_ACCESS_DENIED');
  return rows[0];
}

async function resolveClientUser(workspaceId:string,clientId:string,email:string){
  await ensureClientPortalSchema();
  const {rows}=await pool.query(`select id,email,display_name,role,permissions,status from client_portal_users where workspace_id=$1 and client_id=$2 and lower(email)=lower($3) and status='active' limit 1`,[workspaceId,clientId,email]);
  if(!rows[0])throw new Error('CLIENT_PORTAL_ACCESS_DENIED');
  return rows[0];
}

function errorStatus(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='CLIENT_ACCESS_DENIED')return 404;
  if(message==='CLIENT_PORTAL_ACCESS_DENIED'||message==='CLIENT_PORTAL_DECISION_DENIED')return 403;
  return workspaceErrorStatus(error);
}

function errorMessage(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='CLIENT_ACCESS_DENIED')return 'Müşteri bulunamadı.';
  if(message==='CLIENT_PORTAL_ACCESS_DENIED')return 'Bu müşteri portalına erişim yetkiniz yok.';
  if(message==='CLIENT_PORTAL_DECISION_DENIED')return 'Bu işlem client_admin yetkisi gerektiriyor.';
  return workspaceErrorMessage(error);
}

const portalHandler:RequestHandler=async(req,res)=>{
  try{
    await ensureClientPortalSchema();
    const workspaceId=String(req.params['workspaceId']||'');
    const clientId=String(req.params['clientId']||'');
    const email=await verifiedActorEmailFromRequest(req);
    const client=await assertClient(workspaceId,clientId);
    const user=await resolveClientUser(workspaceId,clientId,email);
    const [branding,projects]=await Promise.all([
      pool.query('select brand_name,logo_url,primary_color,accent_color,custom_domain,report_footer,settings from workspace_branding where workspace_id=$1',[workspaceId]),
      pool.query("select id,name,domain,created_at from projects where workspace_id=$1 and client_id=$2 and status='active' order by created_at desc",[workspaceId,clientId])
    ]);
    const projectIds:string[]=projects.rows.map((row:{id:string})=>String(row.id));
    if(!projectIds.length){
      res.json({client,user,branding:branding.rows[0]||null,projects:[],summary:{projectCount:0,pendingRecommendations:0,verifiedResults:0,metrics30d:{spend:0,revenue:0,grossProfit:0,conversions:0,roas:null}},recommendations:[],results:[],decisions:[]});
      return;
    }
    const [auditSummary,recommendations,results,metrics,decisions]=await Promise.all([
      pool.query(`select distinct on (project_id) project_id,overall_score,seo_score,geo_score,aeo_score,aio_score,ads_readiness_score,created_at from audits where project_id=any($1::uuid[]) order by project_id,created_at desc`,[projectIds]),
      pool.query(`select r.id,r.project_id,r.priority,r.title,r.rationale,r.proposed_action,r.status,r.created_at,p.name project_name from recommendations r join projects p on p.id=r.project_id where r.project_id=any($1::uuid[]) and r.status in ('proposed','approved') order by r.created_at desc limit 50`,[projectIds]),
      pool.query(`select v.id,v.project_id,v.recommendation_id,v.status,v.verification_type,v.score_before,v.score_after,v.score_delta,v.verdict,v.verified_at,p.name project_name from verification_results v join projects p on p.id=v.project_id where v.project_id=any($1::uuid[]) and v.status='passed' order by v.verified_at desc nulls last,v.created_at desc limit 30`,[projectIds]),
      pool.query(`select coalesce(sum(spend),0)::numeric spend,coalesce(sum(attributed_revenue),0)::numeric revenue,coalesce(sum(gross_profit),0)::numeric gross_profit,coalesce(sum(conversions),0)::numeric conversions from campaign_metrics where project_id=any($1::uuid[]) and metric_date>=current_date-interval '30 days'`,[projectIds]),
      pool.query(`select id,project_id,recommendation_id,decision,note,decided_by,created_at from client_decisions where workspace_id=$1 and client_id=$2 order by created_at desc limit 100`,[workspaceId,clientId])
    ]);
    const m=metrics.rows[0]||{};
    const spend=Number(m.spend||0),revenue=Number(m.revenue||0);
    res.json({
      client,user,branding:branding.rows[0]||null,projects:projects.rows,
      summary:{projectCount:projects.rows.length,latestAudits:auditSummary.rows,pendingRecommendations:recommendations.rows.filter((row:{status?:string})=>row.status==='proposed').length,verifiedResults:results.rows.length,metrics30d:{spend,revenue,grossProfit:Number(m.gross_profit||0),conversions:Number(m.conversions||0),roas:spend>0?revenue/spend:null}},
      recommendations:recommendations.rows,results:results.rows,decisions:decisions.rows
    });
  }catch(error){res.status(errorStatus(error)).json({error:errorMessage(error)})}
};

const decisionHandler:RequestHandler=async(req,res)=>{
  const body=(req.body&&typeof req.body==='object'?req.body:{}) as Record<string,unknown>;
  const decision=body['decision'];
  const note=typeof body['note']==='string'?body['note']:undefined;
  if(decision!=='approved'&&decision!=='rejected'){res.status(400).json({error:'Müşteri kararı geçersiz.'});return}
  if(note&&note.length>1000){res.status(400).json({error:'Not en fazla 1000 karakter olabilir.'});return}
  try{
    await ensureClientPortalSchema();
    const workspaceId=String(req.params['workspaceId']||'');
    const clientId=String(req.params['clientId']||'');
    const recommendationId=String(req.params['recommendationId']||'');
    const email=await verifiedActorEmailFromRequest(req);
    await assertClient(workspaceId,clientId);
    const user=await resolveClientUser(workspaceId,clientId,email);
    if(user.role!=='client_admin')throw new Error('CLIENT_PORTAL_DECISION_DENIED');

    const client=await pool.connect();
    try{
      await client.query('begin');
      const rec=await client.query(`select r.id,r.project_id,r.status from recommendations r join projects p on p.id=r.project_id where r.id=$1 and p.workspace_id=$2 and p.client_id=$3 and r.status in ('proposed','approved') for update of p`,[recommendationId,workspaceId,clientId]);
      if(!rec.rows[0]){
        await client.query('rollback');
        res.status(404).json({error:'Karar verilebilir öneri bulunamadı.'});
        return;
      }
      const project=await client.query('select status from projects where id=$1 for update',[rec.rows[0].project_id]);
      if(project.rows[0]?.status!=='active')throw new Error('PROJECT_ARCHIVED');
      const {rows}=await client.query(`insert into client_decisions(workspace_id,client_id,project_id,recommendation_id,decided_by,decision,note) values($1,$2,$3,$4,$5,$6,$7) on conflict(client_id,recommendation_id) do update set decided_by=excluded.decided_by,decision=excluded.decision,note=excluded.note,created_at=now() returning *`,[workspaceId,clientId,rec.rows[0].project_id,recommendationId,email,decision,note||null]);
      await client.query('commit');
      res.json({decision:rows[0],executionTriggered:false,note:'Müşteri kararı kaydedildi. Bu işlem harici sistemlerde değişiklik başlatmaz.'});
    }catch(error){await client.query('rollback');throw error}finally{client.release()}
  }catch(error){res.status(errorStatus(error)).json({error:errorMessage(error)})}
};

const listPortalUsers:RequestHandler=async(req,res)=>{
  try{
    await ensureClientPortalSchema();
    const workspaceId=String(req.params['workspaceId']||'');
    const clientId=String(req.params['clientId']||'');
    const actor=await resolveWorkspaceActor(req,workspaceId);
    requireRole(actor,'admin');
    await assertClient(actor.workspaceId,clientId);
    const {rows}=await pool.query('select id,email,display_name,role,status,permissions,created_at,updated_at from client_portal_users where workspace_id=$1 and client_id=$2 order by created_at',[actor.workspaceId,clientId]);
    res.json(rows);
  }catch(error){res.status(errorStatus(error)).json({error:errorMessage(error)})}
};

const createPortalUser:RequestHandler=async(req,res)=>{
  const body=(req.body&&typeof req.body==='object'?req.body:{}) as Record<string,unknown>;
  const email=typeof body['email']==='string'?body['email'].trim().toLowerCase():'';
  const displayName=typeof body['displayName']==='string'?body['displayName'].trim().slice(0,120):null;
  const role=body['role']==='client_admin'?'client_admin':'client_viewer';
  if(!email.includes('@')){res.status(400).json({error:'Portal kullanıcısı e-postası geçersiz.'});return}
  try{
    await ensureClientPortalSchema();
    const workspaceId=String(req.params['workspaceId']||'');
    const clientId=String(req.params['clientId']||'');
    const actor=await resolveWorkspaceActor(req,workspaceId);
    requireRole(actor,'admin');
    await assertClient(actor.workspaceId,clientId);
    const {rows}=await pool.query(`insert into client_portal_users(workspace_id,client_id,email,display_name,role,status) values($1,$2,$3,$4,$5,'active') on conflict(workspace_id,client_id,email) do update set display_name=excluded.display_name,role=excluded.role,status='active',updated_at=now() returning id,email,display_name,role,status,permissions,created_at,updated_at`,[actor.workspaceId,clientId,email,displayName,role]);
    res.status(201).json({user:rows[0]});
  }catch(error){res.status(errorStatus(error)).json({error:errorMessage(error)})}
};

clientPortalRouter.get('/:clientId/portal',portalHandler);
clientPortalRouter.post('/:clientId/portal/recommendations/:recommendationId/decision',decisionHandler);
clientPortalRouter.get('/:clientId/portal-users',listPortalUsers);
clientPortalRouter.post('/:clientId/portal-users',createPortalUser);
