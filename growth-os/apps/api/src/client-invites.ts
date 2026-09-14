import crypto from 'node:crypto';
import { Router } from 'express';
import { pool } from './db.js';
import { requireRole, resolveWorkspaceActor, verifiedActorEmailFromRequest, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const clientInviteRouter = Router({ mergeParams: true });

async function ensureInviteSchema() {
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
  `);
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function errorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'CLIENT_ACCESS_DENIED') return 404;
  if (message === 'INVITE_NOT_FOUND' || message === 'INVITE_EMAIL_MISMATCH') return 403;
  return workspaceErrorStatus(error);
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'CLIENT_ACCESS_DENIED') return 'Müşteri bulunamadı.';
  if (message === 'INVITE_NOT_FOUND') return 'Davet geçersiz, süresi dolmuş veya daha önce kullanılmış.';
  if (message === 'INVITE_EMAIL_MISMATCH') return 'Bu davet farklı bir e-posta adresi için oluşturuldu.';
  return workspaceErrorMessage(error);
}

async function getClient(workspaceId: string, clientId: string) {
  const result = await pool.query(
    "select id,name,domain from agency_clients where id=$1 and workspace_id=$2 and status='active'",
    [clientId, workspaceId]
  );
  if (!result.rows[0]) throw new Error('CLIENT_ACCESS_DENIED');
  return result.rows[0];
}

clientInviteRouter.get('/client/:clientId', async (req, res) => {
  try {
    await ensureInviteSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    await getClient(actor.workspaceId, clientId);

    await pool.query(
      "update client_portal_invites set status='expired' where workspace_id=$1 and client_id=$2 and status='pending' and expires_at<=now()",
      [actor.workspaceId, clientId]
    );

    const result = await pool.query(
      `select id,email,display_name,role,status,expires_at,accepted_at,created_at,invited_by
       from client_portal_invites
       where workspace_id=$1 and client_id=$2
       order by created_at desc limit 100`,
      [actor.workspaceId, clientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientInviteRouter.post('/client/:clientId', async (req, res) => {
  try {
    await ensureInviteSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    const client = await getClient(actor.workspaceId, clientId);

    const email = String(req.body?.email || '').trim().toLowerCase();
    const displayName = req.body?.displayName ? String(req.body.displayName).trim().slice(0, 120) : null;
    const role = req.body?.role === 'client_admin' ? 'client_admin' : 'client_viewer';
    const requestedDays = Number(req.body?.expiresInDays || 7);
    const expiresInDays = Number.isInteger(requestedDays) ? Math.max(1, Math.min(30, requestedDays)) : 7;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Geçerli e-posta adresi gerekli.' });

    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);

    await pool.query(
      "update client_portal_invites set status='revoked' where workspace_id=$1 and client_id=$2 and lower(email)=lower($3) and status='pending'",
      [actor.workspaceId, client.id, email]
    );

    const result = await pool.query(
      `insert into client_portal_invites(workspace_id,client_id,email,display_name,role,token_hash,status,invited_by,expires_at)
       values($1,$2,$3,$4,$5,$6,'pending',$7,now()+make_interval(days=>$8))
       returning id,email,display_name,role,status,expires_at,created_at`,
      [actor.workspaceId, client.id, email, displayName, role, tokenHash, actor.email, expiresInDays]
    );

    res.status(201).json({ invite: result.rows[0], token, client: { id: client.id, name: client.name, domain: client.domain } });
  } catch (error) {
    res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientInviteRouter.post('/client/:clientId/:inviteId/revoke', async (req, res) => {
  try {
    await ensureInviteSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const inviteId = String(req.params.inviteId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    await getClient(actor.workspaceId, clientId);

    const result = await pool.query(
      `update client_portal_invites
       set status='revoked'
       where id=$1 and workspace_id=$2 and client_id=$3 and status='pending'
       returning id,email,display_name,role,status,expires_at,accepted_at,created_at,invited_by`,
      [inviteId, actor.workspaceId, clientId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Bekleyen davet bulunamadı veya davet artık değiştirilemez.' });
    res.json({ revoked: true, invite: result.rows[0] });
  } catch (error) {
    res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientInviteRouter.get('/:token', async (req, res) => {
  try {
    await ensureInviteSchema();
    const token = String(req.params.token || '');
    const email = await verifiedActorEmailFromRequest(req);
    const result = await pool.query(
      `select i.id,i.workspace_id,i.client_id,i.email,i.display_name,i.role,i.status,i.expires_at,
        c.name client_name,c.domain client_domain,coalesce(b.brand_name,w.name) brand_name,
        b.logo_url,b.primary_color,b.accent_color
       from client_portal_invites i
       join agency_clients c on c.id=i.client_id and c.workspace_id=i.workspace_id
       join agency_workspaces w on w.id=i.workspace_id
       left join workspace_branding b on b.workspace_id=i.workspace_id
       where i.token_hash=$1 and i.status='pending' and i.expires_at>now()
       limit 1`,
      [hashToken(token)]
    );
    const invite = result.rows[0];
    if (!invite) throw new Error('INVITE_NOT_FOUND');
    if (String(invite.email).toLowerCase() !== email.toLowerCase()) throw new Error('INVITE_EMAIL_MISMATCH');
    res.json({ invite, authenticatedEmail: email });
  } catch (error) {
    res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientInviteRouter.post('/:token/accept', async (req, res) => {
  const db = await pool.connect();
  try {
    await ensureInviteSchema();
    const token = String(req.params.token || '');
    const email = await verifiedActorEmailFromRequest(req);
    await db.query('begin');
    const result = await db.query(
      `select i.*
       from client_portal_invites i
       join agency_clients c on c.id=i.client_id and c.workspace_id=i.workspace_id
       join agency_workspaces w on w.id=i.workspace_id
       where i.token_hash=$1 and i.status='pending' and i.expires_at>now()
         and c.status='active' and w.status='active'
       for update of i,c,w`,
      [hashToken(token)]
    );
    const invite = result.rows[0];
    if (!invite) throw new Error('INVITE_NOT_FOUND');
    if (String(invite.email).toLowerCase() !== email.toLowerCase()) throw new Error('INVITE_EMAIL_MISMATCH');

    await db.query(
      `insert into client_portal_users(workspace_id,client_id,email,display_name,role,status)
       values($1,$2,$3,$4,$5,'active')
       on conflict(workspace_id,client_id,email)
       do update set display_name=excluded.display_name,role=excluded.role,status='active',updated_at=now()`,
      [invite.workspace_id, invite.client_id, invite.email, invite.display_name, invite.role]
    );
    await db.query("update client_portal_invites set status='accepted',accepted_at=now() where id=$1", [invite.id]);
    await db.query('commit');
    res.json({ accepted: true, workspaceId: invite.workspace_id, clientId: invite.client_id, role: invite.role });
  } catch (error) {
    await db.query('rollback');
    res.status(errorStatus(error)).json({ error: errorMessage(error) });
  } finally {
    db.release();
  }
});
