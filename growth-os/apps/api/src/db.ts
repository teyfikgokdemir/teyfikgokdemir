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
      unique(project_id, provider, external_account_id)
    );

    create table if not exists oauth_states (
      state text primary key,
      project_id uuid not null references projects(id) on delete cascade,
      provider text not null,
      return_path text,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create table if not exists campaign_metrics (
      id bigserial primary key,
      project_id uuid not null references projects(id) on delete cascade,
      provider text not null,
      external_campaign_id text not null,
      campaign_name text not null,
      metric_date date not null,
      spend numeric(14,2) not null default 0,
      impressions bigint not null default 0,
      clicks bigint not null default 0,
      conversions numeric(14,2) not null default 0,
      attributed_revenue numeric(14,2) not null default 0,
      crm_revenue numeric(14,2) not null default 0,
      gross_profit numeric(14,2) not null default 0,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      unique(project_id, provider, external_campaign_id, metric_date)
    );

    create table if not exists ads_sync_runs (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      status text not null default 'running',
      requested_days integer not null default 30,
      provider_results jsonb not null default '[]'::jsonb,
      metrics_written integer not null default 0,
      alerts_created integer not null default 0,
      recommendations_created integer not null default 0,
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      error_message text
    );

    create table if not exists project_execution_policy (
      project_id uuid primary key references projects(id) on delete cascade,
      ads_write_enabled boolean not null default false,
      require_manual_approval boolean not null default true,
      max_daily_budget_change_pct numeric(8,4),
      allowed_providers text[] not null default '{}'::text[],
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
      lead_value numeric(14,2) not null default 0,
      won_revenue numeric(14,2) not null default 0,
      owner text,
      first_touch_at timestamptz,
      last_touch_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists business_targets (
      project_id uuid primary key references projects(id) on delete cascade,
      target_roas numeric(10,3),
      break_even_roas numeric(10,3),
      target_cpa numeric(14,2),
      target_mer numeric(10,3),
      avg_order_value numeric(14,2),
      gross_margin_pct numeric(8,4),
      return_rate_pct numeric(8,4),
      shipping_cost numeric(14,2),
      fee_pct numeric(8,4),
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
      created_at timestamptz not null default now(),
      decided_at timestamptz
    );

    create table if not exists action_log (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      recommendation_id uuid references recommendations(id) on delete set null,
      provider text,
      action_type text not null,
      status text not null,
      before_state jsonb,
      requested_state jsonb,
      after_state jsonb,
      approved_by text,
      executed_at timestamptz,
      rollback_payload jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_audits_project_created on audits(project_id, created_at desc);
    create index if not exists idx_campaign_metrics_project_date on campaign_metrics(project_id, metric_date desc);
    create index if not exists idx_ads_sync_runs_project_started on ads_sync_runs(project_id, started_at desc);
    create index if not exists idx_crm_leads_project_status on crm_leads(project_id, status);
    create index if not exists idx_alerts_project_status on alerts(project_id, status, created_at desc);
    create index if not exists idx_recommendations_project_status on recommendations(project_id, status, created_at desc);
    create index if not exists idx_oauth_states_expiry on oauth_states(expires_at);
  `);
}
