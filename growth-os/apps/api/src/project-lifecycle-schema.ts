import { pool } from './db.js';

export async function initProjectLifecycleSchema(){
  await pool.query(`
    alter table projects add column if not exists status text not null default 'active';
    alter table projects add column if not exists archived_at timestamptz;
    alter table projects add column if not exists archived_by text;
    create index if not exists idx_projects_workspace_status on projects(workspace_id,status,created_at desc);
  `);
}
