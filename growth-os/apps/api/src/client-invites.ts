import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from './db.js';
import { actorEmailFromRequest, requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const clientInviteRouter=Router({mergeParams:true});

let schemaPromise:Promise<void>|null=null;
function ensureSchema(){
  if(schemaPromise)return schemaPromise;
  schemaPromise=pool.query(`
    create table if not exists client_portal_invites (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references agency_workspaces(id) on delete cascade,
      client_id uuid not null references agency_clients(id) on delete cascade,
      email text not null,
      display_name text,
      role text not null default 'client_viewer',
      token_hash text not null unique,
      status text not null default 'pending',
      invited_by text not null,
      expires_at timestamptz not null,
      accepted_at timestamptz,
      created_at timestamptz not null default now()
    );
    create index if not exists idx_client_portal_invites_client on client_portal_invites(workspace_id,client_id,status,created_at desc);
    create index if not exists idx_client_portal_invites_expiry on client_portal_invites(status,expires_at);
  `).then(()=>undefined);
  return schemaPromise;
}

function tokenHash(token:string){return crypto.createHash('sha256').update(token).digest('hex')}

async function assertClient(workspaceId:string,clientId:string){
  const {rows}=await pool.query("select id,name,domain from agency_clients where id=$1 and workspace_id=$2 and status='active'",[clientId,workspaceId]);
  if(!rows[0])throw new Error('CLIENT_ACCESS_DENIED');
  return rows[0];
}

function statusFor(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='CLIENT_ACCESS_DENIED')return 404;
  if(message==='INVITE_NOT_FOUND'||message==='INVITE_EMAIL_MISMATCH')return 403;
  return workspaceErrorStatus(error);
}

function messageFor(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='CLIENT_ACCESS_DENIED')return 'Müşteri bulunamadı.';
  if(message==='INVITE_NOT_FOUND')return 'Davet geçersiz, süresi dolmuş veya daha önce kullanılmış.';
  if(message==='INVITE_EMAIL_MISMATCH')return 'Bu davet farklı bir e-posta adresi için oluşturuldu.';
  return workspaceErrorMessage(error);
}

clientInviteRouter.get('/client/:clientId',async(req,res)=>{
  try{
    await ensureSchema();
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    requireRole(actor,'admin');
    await assertClient(actor.workspaceId,req.params.clientId);
    const {rows}=await pool.query(`
      select id,email,display_name,role,status,expires_at,accepted_at,created_at,invited_by
      from client_portal_invites
      where workspace_id=$1 and client_id=$2
      order by created_at desc
      limit 100`,[actor.workspaceId,req.params.clientId]);
    res.json(rows);
  }catch(error){res.status(statusFor(error)).json({error:messageFor(error)})}
});

clientInviteRouter.post('/client/:clientId',async(req,res)=>{
  const parsed=z.object({
    email:z.string().email(),
    displayName:z.string().min(1).max(120).optional(),
    role:z.enum(['client_admin','client_viewer']).default('client_viewer'),
    expiresInDays:z.number().int().min(1).max(30).default(7)
  }).safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Davet bilgileri geçersiz.'});
  try{
    await ensureSchema();
    const actor=await resolveWorkspaceActor(req,req.params.workspaceId);
    requireRole(actor,'admin');
    const client=await assertClient(actor.workspaceId,req.params.clientId);
    const token=crypto.randomBytes(32).toString('base64url');
    const hash=tokenHash(token);
    const d=parsed.data;
    await pool.query(`
      update client_portal_invites
      set status='revoked'
      where workspace_id=$1 and client_id=$2 and lower(email)=lower($3) and status='pending'`,[actor.workspaceId,client.id,d.email]);
    const {rows}=await pool.query(`
      insert into client_portal_invites(workspace_id,client_id,email,display_name,role,token_hash,status,invited_by,expires_at)
      values($1,$2,lower($3),$4,$5,$6,'pending',$7,now()+($8::text||' days')::interval)
      returning id,email,display_name,role,status,expires_at,created_at`,[actor.workspaceId,client.id,d.email,d.displayName||null,d.role,hash,actor.email,d.expiresInDays]);
    res.status(201).json({invite:rows[0],token,client:{id:client.id,name:client.name,domain:client.domain}});
  }catch(error){res.status(statusFor(error)).json({error:messageFor(error)})}
});

clientInviteRouter.get('/:token',async(req,res)=>{
  try{
    await ensureSchema();
    const email=actorEmailFromRequest(req);
    const {rows}=await pool.query(`
      select i.id,i.workspace_id,i.client_id,i.email,i.display_name,i.role,i.status,i.expires_at,
        c.name client_name,c.domain client_domain,
        coalesce(b.brand_name,w.name) brand_name,b.logo_url,b.primary_color,b.accent_color
      from client_portal_invites i
      join agency_clients c on c.id=i.client_id and c.workspace_id=i.workspace_id
      join agency_workspaces w on w.id=i.workspace_id
      left join workspace_branding b on b.workspace_id=i.workspace_id
      where i.token_hash=$1 and i.status='pending' and i.expires_at>now()
      limit 1`,[tokenHash(req.params.token)]);
    if(!rows[0])throw new Error('INVITE_NOT_FOUND');
    if(String(rows[0].email).toLowerCase()!==email.toLowerCase())throw new Error('INVITE_EMAIL_MISMATCH');
    res.json({invite:rows[0],authenticatedEmail:email});
  }catch(error){res.status(statusFor(error)).json({error:messageFor(error)})}
});

clientInviteRouter.post('/:token/accept',async(req,res)=>{
  try{
    await ensureSchema();
    const email=actorEmailFromRequest(req);
    const client=await pool.connect();
    try{
      await client.query('begin');
      const inviteResult=await client.query(`
        select * from client_portal_invites
        where token_hash=$1 and status='pending' and expires_at>now()
        for update`,[tokenHash(req.params.token)]);
      const invite=inviteResult.rows[0];
      if(!invite)throw new Error('INVITE_NOT_FOUND');
      if(String(invite.email).toLowerCase()!==email.toLowerCase())throw new Error('INVITE_EMAIL_MISMATCH');
      await client.query(`
        insert into client_portal_users(workspace_id,client_id,email,display_name,role,status)
        values($1,$2,lower($3),$4,$5,'active')
        on conflict(workspace_id,client_id,email) do update set display_name=excluded.display_name,role=excluded.role,status='active',updated_at=now()`,
        [invite.workspace_id,invite.client_id,invite.email,invite.display_name,invite.role]);
      await client.query("update client_portal_invites set status='accepted',accepted_at=now() where id=$1",[invite.id]);
      await client.query('commit');
      res.json({accepted:true,workspaceId:invite.workspace_id,clientId:invite.client_id,role:invite.role});
    }catch(error){await client.query('rollback');throw error}finally{client.release()}
  }catch(error){res.status(statusFor(error)).json({error:messageFor(error)})}
});
