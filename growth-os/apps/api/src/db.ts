import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  await pool.query(`
    create extension if not exists pgcrypto;

    create table if not exists projects (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      domain text not null unique,
      created_at timestamptz not null default now()
    );

    create table if not exists agency_workspaces (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      slug text not null unique,
      status text not null default 'active',
      plan text not null default 'internal',
      settings jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists workspace_members (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references agency_workspaces(id) on delete cascade,
      email text not null,
      display_name text,
      role text not null default 'analyst',
      status text not null default 'active',
      permissions jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(workspace_id,email)
    );

    create table if not exists agency_clients (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references agency_workspaces(id) on delete cascade,
      name text not null,
      domain text,
      status text not null default 'active',
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(workspace_id,domain)
    );

    create table if not exists workspace_branding (
      workspace_id uuid primary key references agency_workspaces(id) on delete cascade,
      brand_name text,
      logo_url text,
      primary_color text,
      accent_color text,
      custom_domain text,
      report_footer text,
      settings jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    );

    insert into agency_workspaces(id,name,slug,status,plan)
      values('00000000-0000-4000-8000-000000000001','Growth OS','growth-os','active','internal')
      on conflict(id) do nothing;

    insert into workspace_members(workspace_id,email,display_name,role,status,permissions)
      values('00000000-0000-4000-8000-000000000001','teyfikgokdemir@outlook.com','Teyfik Gökdemir','owner','active','{"all":true}'::jsonb)
      on conflict(workspace_id,email) do nothing;

    alter table projects add column if not exists workspace_id uuid references agency_workspaces(id) on delete restrict;
    alter table projects add column if not exists client_id uuid references agency_clients(id) on delete set null;
    alter table projects add column if not exists status text not null default 'active';
    alter table projects add column if not exists archived_at timestamptz;
    alter table projects add column if not exists archived_by text;
    alter table projects alter column workspace_id set default '00000000-0000-4000-8000-000000000001';
    update projects set workspace_id='00000000-0000-4000-8000-000000000001' where workspace_id is null;
    alter table projects alter column workspace_id set not null;
    create index if not exists idx_projects_workspace_status on projects(workspace_id,status,created_at desc);

    insert into agency_clients(workspace_id,name,domain,status,metadata)
      select p.workspace_id,p.name,p.domain,'active',jsonb_build_object('migratedFromProjectId',p.id)
      from projects p
      where p.client_id is null
      on conflict(workspace_id,domain) do nothing;

    update projects p
      set client_id=c.id
      from agency_clients c
      where p.client_id is null and c.workspace_id=p.workspace_id and c.domain=p.domain;

    create or replace function growth_sync_project_client() returns trigger as $$
    declare
      resolved_client_id uuid;
    begin
      if new.workspace_id is null then
        new.workspace_id:='00000000-0000-4000-8000-000000000001';
      end if;
      if new.client_id is null then
        insert into agency_clients(workspace_id,name,domain,status,metadata)
        values(new.workspace_id,new.name,new.domain,'active',jsonb_build_object('autoCreated',true))
        on conflict(workspace_id,domain) do update set name=excluded.name,updated_at=now()
        returning id into resolved_client_id;
        new.client_id:=resolved_client_id;
      end if;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_growth_sync_project_client on projects;
    create trigger trg_growth_sync_project_client
      before insert or update of name,domain,workspace_id,client_id on projects
      for each row execute function growth_sync_project_client();

    create table if not exists audits (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      domain text not null,
      overall_score integer not null,
      seo_score integer not null,
      geo_score integer not null,
      aeo_score integer not null,
      aio_score integer not null,
      ads_readiness_score integer not null,
      payload jsonb not null,
      created_at timestamptz not null default now()
    );

    create table if not exists integrations (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      provider text not null,
      account_label text,
      external_account_id text,
      status text not null default 'disconnected',
      mode text not null default 'read_only',
      metadata jsonb not null default '{}'::jsonb,
      last_sync_at timestamptz,
      created_at timestamptz not null default now(),
      unique(project_id,provider,external_account_id)
    );

    create table if not exists oauth_states (
      state text primary key,
      project_id uuid not null references projects(id) on delete cascade,
      provider text not null,
      return_path text,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    );

    create table if not exists campaign_metrics (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      provider text not null,
      external_campaign_id text not null,
      campaign_name text not null,
      metric_date date not null,
      spend numeric not null default 0,
      impressions numeric not null default 0,
      clicks numeric not null default 0,
      conversions numeric not null default 0,
      attributed_revenue numeric not null default 0,
      crm_revenue numeric not null default 0,
      gross_profit numeric not null default 0,
      created_at timestamptz not null default now(),
      unique(project_id,provider,external_campaign_id,metric_date)
    );

    create table if not exists ads_sync_runs (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      provider text not null,
      status text not null,
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      records_count integer not null default 0,
      error text
    );

    create table if not exists project_execution_policy (
      project_id uuid primary key references projects(id) on delete cascade,
      external_execution_enabled boolean not null default false,
      ad_publishing_enabled boolean not null default false,
      budget_mutation_enabled boolean not null default false,
      creative_mutation_enabled boolean not null default false,
      updated_at timestamptz not null default now()
    );

    create table if not exists crm_leads (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      source text,
      campaign_id text,
      name text,
      email text,
      phone text,
      status text not null default 'new',
      lead_value numeric not null default 0,
      won_revenue numeric not null default 0,
      owner text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists business_targets (
      project_id uuid primary key references projects(id) on delete cascade,
      target_roas numeric,
      break_even_roas numeric,
      target_cpa numeric,
      target_mer numeric,
      avg_order_value numeric,
      gross_margin_pct numeric,
      return_rate_pct numeric,
      shipping_cost numeric,
      fee_pct numeric,
      updated_at timestamptz not null default now()
    );

    create table if not exists alerts (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      source text not null,
      severity text not null,
      title text not null,
      message text not null,
      status text not null default 'open',
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      resolved_at timestamptz
    );

    create table if not exists recommendations (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      source text not null,
      priority text not null,
      title text not null,
      rationale text not null,
      proposed_action jsonb not null default '{}'::jsonb,
      status text not null default 'proposed',
      decided_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists action_log (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      recommendation_id uuid references recommendations(id) on delete set null,
      provider text,
      action_type text not null,
      status text not null,
      approved_by text,
      payload jsonb not null default '{}'::jsonb,
      executed_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists execution_jobs (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      recommendation_id uuid references recommendations(id) on delete set null,
      action_log_id uuid references action_log(id) on delete set null,
      provider text,
      action_type text not null,
      status text not null default 'queued',
      payload jsonb not null default '{}'::jsonb,
      result jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists verification_results (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      execution_job_id uuid not null references execution_jobs(id) on delete cascade,
      recommendation_id uuid references recommendations(id) on delete set null,
      status text not null,
      before_state jsonb not null default '{}'::jsonb,
      after_state jsonb not null default '{}'::jsonb,
      evidence jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_audits_project_created on audits(project_id,created_at desc);
    create index if not exists idx_campaign_metrics_project_date on campaign_metrics(project_id,metric_date desc);
    create index if not exists idx_recommendations_project_status on recommendations(project_id,status,created_at desc);
    create index if not exists idx_alerts_project_status on alerts(project_id,status,created_at desc);
    create index if not exists idx_execution_jobs_project_status on execution_jobs(project_id,status,created_at desc);
  `);
}