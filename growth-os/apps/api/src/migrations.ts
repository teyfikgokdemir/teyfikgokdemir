import type { PoolClient } from 'pg';
import { pool } from './db.js';

type Migration={
  version:string;
  up:(client:PoolClient)=>Promise<void>;
};

const migrations:Migration[]=[
  {
    version:'001_workspace_scoped_project_domains',
    async up(client){
      await client.query(`
        create unique index if not exists idx_projects_workspace_domain_unique
        on projects(workspace_id,domain)
      `);
      await client.query('alter table projects drop constraint if exists projects_domain_key');
    }
  },
  {
    version:'002_client_portal_schema',
    async up(client){
      await client.query(`
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

        create index if not exists idx_client_portal_users_access
        on client_portal_users(workspace_id,client_id,status);

        create index if not exists idx_client_decisions_client
        on client_decisions(client_id,created_at desc);

        create index if not exists idx_client_portal_invites_client
        on client_portal_invites(workspace_id,client_id,status,created_at desc);

        create index if not exists idx_client_portal_invites_expiry
        on client_portal_invites(status,expires_at);
      `);
    }
  }
];

export async function runMigrations(){
  const client=await pool.connect();
  try{
    await client.query('begin');
    await client.query("select pg_advisory_xact_lock(hashtext('growth-os:schema-migrations'))");
    await client.query(`
      create table if not exists schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    for(const migration of migrations){
      const applied=await client.query('select 1 from schema_migrations where version=$1',[migration.version]);
      if(applied.rows[0])continue;
      await migration.up(client);
      await client.query('insert into schema_migrations(version) values($1)',[migration.version]);
    }

    await client.query('commit');
  }catch(error){
    await client.query('rollback');
    throw error;
  }finally{
    client.release();
  }
}
