import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';

// Run after npm run build, against a disposable local PostgreSQL database only.
const url = new URL(process.argv[2] || '');
assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
const db = new Pool({ connectionString: url.href });
const projectId = '550e8400-e29b-41d4-a716-446655440000';
const abortMessage = 'Proje arşivlendi; reklam senkronizasyonu durduruldu.';
const schema = 'ads_sync_test_' + Date.now();
await db.query(`create schema ${schema}`);
const pool = new Pool({ connectionString: url.href, options: `-c search_path=${schema}` });
let boundary = 0, archiveAt = 0, fetches = 0, duringFetch = false, pagination = false;
let failInsert = false, concurrentArchive = false, archivePromise, externallyFailed = false;
const archive = () => pool.query("update projects set status='archived' where id=$1", [projectId]);
const guardedPool = {
  query: (...args) => pool.query(...args),
  async connect() {
    const client = await pool.connect();
    return {
      async query(sql, params) {
        if (sql.includes('select status') && sql.includes('for update')) {
          boundary++;
          if (boundary === archiveAt) await archive();
          if (externallyFailed && boundary === 5) await pool.query("update ads_sync_runs set status='failed',error_message='External stop',finished_at=now()");
        }
        if (sql.includes('insert into campaign_metrics')) {
          if (concurrentArchive) {
            let completed = false;
            archivePromise = archive().then(() => { completed = true; });
            await delay(75);
            assert.equal(completed, false, 'archive must wait for the metric write transaction');
          }
        }
        // Fail after the metric INSERT to prove the whole provider transaction rolls back.
        if (failInsert && sql.includes('update integrations')) throw Error('Injected metric failure');
        const result = await client.query(sql, params);
        if (sql === 'commit' && archivePromise) { await archivePromise; archivePromise = undefined; }
        return result;
      },
      release: () => client.release(),
    };
  },
};
async function load(name, bindings) {
  const source = (await readFile(new URL(`../dist/${name}.js`, import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '').replace(/export async function /g, 'async function ');
  return vm.runInNewContext(source + `\n(${name === 'ads-sync' ? 'syncAdsProject' : 'refreshGrowthIntelligence'})`, { ...bindings, Error });
}
const growth = await load('growth-intelligence', {
  pool: guardedPool,
  discoverGoogleResources: async () => ({ analyticsPerformance: { matched: true, summary: { sessions: 10, keyEvents: 0 } } }),
  searchConsolePerformanceForProject: async () => ({}),
  attachRecommendationDecision: x => x.proposedAction,
  attachRevenueImpact: x => x.proposedAction,
});
const sync = await load('ads-sync', {
  pool: guardedPool, refreshGrowthIntelligence: growth, process, URL,
  decryptSecret: () => 'test-token', googleAccessForProject: async () => 'test-token',
  fetch: async input => {
    fetches++;
    assert.match(String(input), /^https:\/\/graph.facebook.com\//);
    if (duringFetch) await archive();
    return { ok: true, json: async () => ({ data: [{ campaign_id: 'c', campaign_name: 'Campaign', date_start: new Date().toISOString().slice(0, 10), spend: '20', impressions: '100', clicks: '10' }], paging: pagination ? { next: 'https://graph.facebook.com/next' } : undefined }) };
  },
});
try {
  await pool.query(`
    create table projects(id uuid primary key,status text,domain text);
    create table integrations(id uuid default gen_random_uuid(),project_id uuid,provider text,status text,account_label text,external_account_id text,metadata jsonb,created_at timestamptz default now(),last_sync_at timestamptz);
    create table campaign_metrics(project_id uuid,provider text,external_campaign_id text,campaign_name text,metric_date date,spend numeric,impressions numeric,clicks numeric,conversions numeric,attributed_revenue numeric,metadata jsonb,unique(project_id,provider,external_campaign_id,metric_date));
    create table business_targets(project_id uuid,target_roas numeric,target_cpa numeric,break_even_roas numeric);
    create table alerts(project_id uuid,source text,severity text,title text,message text,status text,payload jsonb,resolved_at timestamptz);
    create table recommendations(project_id uuid,source text,priority text,title text,rationale text,proposed_action jsonb,status text,decided_at timestamptz);
    create table ads_sync_runs(id uuid default gen_random_uuid(),project_id uuid references projects(id) on delete cascade,status text default 'running',requested_days integer,provider_results jsonb default '[]',metrics_written integer default 0,alerts_created integer default 0,recommendations_created integer default 0,finished_at timestamptz,error_message text);
  `);
  for (const scenario of ['active', 'initial-archive', 'fetch-archive', 'pagination-archive', 'metric-boundary', 'ads-boundary', 'growth-boundary', 'final-boundary', 'metric-rollback', 'concurrent-archive', 'external-terminal']) {
    boundary = archiveAt = fetches = 0;
    duringFetch = pagination = failInsert = concurrentArchive = externallyFailed = false;
    await pool.query('truncate projects,integrations,campaign_metrics,business_targets,alerts,recommendations,ads_sync_runs cascade');
    await pool.query("insert into projects values($1,'active','example.test')", [projectId]);
    await pool.query("insert into integrations(project_id,provider,status,metadata) values($1,'meta_ads','connected',$2)", [projectId, { accessTokenEncrypted: 'test', selectedAdAccountId: '123' }]);
    await pool.query('insert into business_targets values($1,2,10,1)', [projectId]);
    if (scenario === 'initial-archive') await archive();
    duringFetch = ['fetch-archive', 'pagination-archive'].includes(scenario);
    pagination = scenario === 'pagination-archive';
    archiveAt = ({ 'metric-boundary': 2, 'ads-boundary': 3, 'growth-boundary': 4, 'final-boundary': 5 })[scenario] || 0;
    failInsert = scenario === 'metric-rollback';
    concurrentArchive = scenario === 'concurrent-archive';
    externallyFailed = scenario === 'external-terminal';
    let result, error;
    try { result = await sync(projectId); } catch (e) { error = e; }
    const runs = (await pool.query('select * from ads_sync_runs')).rows;
    const count = async table => Number((await pool.query(`select count(*) n from ${table}`)).rows[0].n);
    const metrics = await count('campaign_metrics');
    const alerts = await count('alerts');
    const recommendations = await count('recommendations');
    if (scenario === 'initial-archive') {
      assert.equal(error?.message, abortMessage); assert.equal(runs.length, 0); assert.equal(fetches, 0);
    } else {
      assert.equal(runs.length, 1); assert.ok(runs[0].finished_at);
      if (!externallyFailed) {
        assert.equal(runs[0].metrics_written, metrics);
        assert.equal(runs[0].alerts_created, alerts);
        assert.equal(runs[0].recommendations_created, recommendations);
      }
      if (scenario === 'active') {
        assert.equal(error, undefined); assert.equal(runs[0].status, 'success');
        assert.equal(result.readOnly, true); assert.equal(result.externalExecution, false);
        assert.equal(metrics, 1); assert.equal(alerts, 3); assert.equal(recommendations, 3);
      } else if (scenario === 'metric-rollback') {
        assert.equal(error, undefined); assert.equal(runs[0].status, 'failed');
        assert.match(runs[0].error_message, /Injected metric failure/); assert.equal(metrics, 0);
        assert.equal((await pool.query('select last_sync_at from integrations')).rows[0].last_sync_at, null);
      } else if (scenario === 'external-terminal') {
        assert.ok(error); assert.equal(runs[0].status, 'failed'); assert.equal(runs[0].error_message, 'External stop');
      } else {
        assert.equal(error?.message, abortMessage); assert.equal(runs[0].status, 'failed'); assert.equal(runs[0].error_message, abortMessage);
        if (['fetch-archive', 'pagination-archive', 'metric-boundary'].includes(scenario)) { assert.equal(metrics, 0); assert.equal(alerts, 0); assert.equal(recommendations, 0); }
        if (['ads-boundary', 'concurrent-archive'].includes(scenario)) { assert.equal(metrics, 1); assert.equal(alerts, 0); }
        if (scenario === 'growth-boundary') { assert.equal(alerts, 1); assert.equal(recommendations, 1); }
        if (scenario === 'pagination-archive') assert.equal(fetches, 1);
      }
    }
    console.log('PASS', scenario);
  }
} finally {
  await pool.end(); await db.query(`drop schema ${schema} cascade`); await db.end();
}
