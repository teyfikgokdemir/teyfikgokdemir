// Run with: node --test scripts/check-umami-cors.mjs
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = stripTypeScriptTypes(await readFile(new URL('../functions/api/umami-config.ts', import.meta.url), 'utf8'));
const context = vm.createContext({ Request, Response, URL, fetch: async () => Response.json([{ id: 'test-website', domain: 'qctcommerce.com' }]) });
vm.runInContext(source.replace('export const onRequest', 'globalThis.onRequest'), context);
const request = (origin, method = 'GET', site = 'qct-commerce-tr', env = {}) => context.onRequest({
  request: new Request(`https://cansu.teyfikgokdemir.com/api/umami-config?site=${site}`, {
    method, headers: origin === undefined ? {} : { origin },
  }), env,
});

const existing = ['teyfikgokdemir.com', 'cansu.teyfikgokdemir.com', 'ctseg.com.tr', 'mythborn.co', 'qctstudio.com', 'qctcommerce.com', 'olivon.com.tr'];
const commerce = ['www.qctcommerce.com', 'qct-commerce-tr.pages.dev', 'ecdc0bff.qct-commerce-tr.pages.dev', 'fix-qct-commerce-p2-audit.qct-commerce-tr.pages.dev'];
for (const host of [...existing, ...commerce]) {
  for (const method of ['GET', 'OPTIONS']) test(`${method} permits ${host}`, async () => {
    const origin = `https://${host}`;
    const response = await request(origin, method);
    assert.equal(response.status, method === 'OPTIONS' ? 204 : 200);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('vary'), 'origin');
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET, OPTIONS');
    assert.equal(response.headers.get('access-control-allow-headers'), 'content-type');
  });
}
const denied = [undefined, 'null', 'https://evil.example', 'https://other.pages.dev', 'https://x.other.pages.dev', 'http://qctcommerce.com', 'https://qctcommerce.com:444', 'https://qctcommerce.com/', 'https://qctcommerce.com.evil.example', 'https://qctcommerce.com@evil.example', 'https://x.qct-commerce-tr.pages.dev.evil.example', 'https://nested.x.qct-commerce-tr.pages.dev', 'https://-bad.qct-commerce-tr.pages.dev', 'https://bad-.qct-commerce-tr.pages.dev', `https://${'a'.repeat(64)}.qct-commerce-tr.pages.dev`];
for (const origin of denied) for (const method of ['GET', 'OPTIONS']) test(`${method} omits ACAO for ${origin}`, async () => {
  const response = await request(origin, method);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('vary'), 'origin');
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});
test('new QCT origins cannot read another site configuration', async () => {
  for (const host of commerce) assert.equal((await request(`https://${host}`, 'GET', 'ctseg')).headers.get('access-control-allow-origin'), null);
});
test('enabled configuration and error responses retain CORS', async () => {
  const origin = 'https://ecdc0bff.qct-commerce-tr.pages.dev';
  const response = await request(origin, 'GET', 'qct-commerce-tr', { UMAMI_BASE_URL: 'https://umami.example', UMAMI_API_KEY: 'test-only' });
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  const body = await response.json();
  assert.equal(body.enabled, true);
  assert.equal(body.domain, 'qctcommerce.com');
  assert.equal(body.scriptUrl, 'https://umami.example/script.js');
  assert.equal((await request(origin, 'POST')).status, 405);
  assert.equal((await request(origin, 'POST')).headers.get('access-control-allow-origin'), origin);
  assert.equal((await request('https://ctseg.com.tr', 'GET', 'unknown')).status, 400);
});
test('all existing site mappings retain enabled configurations', async () => {
  const mappings = { teyfikgokdemir: 'teyfikgokdemir.com', ctseg: 'ctseg.com.tr', mythborn: 'mythborn.co', 'qct-studio': 'qctstudio.com', 'qct-commerce-tr': 'qctcommerce.com', 'olivon-agency': 'olivon.com.tr' };
  const original = context.fetch;
  try {
    context.fetch = async () => Response.json(Object.values(mappings).map(domain => ({ id: `test-${domain}`, domain })));
    for (const [site, domain] of Object.entries(mappings)) {
      const response = await request('https://cansu.teyfikgokdemir.com', 'GET', site, { UMAMI_BASE_URL: 'https://umami.example', UMAMI_API_KEY: 'test-only' });
      const body = await response.json();
      assert.equal(body.enabled, true);
      assert.equal(body.domain, domain);
      assert.equal(response.headers.get('access-control-allow-origin'), 'https://cansu.teyfikgokdemir.com');
    }
  } finally { context.fetch = original; }
});
test('upstream errors retain validated CORS and no-store', async () => {
  const original = context.fetch;
  try {
    for (const mock of [async () => new Response(null, { status: 401 }), async () => { throw new Error('test-only'); }]) {
      context.fetch = mock;
      const response = await request('https://ecdc0bff.qct-commerce-tr.pages.dev', 'GET', 'qct-commerce-tr', { UMAMI_BASE_URL: 'https://umami.example', UMAMI_API_KEY: 'test-only' });
      assert.equal(response.status, 502);
      assert.equal(response.headers.get('access-control-allow-origin'), 'https://ecdc0bff.qct-commerce-tr.pages.dev');
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  } finally { context.fetch = original; }
});
