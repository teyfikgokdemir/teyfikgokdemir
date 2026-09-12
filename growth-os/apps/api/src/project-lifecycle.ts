import { Router } from 'express';
import { z } from 'zod';
import { pool } from './db.js';
import { initProjectLifecycleSchema } from './project-lifecycle-schema.js';
import { reconcileArchivedProjectSafety } from './project-archive-safety.js';
import { writeWorkspaceActivity } from './workspace-activity-log.js';
import { requireRole, resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const projectLifecycleRouter = Router({ mergeParams: true });

const projectLifecycleSchemaReady=initProjectLifecycleSchema();
async function ensureProjectLifecycleSchema(){
  await projectLifecycleSchemaReady;
}

const bulkSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1).max(200)
});

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

projectLifecycleRouter.post('/bulk/archive', async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Arşivlenecek geçerli proje kimlikleri gerekli.' });

  const db = await pool.connect();
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    const projectIds = [...new Set(parsed.data.projectIds)];

    await db.query('begin');
    const found = await db.query(
      `select id from projects where workspace_id=$1 and id=any($2::uuid[])`,
      [actor.workspaceId, projectIds]
    );
    if (found.rowCount !== projectIds.length) throw new Error('PROJECT_ACCESS_DENIED');

    const updated = await db.query(
      `update projects
       set status='archived',archived_at=coalesce(archived_at,now()),archived_by=coalesce(archived_by,$3)
       where workspace_id=$1 and id=any($2::uuid[]) and status<>'archived'
       returning id,name,domain,status,archived_at,archived_by`,
      [actor.workspaceId, projectIds, actor.email]
    );
    await db.query(
      `update oauth_states set expires_at=least(expires_at,now()) where project_id=any($1::uuid[])`,
      [projectIds]
    );
    await db.query(
      `update project_execution_policy
       set ads_write_enabled=false,updated_at=now()
       where project_id=any($1::uuid[])`,
      [projectIds]
    );
    await db.query(
      `update execution_jobs
       set status='failed',
           error_message='Proje arşivlendi; bekleyen veya çalışan execution durduruldu.',
           finished_at=coalesce(finished_at,now())
       where project_id=any($1::uuid[]) and status in ('queued','in_progress')`,
      [projectIds]
    );
    for (const project of updated.rows) {
      await writeWorkspaceActivity(db, {
        workspaceId: actor.workspaceId,
        actorEmail: actor.email,
        action: 'project.archived',
        entityType: 'project',
        entityId: String(project.id),
        entityName: String(project.name),
        metadata: { domain: project.domain, bulk: true }
      });
    }
    await db.query('commit');

    res.json({ archived: true, requested: projectIds.length, changed: updated.rowCount || 0, projects: updated.rows });
  } catch (error) {
    await db.query('rollback');
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  } finally {
    db.release();
  }
});

projectLifecycleRouter.post('/bulk/restore', async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Geri alınacak geçerli proje kimlikleri gerekli.' });

  const db = await pool.connect();
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');
    const projectIds = [...new Set(parsed.data.projectIds)];

    await db.query('begin');
    const found = await db.query(
      `select id from projects where workspace_id=$1 and id=any($2::uuid[])`,
      [actor.workspaceId, projectIds]
    );
    if (found.rowCount !== projectIds.length) throw new Error('PROJECT_ACCESS_DENIED');

    const updated = await db.query(
      `update projects
       set status='active',archived_at=null,archived_by=null
       where workspace_id=$1 and id=any($2::uuid[]) and status='archived'
       returning id,name,domain,status,archived_at,archived_by`,
      [actor.workspaceId, projectIds]
    );
    for (const project of updated.rows) {
      await writeWorkspaceActivity(db, {
        workspaceId: actor.workspaceId,
        actorEmail: actor.email,
        action: 'project.restored',
        entityType: 'project',
        entityId: String(project.id),
        entityName: String(project.name),
        metadata: { domain: project.domain, bulk: true, executionPolicyReenabled: false }
      });
    }
    await db.query('commit');

    res.json({ restored: true, requested: projectIds.length, changed: updated.rowCount || 0, projects: updated.rows });
  } catch (error) {
    await db.query('rollback');
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  } finally {
    db.release();
  }
});

projectLifecycleRouter.post('/:projectId/archive', async (req, res) => {
  const db = await pool.connect();
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const projectId = String(req.params.projectId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');

    await db.query('begin');
    const locked = await db.query(
      `select id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at
       from projects where id=$1 and workspace_id=$2 for update`,
      [projectId, actor.workspaceId]
    );
    const project = locked.rows[0];
    if (!project) throw new Error('PROJECT_ACCESS_DENIED');
    await reconcileArchivedProjectSafety(db, [projectId]);
    if (project.status === 'archived') {
      await db.query('commit');
      return res.json({ archived: true, project });
    }

    const { rows } = await db.query(
      `update projects
       set status='archived',archived_at=coalesce(archived_at,now()),archived_by=coalesce(archived_by,$3)
       where id=$1 and workspace_id=$2
       returning id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at`,
      [projectId, actor.workspaceId, actor.email]
    );
    await writeWorkspaceActivity(db, {
      workspaceId: actor.workspaceId,
      actorEmail: actor.email,
      action: 'project.archived',
      entityType: 'project',
      entityId: projectId,
      entityName: String(rows[0].name),
      metadata: { domain: rows[0].domain, bulk: false }
    });
    await db.query('commit');

    res.json({ archived: true, project: rows[0] });
  } catch (error) {
    await db.query('rollback');
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  } finally {
    db.release();
  }
});

projectLifecycleRouter.post('/:projectId/restore', async (req, res) => {
  const db = await pool.connect();
  try {
    await ensureProjectLifecycleSchema();
    const workspaceId = String((req.params as Record<string, string | undefined>).workspaceId || '');
    const projectId = String(req.params.projectId || '');
    const actor = await resolveWorkspaceActor(req, workspaceId);
    requireRole(actor, 'admin');

    await db.query('begin');
    const locked = await db.query(
      `select id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at
       from projects where id=$1 and workspace_id=$2 for update`,
      [projectId, actor.workspaceId]
    );
    const project = locked.rows[0];
    if (!project) throw new Error('PROJECT_ACCESS_DENIED');
    if (project.status === 'active') {
      await db.query('commit');
      return res.json({ restored: true, project });
    }

    const { rows } = await db.query(
      `update projects
       set status='active',archived_at=null,archived_by=null
       where id=$1 and workspace_id=$2
       returning id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at`,
      [projectId, actor.workspaceId]
    );
    await writeWorkspaceActivity(db, {
      workspaceId: actor.workspaceId,
      actorEmail: actor.email,
      action: 'project.restored',
      entityType: 'project',
      entityId: projectId,
      entityName: String(rows[0].name),
      metadata: { domain: rows[0].domain, bulk: false, executionPolicyReenabled: false }
    });
    await db.query('commit');

    res.json({ restored: true, project: rows[0] });
  } catch (error) {
    await db.query('rollback');
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  } finally {
    db.release();
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

    await db.query('begin');
    const locked = await db.query(
      `select id,workspace_id,client_id,name,domain,status,archived_at,archived_by,created_at
       from projects where id=$1 and workspace_id=$2 for update`,
      [projectId, actor.workspaceId]
    );
    const project = locked.rows[0];
    if (!project) throw new Error('PROJECT_ACCESS_DENIED');

    if (project.status !== 'archived') {
      await db.query('rollback');
      return res.status(409).json({ error: 'Bir proje kalıcı silinmeden önce arşivlenmelidir.' });
    }
    if (parsed.data.confirmName.trim() !== String(project.name).trim()) {
      await db.query('rollback');
      return res.status(409).json({ error: 'Proje adı doğrulaması eşleşmiyor.' });
    }

    const deleted = await db.query(
      `delete from projects
       where id=$1 and workspace_id=$2 and status='archived'
       returning id,name,domain,client_id`,
      [projectId, actor.workspaceId]
    );
    if (!deleted.rows[0]) throw new Error('PROJECT_ACCESS_DENIED');
    await writeWorkspaceActivity(db, {
      workspaceId: actor.workspaceId,
      actorEmail: actor.email,
      action: 'project.deleted',
      entityType: 'project',
      entityId: projectId,
      entityName: String(project.name),
      metadata: {
        domain: project.domain,
        clientId: project.client_id,
        archivedAt: project.archived_at,
        archivedBy: project.archived_by,
        createdAt: project.created_at
      }
    });
    await db.query('commit');

    res.json({ deleted: true, project: deleted.rows[0] });
  } catch (error) {
    await db.query('rollback');
    res.status(workspaceErrorStatus(error)).json({ error: workspaceErrorMessage(error) });
  } finally {
    db.release();
  }
});
