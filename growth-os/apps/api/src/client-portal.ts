import { Router } from 'express';
import { z } from 'zod';
import { pool } from './db.js';
import { actorEmailFromRequest, requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const clientPortalRouter = Router({ mergeParams: true });

let schemaReady = false;
let schemaInitializing: Promise<void> | null = null;

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
          unique(workspace_id, client_id, email)
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
          unique(client_id, recommendation_id)
        );
        create index if not exists idx_client_portal_users_access on client_portal_users(workspace_id, client_id, status);
        create index if not exists idx_client_decisions_client on client_decisions(client_id, created_at desc);
      `);
      schemaReady = true;
    })().finally(() => {
      schemaInitializing = null;
    });
  }
  await schemaInitializing;
}

async function assertClient(workspaceId: string, clientId: string) {
  const { rows } = await pool.query(
    "select id,workspace_id,name,domain,status,metadata from agency_clients where id=$1 and workspace_id=$2 and status='active'",
    [clientId, workspaceId]
  );
  if (!rows[0]) throw new Error('CLIENT_ACCESS_DENIED');
  return rows[0];
}

async function resolveClientUser(workspaceId: string, clientId: string, email: string) {
  await ensureClientPortalSchema();
  const { rows } = await pool.query(
    `select id,email,display_name,role,permissions,status
     from client_portal_users
     where workspace_id=$1 and client_id=$2 and lower(email)=lower($3) and status='active'
     limit 1`,
    [workspaceId, clientId, email]
  );
  if (!rows[0]) throw new Error('CLIENT_PORTAL_ACCESS_DENIED');
  return rows[0];
}

function errorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : '';
  if (message === 'CLIENT_ACCESS_DENIED') return 404;
  if (message === 'CLIENT_PORTAL_ACCESS_DENIED') return 403;
  return workspaceErrorStatus(error);
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message === 'CLIENT_ACCESS_DENIED') return 'Müşteri bulunamadı.';
  if (message === 'CLIENT_PORTAL_ACCESS_DENIED') return 'Bu müşteri portalına erişim yetkiniz yok.';
  return workspaceErrorMessage(error);
}

clientPortalRouter.get('/:clientId/portal', async (req, res) => {
  try {
    await ensureClientPortalSchema();
    const workspaceId = String(req.params.workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const email = actorEmailFromRequest(req);

    const [client, user, branding, projects] = await Promise.all([
      assertClient(workspaceId, clientId),
      resolveClientUser(workspaceId, clientId, email),
      pool.query('select brand_name,logo_url,primary_color,accent_color,custom_domain,report_footer,settings from workspace_branding where workspace_id=$1', [workspaceId]),
      pool.query('select id,name,domain,created_at from projects where workspace_id=$1 and client_id=$2 order by created_at desc', [workspaceId, clientId])
    ]);

    const projectIds: string[] = projects.rows.map((project: { id: string }) => project.id);
    if (projectIds.length === 0) {
      return res.json({ client, user, branding: branding.rows[0] || null, projects: [], summary: {}, recommendations: [], results: [], decisions: [] });
    }

    const [auditSummary, recommendations, results, metrics, decisions] = await Promise.all([
      pool.query(`select distinct on (project_id) project_id,overall_score,seo_score,geo_score,aeo_score,aio_score,ads_readiness_score,created_at from audits where project_id=any($1::uuid[]) order by project_id,created_at desc`, [projectIds]),
      pool.query(`select r.id,r.project_id,r.priority,r.title,r.rationale,r.proposed_action,r.status,r.created_at,p.name project_name from recommendations r join projects p on p.id=r.project_id where r.project_id=any($1::uuid[]) and r.status in ('proposed','approved') order by r.created_at desc limit 50`, [projectIds]),
      pool.query(`select v.id,v.project_id,v.recommendation_id,v.status,v.verification_type,v.score_before,v.score_after,v.score_delta,v.verdict,v.verified_at,p.name project_name from verification_results v join projects p on p.id=v.project_id where v.project_id=any($1::uuid[]) and v.status='passed' order by v.verified_at desc nulls last,v.created_at desc limit 30`, [projectIds]),
      pool.query(`select coalesce(sum(spend),0)::numeric spend,coalesce(sum(attributed_revenue),0)::numeric revenue,coalesce(sum(gross_profit),0)::numeric gross_profit,coalesce(sum(conversions),0)::numeric conversions from campaign_metrics where project_id=any($1::uuid[]) and metric_date>=current_date-interval '30 days'`, [projectIds]),
      pool.query(`select id,project_id,recommendation_id,decision,note,decided_by,created_at from client_decisions where workspace_id=$1 and client_id=$2 order by created_at desc limit 100`, [workspaceId, clientId])
    ]);

    const metricRow = metrics.rows[0] || {};
    const spend = Number(metricRow.spend || 0);
    const revenue = Number(metricRow.revenue || 0);
    const pendingRecommendations = recommendations.rows.filter((row: { status?: string }) => row.status === 'proposed').length;

    return res.json({
      client,
      user,
      branding: branding.rows[0] || null,
      projects: projects.rows,
      summary: {
        projectCount: projects.rows.length,
        latestAudits: auditSummary.rows,
        pendingRecommendations,
        verifiedResults: results.rows.length,
        metrics30d: {
          spend,
          revenue,
          grossProfit: Number(metricRow.gross_profit || 0),
          conversions: Number(metricRow.conversions || 0),
          roas: spend > 0 ? revenue / spend : null
        }
      },
      recommendations: recommendations.rows,
      results: results.rows,
      decisions: decisions.rows
    });
  } catch (error) {
    return res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientPortalRouter.post('/:clientId/portal/recommendations/:recommendationId/decision', async (req, res) => {
  const parsed = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().max(1000).optional() }).safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Müşteri kararı geçersiz.' });

  try {
    await ensureClientPortalSchema();
    const workspaceId = String(req.params.workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const recommendationId = String(req.params.recommendationId || '');
    const email = actorEmailFromRequest(req);

    await Promise.all([assertClient(workspaceId, clientId), resolveClientUser(workspaceId, clientId, email)]);
    const rec = await pool.query(
      `select r.id,r.project_id,r.status from recommendations r join projects p on p.id=r.project_id where r.id=$1 and p.workspace_id=$2 and p.client_id=$3 and r.status in ('proposed','approved')`,
      [recommendationId, workspaceId, clientId]
    );
    if (!rec.rows[0]) return res.status(404).json({ error: 'Karar verilebilir öneri bulunamadı.' });

    const { rows } = await pool.query(
      `insert into client_decisions(workspace_id,client_id,project_id,recommendation_id,decided_by,decision,note)
       values($1,$2,$3,$4,$5,$6,$7)
       on conflict(client_id,recommendation_id) do update set decided_by=excluded.decided_by,decision=excluded.decision,note=excluded.note,created_at=now()
       returning *`,
      [workspaceId, clientId, rec.rows[0].project_id, recommendationId, email, parsed.data.decision, parsed.data.note || null]
    );

    return res.json({ decision: rows[0], executionTriggered: false, note: 'Müşteri kararı kaydedildi. Bu işlem harici sistemlerde değişiklik başlatmaz.' });
  } catch (error) {
    return res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientPortalRouter.get('/:clientId/portal-users', async (req, res) => {
  try {
    await ensureClientPortalSchema();
    const workspaceId = String(req.params.workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    await assertClient(actor.workspaceId, clientId);
    const { rows } = await pool.query(
      'select id,email,display_name,role,status,permissions,created_at,updated_at from client_portal_users where workspace_id=$1 and client_id=$2 order by created_at',
      [actor.workspaceId, clientId]
    );
    return res.json(rows);
  } catch (error) {
    return res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});

clientPortalRouter.post('/:clientId/portal-users', async (req, res) => {
  const parsed = z.object({ email: z.string().email(), displayName: z.string().min(1).max(120).optional(), role: z.enum(['client_admin', 'client_viewer']).default('client_viewer') }).safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Portal kullanıcısı bilgileri geçersiz.' });

  try {
    await ensureClientPortalSchema();
    const workspaceId = String(req.params.workspaceId || '');
    const clientId = String(req.params.clientId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    await assertClient(actor.workspaceId, clientId);
    const data = parsed.data;
    const { rows } = await pool.query(
      `insert into client_portal_users(workspace_id,client_id,email,display_name,role,status)
       values($1,$2,lower($3),$4,$5,'active')
       on conflict(workspace_id,client_id,email) do update set display_name=excluded.display_name,role=excluded.role,status='active',updated_at=now()
       returning id,email,display_name,role,status,permissions,created_at,updated_at`,
      [actor.workspaceId, clientId, data.email, data.displayName || null, data.role]
    );
    return res.status(201).json({ user: rows[0] });
  } catch (error) {
    return res.status(errorStatus(error)).json({ error: errorMessage(error) });
  }
});
