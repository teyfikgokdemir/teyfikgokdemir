import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = stripTypeScriptTypes(readFileSync(process.argv[2] || 'src/lib/analytics-stack.ts', 'utf8')).replace(/export /g, '');
function fixture(advanced = false, query = '', blocked = false, clarityCookieless = false) {
  const scripts = [], listeners = {}, storage = new Map();
  const location = new URL('https://example.com/services/' + query); location.reload = () => { location.reloaded = true; };
  const document = { cookie: '_ga=one; _clck=two', referrer: 'https://search.example/?email=private@example.com', documentElement: { lang: 'en', scrollHeight: 2000 }, body: { setAttribute() {} }, head: { appendChild(s) { scripts.push(s); } }, getElementById(id) { return scripts.find(s => s.id === id); }, createElement() { return {}; }, addEventListener(n, f) { listeners[n] = f; }, removeEventListener() {} };
  const context = { document, location, URL, URLSearchParams, Date, Set, console, innerHeight: 1000, scrollY: 0, Element: class {}, sessionStorage: { getItem(k) { if (blocked) throw Error(); return storage.get(k); }, setItem(k,v) { if (blocked) throw Error(); storage.set(k,v); }, removeItem(k) { storage.delete(k); } } };
  context.window = { addEventListener(n,f) { listeners[n] = f; }, removeEventListener() {} };
  vm.createContext(context);
  vm.runInContext(source + `\nglobalThis.api = createAnalytics({site:'test',ga:'G-TEST',gtm:'GTM-TEST',clarity:'abcde123',advanced:${advanced},clarityCookieless:${clarityCookieless}});`, context);
  const events = () => context.window.dataLayer.filter(x => x[0] === 'event');
  return { ...context, context, scripts, storage, events, listeners, api: context.api };
}
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('PASS ' + name); };
check('always-on bootstrap loads GA, GTM and Clarity on reject/no-choice', () => {
  const f = fixture();
  f.api.setConsent({analytics:false});
  assert.deepEqual(f.scripts.map(s=>s.id), ['qct-ga4','qct-gtm','qct-clarity']);
  assert.equal(f.window.dataLayer[0][1], 'default');
  assert.equal(f.window.dataLayer[0][2].analytics_storage, 'granted');
  assert.equal(f.window.clarity.q[0][1].analytics_Storage, 'granted');
  assert.equal(f.events().filter(e=>e[1]==='page_view').length, 1);
});
check('accept and reject actions do not unload or duplicate vendors', () => {
  const f = fixture();
  f.api.setConsent({analytics:true,recording:true});
  f.api.setConsent({analytics:false});
  f.api.setConsent({analytics:true});
  assert.deepEqual(f.scripts.map(s=>s.id), ['qct-ga4','qct-gtm','qct-clarity']);
  assert.equal(f.location.reloaded, undefined);
  assert.equal(f.events().filter(e=>e[1]==='page_view').length, 1);
});
check('custom contact events are measured regardless of banner choice and remain sanitized', () => {
  const f = fixture();
  f.api.setConsent({analytics:false});
  assert.equal(f.api.track('whatsapp_click',{link_url:'https://wa.me/905551234567?text=secret', email:'private@example.com', service:'private@example.com', revenue:50000}), true);
  const data=JSON.stringify(f.events());
  assert.ok(!data.includes('905551234567'));
  assert.ok(!data.includes('private@example.com'));
  assert.ok(!data.includes('50000'));
  assert.equal(f.api.track('arbitrary_event',{}),false);
});
check('scroll thresholds run regardless of banner choice and reset on SPA navigation', () => {
  const f=fixture();
  f.api.setConsent({analytics:false});
  f.context.scrollY=950; f.listeners.scroll(); f.listeners.scroll();
  assert.equal(f.events().filter(e=>e[1]==='scroll_depth').length,4);
  f.location.pathname='/work/test/'; f.api.page(); f.listeners.scroll();
  assert.equal(f.events().filter(e=>e[1]==='scroll_depth').length,8);
});
check('campaign attribution allowlist and query/hash Clarity guard remain active', () => {
  const f=fixture(false,'?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=private@example.com&gclid=secret');
  f.api.setConsent({analytics:false});
  assert.deepEqual(f.scripts.map(s=>s.id), ['qct-ga4','qct-gtm']);
  const data=JSON.stringify(f.window.dataLayer);
  assert.ok(data.includes('spring'));
  assert.ok(!data.includes('private@example.com'));
  assert.ok(!data.includes('secret'));
});
check('blocked storage still measures explicit events', () => {
  const f=fixture(false,'',true);
  f.api.setConsent({analytics:false});
  assert.equal(f.api.track('email_click'),true);
});
check('wrong host never initializes measurement', () => {
  const f=fixture();
  f.window.__qctStack=undefined;
  vm.runInContext("globalThis.preview = createAnalytics({hostname:'production.example',site:'preview',ga:'G-TEST'});",f.context);
  f.context.preview.setConsent({analytics:true});
  assert.equal(f.scripts.length,0);
});
console.log(`${checks} analytics checks passed`);