import { pool } from './db.js';

export async function initProjectLifecycleSchema(){
  await pool.query(`
    alter table projects add column if not exists status text not null default 'active';
    alter table projects add column if not exists archived_at timestamptz;
    alter table projects add column if not exists archived_by text;
    do $$
    begin
      if not exists (
        select 1
        from pg_constraint
        where conname='projects_status_check'
          and conrelid='projects'::regclass
      ) then
        alter table projects
          add constraint projects_status_check
          check (status in ('active','archived')) not valid;
      end if;
    end
    $$;
    create index if not exists idx_projects_workspace_status on projects(workspace_id,status,created_at desc);

    create table if not exists workspace_activity_log(
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references agency_workspaces(id) on delete cascade,
      actor_email text not null,
      action text not null,
      entity_type text not null,
      entity_id text,
      entity_name text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
    create index if not exists idx_workspace_activity_log_workspace_created
      on workspace_activity_log(workspace_id,created_at desc);
  `);
}
