import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { onRequest } from '../functions/api/counter.ts';
import { onRequestGet as onClarityRequest } from '../functions/api/clarity.ts';

const ACTIVE_TIME = Date.parse('2026-11-10T12:00:00Z');
const EXPIRED_TIME = Date.parse('2026-11-16T00:00:00Z');
const REAL_NOW = Date.now;
const ACTIVE_SITES = [
  ['ctseg', 'https://ctseg.com.tr'],
  ['qct-commerce-tr', 'https://qctcommerce.com'],
  ['qct-studio', 'https://qctstudio.com'],
  ['teyfikgokdemir', 'https://teyfikgokdemir.com'],
  ['mythborn', 'https://mythborn.co'],
  ['qctone', 'https://qctone.com'],
];

class FakeStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async run() {
    this.database.operations.push({ kind: 'run', sql: this.sql, params: this.params });
    return { success: true };
  }

  async all() {
    this.database.operations.push({ kind: 'all', sql: this.sql, params: this.params });
    return { results: [] };
  }
}

class FakeDatabase {
  operations = [];

  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

const invoke = async ({
  method = 'POST',
  origin,
  body = JSON.stringify({ site: 'qctone', path: '/' }),
  headers = {},
  secret = '0123456789abcdef0123456789abcdef',
  now = ACTIVE_TIME,
  url = 'https://teyfikgokdemir.com/api/counter',
} = {}) => {
  Date.now = () => now;
  const database = new FakeDatabase();
  const requestHeaders = new Headers(headers);
  if (origin !== undefined) requestHeaders.set('origin', origin);
  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  });
  Object.defineProperty(request, 'cf', { value: { country: 'TR' } });

  const response = await onRequest({
    request,
    env: { CANSU_ANALYTICS_DB: database, COUNTER_AUTH_SECRET: secret },
  });
  return { response, database };
};

test.afterEach(() => {
  Date.now = REAL_NOW;
});

test('accepts normal browser telemetry for the matching site and origin', async () => {
  const { response, database } = await invoke({
    origin: 'https://qctone.com',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://qctone.com');
  assert.equal(database.operations.filter(({ sql }) => /INSERT INTO privacy_traffic_7d/.test(sql)).length, 1);
});

test('accepts telemetry for all six active analytics sites', async () => {
  for (const [site, origin] of ACTIVE_SITES) {
    const { response, database } = await invoke({
      origin,
      body: JSON.stringify({ site, path: '/' }),
    });
    assert.equal(response.status, 200, `${site} should be accepted`);
    assert.equal(
      database.operations.filter(({ sql }) => /INSERT INTO privacy_traffic_7d/.test(sql)).length,
      1,
      `${site} should write one aggregate row`,
    );
  }
});

test('rejects the retired Olivon site identifier before touching D1', async () => {
  const { response, database } = await invoke({
    origin: 'https://qctone.com',
    body: JSON.stringify({ site: 'olivon-agency', path: '/' }),
  });
  assert.equal(response.status, 400);
  assert.equal(database.operations.length, 0);
});

test('rejects the retired Olivon Origin before touching D1', async () => {
  const { response, database } = await invoke({
    origin: 'https://olivon.com.tr',
    body: JSON.stringify({ site: 'olivon-agency', path: '/' }),
  });
  assert.equal(response.status, 403);
  assert.equal(database.operations.length, 0);
});

test('rejects the retired Olivon site in analytics reporting APIs', async () => {
  const response = await onClarityRequest({
    request: new Request('https://teyfikgokdemir.com/api/clarity?site=olivon-agency'),
    env: {},
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'Unknown site' });
});

test('rejects a POST without Origin before touching D1', async () => {
  const { response, database } = await invoke();
  assert.equal(response.status, 403);
  assert.equal(database.operations.length, 0);
});

test('rejects an unauthorized Origin before touching D1', async () => {
  const { response, database } = await invoke({ origin: 'https://attacker.example' });
  assert.equal(response.status, 403);
  assert.equal(database.operations.length, 0);
});

test('rejects an Origin that does not match the claimed site', async () => {
  const { response, database } = await invoke({ origin: 'https://ctseg.com.tr' });
  assert.equal(response.status, 403);
  assert.equal(database.operations.filter(({ sql }) => /INSERT INTO privacy_traffic_7d/.test(sql)).length, 0);
});

test('rejects an invalid site identifier', async () => {
  const { response, database } = await invoke({
    origin: 'https://qctone.com',
    body: JSON.stringify({ site: 'not-registered', path: '/' }),
  });
  assert.equal(response.status, 400);
  assert.equal(database.operations.filter(({ sql }) => /INSERT INTO privacy_traffic_7d/.test(sql)).length, 0);
});

test('rejects malformed JSON', async () => {
  const { response, database } = await invoke({ origin: 'https://qctone.com', body: '{' });
  assert.equal(response.status, 400);
  assert.equal(database.operations.filter(({ sql }) => /INSERT INTO privacy_traffic_7d/.test(sql)).length, 0);
});

test('rejects a payload larger than 1024 bytes even without Content-Length', async () => {
  const { response, database } = await invoke({
    origin: 'https://qctone.com',
    body: JSON.stringify({ site: 'qctone', path: '/', padding: 'x'.repeat(1300) }),
  });
  assert.equal(response.status, 413);
  assert.equal(database.operations.length, 0);
});

test('rejects an unauthorized administrative GET', async () => {
  const { response } = await invoke({ method: 'GET', origin: 'https://teyfikgokdemir.com', headers: {} });
  assert.equal(response.status, 401);
});

test('accepts an authorized administrative GET', async () => {
  const { response } = await invoke({
    method: 'GET',
    origin: 'https://teyfikgokdemir.com',
    headers: { authorization: 'Bearer 0123456789abcdef0123456789abcdef' },
  });
  assert.equal(response.status, 200);
});

test('returns 204 after monitoring expiry without touching D1', async () => {
  const { response, database } = await invoke({ origin: 'https://qctone.com', now: EXPIRED_TIME });
  assert.equal(response.status, 204);
  assert.equal(database.operations.length, 0);
});

test('rejects unsupported methods without touching D1', async () => {
  const { response, database } = await invoke({ method: 'PUT', origin: 'https://qctone.com' });
  assert.equal(response.status, 405);
  assert.equal(database.operations.length, 0);
});

test('client telemetry remains cookie-free and sends no credentials', async () => {
  const source = await readFile(new URL('../public/traffic-counter.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /document\.cookie|cookie\s*=/i);
  assert.match(source, /credentials:\s*['"]omit['"]/);
});

test('analytics infrastructure contains no Olivon tracking or reporting targets', async () => {
  const files = [
    '../functions/api/conversions.ts',
    '../functions/api/clarity.ts',
    '../functions/api/counter.ts',
    '../functions/api/ga4.ts',
    '../functions/api/gsc/seo.ts',
    '../functions/api/overview.ts',
    '../functions/api/sources.ts',
    '../functions/api/umami-config.ts',
    '../functions/api/umami.ts',
    '../infra/umami/README.md',
    '../public/cansu-source-beacon.js',
    '../public/traffic-counter.js',
    '../scripts/check-umami-cors.mjs',
    '../src/pages/cansu.astro',
    '../src/scripts/cansu-portfolio.js',
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /olivon(?:-agency|agency)?|olivon\.com\.tr|olivon\.agency/i, file);
  }
});
