import { pool } from './db.js';

let workspaceDomainSchemaReady:Promise<void>|null=null;

async function migrateWorkspaceScopedProjectDomains(){
  const client=await pool.connect();
  try{
    await client.query('begin');
    await client.query("select pg_advisory_xact_lock(hashtext('growth-os:project-domain-schema'))");

    // Create the tenant-scoped uniqueness guarantee before removing the legacy
    // global domain constraint, so there is never a window without protection.
    await client.query(`
      create unique index if not exists idx_projects_workspace_domain_unique
      on projects(workspace_id,domain)
    `);

    // Older installs created projects.domain as globally unique. That prevents
    // separate workspaces from managing the same customer/domain independently.
    await client.query('alter table projects drop constraint if exists projects_domain_key');
    await client.query('commit');
  }catch(error){
    await client.query('rollback');
    throw error;
  }finally{
    client.release();
  }
}

export async function ensureWorkspaceScopedProjectDomains(){
  workspaceDomainSchemaReady ??= migrateWorkspaceScopedProjectDomains();
  try{
    await workspaceDomainSchemaReady;
  }catch(error){
    // Allow a later request to retry after a transient database/deploy failure.
    workspaceDomainSchemaReady=null;
    throw error;
  }
}
