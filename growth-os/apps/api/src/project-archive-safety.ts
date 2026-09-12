import type { PoolClient } from 'pg';

export async function reconcileArchivedProjectSafety(db:PoolClient,projectIds:string[]){
  if(projectIds.length===0)return;

  await db.query(
    `update oauth_states
     set expires_at=least(expires_at,now())
     where project_id=any($1::uuid[])`,
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
}
