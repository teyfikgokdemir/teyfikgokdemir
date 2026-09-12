import { Router } from 'express';
import { z } from 'zod';
import { pool } from './db.js';
import { requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const projectLifecycleRouter = Router({ mergeParams: true });

async function ensureProjectLifecycleSchema() {
  await pool.query(`
    alter table projects add column if not exists status text not null default 'active';
    alter table projects add column if not exists archived_at timestamptz;
    alter table projects add column if not exists archived_by text;
    create index if not exists idx_projects_workspace_status on projects(workspace_id,status,created_at desc);
  `);
}

async function getProject(workspaceId: string, projectId: string) {
  const { rows } = await pool.query(
    `select id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at
     from projects where id=$1 and workspace_id=$2 limit 1`,
    [projectId, workspaceId]
  );
  if (!rows[0]) throw new Error('PROJECT_ACCESS_DENIED');
  return rows[0];
}

projectLifecycleRouter.get('/', async (req, res) => {
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    const includeArchived = String(req.query.includeArchived || '') === 'true';
    const { rows } = await pool.query(
      `select p.id,p.name,p.domain,p.status,p.archived_at,p.archived_by,p.created_at,p.client_id,
              c.name client_name,c.status client_status
       from projects p
       left join agency_clients c on c.id=p.client_id and c.workspace_id=p.workspace_id
       where p.workspace_id=$1 ${includeArchived ? '' : "and p.status='active'"}
       order by case when p.status='active' then 0 else 1 end,p.created_at desc`,
      [actor.workspaceId]
    );
    res.json({ projects: rows, includeArchived });
  } catch (error) {
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  }
});

projectLifecycleRouter.post('/:projectId/archive', async (req, res) => {
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const projectId = String(req.params.projectId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    const project = await getProject(actor.workspaceId, projectId);
    if (project.status === 'archived') return res.json({ archived: true, project });

    const { rows } = await pool.query(
      `update projects
       set status='archived',archived_at=now(),archived_by=$3
       where id=$1 and workspace_id=$2
       returning id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at`,
      [projectId, actor.workspaceId, actor.email]
    );

    await pool.query(
      `update oauth_states set expires_at=least(expires_at,now()) where project_id=$1`,
      [projectId]
    );

    res.json({ archived: true, project: rows[0] });
  } catch (error) {
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  }
});

projectLifecycleRouter.post('/:projectId/restore', async (req, res) => {
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const projectId = String(req.params.projectId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    const project = await getProject(actor.workspaceId, projectId);
    if (project.status === 'active') return res.json({ restored: true, project });

    const { rows } = await pool.query(
      `update projects
       set status='active',archived_at=null,archived_by=null
       where id=$1 and workspace_id=$2
       returning id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at`,
      [projectId, actor.workspaceId]
    );
    res.json({ restored: true, project: rows[0] });
  } catch (error) {
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  }
});

projectLifecycleRouter.delete('/:projectId', async (req, res) => {
  const parsed = z.object({ confirmName: z.string().min(1).max(200) }).safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Kalıcı silme için proje adını doğrulayın.' });

  const db = await pool.connect();
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const projectId = String(req.params.projectId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'owner');
    const project = await getProject(actor.workspaceId, projectId);

    if (project.status !== 'archived') {
      return res.status(409).json({ error: 'Bir proje kalıcı silinmeden önce arşivlenmelidir.' });
    }
    if (parsed.data.confirmName.trim() !== String(project.name).trim()) {
      return res.status(409).json({ error: 'Proje adı doğrulaması eşleşmiyor.' });
    }

    await db.query('begin');
    const deleted = await db.query(
      `delete from projects where id=$1 and workspace_id=$2 returning id,name,domain,client_id`,
      [projectId, actor.workspaceId]
    );
    if (!deleted.rows[0]) throw new Error('PROJECT_ACCESS_DENIED');
    await db.query('commit');

    res.json({ deleted: true, project: deleted.rows[0] });
  } catch (error) {
    await db.query('rollback');
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  } finally {
    db.release();
  }
});
