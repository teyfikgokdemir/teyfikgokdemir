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
