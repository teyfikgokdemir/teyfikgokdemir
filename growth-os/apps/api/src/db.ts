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
    alter table projects alter column workspace_id set default '00000000-0000-4000-8000-000000000001';
    update projects set workspace_id='00000000-0000-4000-8000-000000000001' where workspace_id is null;
    alter table projects alter column workspace_id set not null;

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

    create table if not exists execution_jobs (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      recommendation_id uuid references recommendations(id) on delete set null,
      action_log_id uuid references action_log(id) on delete set null,
      provider text not null,
      action_type text not null,
      status text not null default 'queued',
      execution_mode text not null default 'manual_approval',
      requested_state jsonb not null default '{}'::jsonb,
      result_state jsonb not null default '{}'::jsonb,
      error_message text,
      created_at timestamptz not null default now(),
      started_at timestamptz,
      finished_at timestamptz
    );

    create table if not exists verification_results (
      id uuid primary key default gen_random_uuid(),
      project_id uuid not null references projects(id) on delete cascade,
      execution_job_id uuid references execution_jobs(id) on delete cascade,
      recommendation_id uuid references recommendations(id) on delete set null,
      status text not null default 'pending',
      verification_type text not null,
      before_state jsonb not null default '{}'::jsonb,
      after_state jsonb not null default '{}'::jsonb,
      score_before numeric(10,3),
      score_after numeric(10,3),
      score_delta numeric(10,3),
      verdict text,
      evidence jsonb not null default '{}'::jsonb,
      verified_at timestamptz,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id,status);
    create index if not exists idx_agency_clients_workspace on agency_clients(workspace_id,status);
    create index if not exists idx_projects_workspace on projects(workspace_id,created_at desc);
    create index if not exists idx_projects_client on projects(client_id);
    create index if not exists idx_audits_project_created on audits(project_id, created_at desc);
    create index if not exists idx_campaign_metrics_project_date on campaign_metrics(project_id, metric_date desc);
    create index if not exists idx_ads_sync_runs_project_started on ads_sync_runs(project_id, started_at desc);
    create index if not exists idx_crm_leads_project_status on crm_leads(project_id, status);
    create index if not exists idx_alerts_project_status on alerts(project_id, status, created_at desc);
    create index if not exists idx_recommendations_project_status on recommendations(project_id, status, created_at desc);
    create index if not exists idx_oauth_states_expiry on oauth_states(expires_at);
    create index if not exists idx_execution_jobs_project_status on execution_jobs(project_id, status, created_at desc);
    create index if not exists idx_verification_results_project_status on verification_results(project_id, status, created_at desc);
    create unique index if not exists idx_execution_jobs_recommendation_unique on execution_jobs(recommendation_id) where recommendation_id is not null;

    create or replace function growth_apply_audit_decision() returns trigger as $$
    declare
      impact text;
      impact_weight integer;
      priority_score integer;
      priority_label text;
      recommendation_text text;
    begin
      if new.source='audit_engine' and coalesce(new.proposed_action->'decision'->>'modelVersion','')<>'decision-v1' then
        recommendation_text:=lower(coalesce(new.title,'')||' '||coalesce(new.rationale,'')||' '||coalesce(new.proposed_action->>'recommendation',''));

        if lower(coalesce(new.priority,'')) in ('critical','high')
          or recommendation_text like '%conversion%'
          or recommendation_text like '%dönüşüm%'
          or recommendation_text like '%revenue%'
          or recommendation_text like '%ciro%'
          or recommendation_text like '%tracking%'
          or recommendation_text like '%ölçüm%'
          or recommendation_text like '%index%'
          or recommendation_text like '%merchant%' then
          impact:='HIGH'; impact_weight:=3;
        elsif lower(coalesce(new.priority,''))='low'
          or recommendation_text like '%cosmetic%'
          or recommendation_text like '%minor%' then
          impact:='LOW'; impact_weight:=1;
        else
          impact:='MEDIUM'; impact_weight:=2;
        end if;

        priority_score:=greatest(1,least(100,round((impact_weight*35 + 3*20 + 3*25 + 2*5)::numeric/2.8)::integer));
        priority_label:=case when priority_score>=80 then 'HEMEN' when priority_score>=65 then 'YÜKSEK' when priority_score>=45 then 'ORTA' else 'BEKLEYEBİLİR' end;

        new.proposed_action:=coalesce(new.proposed_action,'{}'::jsonb)||jsonb_build_object(
          'decision',jsonb_build_object(
            'risk','MEDIUM',
            'impact',impact,
            'effort','LOW',
            'confidence','HIGH',
            'score',priority_score,
            'label',priority_label,
            'modelVersion','decision-v1'
          )
        );
      end if;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_growth_apply_audit_decision on recommendations;
    create trigger trg_growth_apply_audit_decision
      before insert or update of proposed_action,priority,source,title,rationale on recommendations
      for each row execute function growth_apply_audit_decision();

    update recommendations
      set proposed_action=proposed_action
      where source='audit_engine'
        and status='proposed'
        and coalesce(proposed_action->'decision'->>'modelVersion','')<>'decision-v1';

    create or replace function growth_enqueue_approved_action() returns trigger as $$
    begin
      if new.status='approved' and new.recommendation_id is not null then
        insert into execution_jobs(project_id,recommendation_id,action_log_id,provider,action_type,status,execution_mode,requested_state)
        values(new.project_id,new.recommendation_id,new.id,coalesce(new.provider,'system'),new.action_type,'queued','manual_approval',coalesce(new.requested_state,'{}'::jsonb))
        on conflict (recommendation_id) where recommendation_id is not null do nothing;
        update action_log set status='queued' where id=new.id and status='approved';
      end if;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_growth_enqueue_approved_action on action_log;
    create trigger trg_growth_enqueue_approved_action
      after insert on action_log
      for each row execute function growth_enqueue_approved_action();

    create or replace function growth_sync_execution_status() returns trigger as $$
    begin
      if new.action_log_id is not null then
        update action_log
        set status=new.status,
            executed_at=case when new.status in ('verification_pending','verified') then coalesce(executed_at,now()) else executed_at end
        where id=new.action_log_id;
      end if;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_growth_sync_execution_status on execution_jobs;
    create trigger trg_growth_sync_execution_status
      after insert or update of status on execution_jobs
      for each row execute function growth_sync_execution_status();
  `);
}
