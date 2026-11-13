import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/scripts/cansu-portfolio.js', import.meta.url), 'utf8');
function fixture(payloadFor, ga4Payload = { ok: false }, searchValue = '') {
  const nodes = new Map();
  const clock = { now: Date.now() };
  class FixtureDate extends Date { static now() { return clock.now; } }
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: id === 'portfolio-source' ? 'umami' : id === 'portfolio-search' ? searchValue : '', dataset: {}, options: [{}], innerHTML: '', classList: { toggle() {}, add() {} }, replaceChildren() {}, addEventListener() {} });
    return nodes.get(id);
  };
  let calls = 0;
  const context = vm.createContext({ document: { getElementById: node, querySelectorAll: () => [] }, window: { addEventListener() {} }, Intl, Date: FixtureDate, Map, AbortSignal, fetch: async url => {
    if (url === '/api/ga4') return { ok: true, json: async () => ga4Payload };
    calls++;
    const payload = payloadFor(new URL(url, 'https://example.com').searchParams.get('site'));
    return { ok: payload.ok, status: payload.code === 'rate_limited' ? 429 : 200, json: async () => payload };
  } });
  node('clarity-overview-grid');
  node('ga4-overview-grid');
  vm.runInContext(source, context);
  return { nodes, context, clock, calls: () => calls };
}
for (const [code, label] of [['rate_limited', 'istek limiti aşıldı'], ['missing_token', 'token bekleniyor'], ['auth_error', 'yetkilendirme hatası'], ['upstream_error', 'API kullanılamıyor']]) {
  const f = fixture(() => ({ ok: false, code, reason: '<img src=x onerror=alert(1)>' }));
  await vm.runInContext('loadClarity()', f.context);
  assert.equal(f.nodes.get('clarity-api-state').textContent, `Clarity · ${label}`);
  assert.equal(f.nodes.get('clarity-sessions').textContent, '—');
  const html = f.nodes.get('clarity-site-grid').innerHTML;
  assert.equal((html.match(/<article/g) || []).length, 6);
  assert.ok(html.includes('&lt;img'));
  await vm.runInContext('loadClarity()', f.context);
  assert.equal(f.calls(), 6, 'Repeated renders must not repeat export requests');
}
const success = { ok: true, generatedAt: '2026-10-05T09:00:00Z', data: [{ metricName: 'Traffic', information: [{ totalSessionCount: 3, distinctUserCount: 2 }] }] };
const mixed = fixture(key => key === 'ctseg' ? success : { ok: false, code: 'rate_limited', reason: 'Clarity API 429' });
await vm.runInContext('loadClarity()', mixed.context);
assert.equal(mixed.nodes.get('clarity-api-state').textContent, 'Clarity · kısmen bağlı');
assert.equal(mixed.nodes.get('clarity-sessions').textContent, '3');
const good = fixture(() => success);
await vm.runInContext('loadClarity()', good.context);
assert.equal(good.nodes.get('clarity-api-state').textContent, 'Clarity · bağlı');
assert.equal(good.nodes.get('clarity-sessions').textContent, '18');
assert.equal((good.nodes.get('clarity-overview-grid').innerHTML.match(/<article/g) || []).length, 3);
assert.match(good.nodes.get('clarity-overview-grid').innerHTML, /QCT Commerce/);
const filtered = fixture(() => success, { ok: false }, 'ctseg');
await vm.runInContext('loadClarity()', filtered.context);
assert.equal(filtered.calls(), 6, 'a filtered view must still load all six projects once');
assert.equal((filtered.nodes.get('clarity-overview-grid').innerHTML.match(/<article/g) || []).length, 3);
assert.equal((filtered.nodes.get('clarity-site-grid').innerHTML.match(/<article/g) || []).length, 1);
filtered.clock.now += 2 * 60 * 60 * 1000;
await vm.runInContext('loadClarity()', filtered.context);
assert.equal(filtered.calls(), 6, 'a long-lived page must reuse its original six-project export group');

const ga4Payload = {
  ok: true,
  configured: true,
  connectedCount: 6,
  generatedAt: '2026-11-12T12:00:00Z',
  sites: ga4SitesFixture(),
};
function ga4SitesFixture() {
  return [
    ['qct-commerce-tr', 'QCT Commerce', 36], ['ctseg', 'CTSEG', 91], ['qct-studio', 'QCT Studio', 11],
    ['teyfikgokdemir', 'Teyfik Gökdemir', 15], ['mythborn', 'Mythborn', 1], ['qctone', 'QCT One', 4],
  ].map(([key, name, visits]) => ({ key, name, connected: true, periods: { sevenDays: { visits, visitors: visits, pageviews: visits } } }));
}
const ga4 = fixture(() => success, ga4Payload);
await vm.runInContext('loadGa4()', ga4.context);
assert.equal((ga4.nodes.get('ga4-overview-grid').innerHTML.match(/<article/g) || []).length, 3);
assert.match(ga4.nodes.get('ga4-overview-grid').innerHTML, /CTSEG/);
assert.match(ga4.nodes.get('ga4-overview-grid').innerHTML, /QCT Commerce/);
assert.doesNotMatch(ga4.nodes.get('ga4-overview-grid').innerHTML, /Mythborn/);

const apiSource = stripTypeScriptTypes(readFileSync(new URL('../functions/api/clarity.ts', import.meta.url), 'utf8')).replace('export const onRequestGet', 'globalThis.onRequestGet');
const api = vm.createContext({ Request, Response, URL, AbortSignal, fetch: async () => new Response('{}', { status: 429 }) });
vm.runInContext(apiSource, api);
const request = new Request('https://example.com/api/clarity?site=ctseg');
assert.equal((await (await api.onRequestGet({ request, env: {} })).json()).code, 'missing_token');
for (const [status, code] of [[429, 'rate_limited'], [401, 'auth_error'], [403, 'auth_error'], [500, 'upstream_error']]) {
  api.fetch = async () => new Response('{}', { status });
  const result = await api.onRequestGet({ request, env: { CLARITY_API_TOKEN: 'fixture-only' } });
  const body = await result.json();
  assert.equal(body.code, code);
  assert.equal(body.upstreamStatus, status);
  assert.ok(!JSON.stringify(body).includes('fixture-only'));
}
api.fetch = async () => { throw new Error('fixture-only'); };
assert.equal((await (await api.onRequestGet({ request, env: { CLARITY_API_TOKEN: 'fixture-only' } })).json()).code, 'upstream_error');
console.log('PASS: Clarity error classification, cards, partial data, request reuse, HTML escaping and API failures');
