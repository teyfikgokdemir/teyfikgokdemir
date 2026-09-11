import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  await pool.query(`
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
  `);
}
