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
check('basic denial: zero external scripts, events and attribution storage', () => { const f = fixture(); f.api.setConsent({analytics:false}); f.api.track('whatsapp_click'); assert.equal(f.scripts.length,0); assert.equal(f.events().length,0); assert.equal(f.storage.size,0); });
check('advanced denial: GA only, default denial before config, sanitized page', () => { const f = fixture(true,'?email=private@example.com'); f.api.setConsent({analytics:false}); assert.equal(f.scripts.length,1); assert.ok(f.scripts[0].src.includes('gtag/js')); assert.equal(f.window.dataLayer[0][1],'default'); assert.equal(f.storage.size,0); assert.ok(!JSON.stringify(f.window.dataLayer).includes('private@')); });
check('grant loads each vendor once and sends one page view', () => { const f = fixture(); f.api.setConsent({analytics:true,recording:true}); f.api.setConsent({analytics:true,recording:true}); f.api.page(); assert.equal(f.scripts.length,3); assert.equal(f.events().filter(e=>e[1]==='page_view').length,1); });
check('event allowlist removes raw contact and calculator financial details', () => { const f=fixture(); f.api.setConsent({analytics:true,recording:true}); f.api.track('whatsapp_click',{link_url:'https://wa.me/905551234567?text=secret', email:'private@example.com', service:'private@example.com', revenue:50000}); const data=JSON.stringify(f.events()); assert.ok(!data.includes('905551234567')); assert.ok(!data.includes('private@example.com')); assert.ok(!data.includes('50000')); assert.equal(f.api.track('arbitrary_event',{}),false); });
check('no replay of denied events', () => { const f=fixture(); f.api.track('whatsapp_click'); f.api.setConsent({analytics:true,recording:true}); assert.equal(f.events().filter(e=>e[1]==='whatsapp_click').length,0); });
check('scroll thresholds once per page, reset on SPA navigation', () => { const f=fixture(); f.api.setConsent({analytics:true,recording:true}); f.context.scrollY=950; f.listeners.scroll(); f.listeners.scroll(); assert.equal(f.events().filter(e=>e[1]==='scroll_depth').length,4); f.location.pathname='/work/test/'; f.api.page(); f.listeners.scroll(); assert.equal(f.events().filter(e=>e[1]==='scroll_depth').length,8); });
check('revocation prevents custom events, clears attribution, reloads loaded vendors', () => { const f=fixture(); f.api.setConsent({analytics:true,recording:true}); f.api.setConsent({analytics:false}); const before=f.events().length; f.api.track('whatsapp_click'); assert.equal(f.events().length,before); assert.equal(f.storage.size,0); assert.equal(f.location.reloaded,true); });
check('blocked storage still honors explicit consent', () => { const f=fixture(false,'',true); f.api.setConsent({analytics:true,recording:true}); assert.equal(f.api.track('email_click'),true); });
check('campaign attribution allowlist and Clarity query guard', () => { const f=fixture(false,'?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=private@example.com&gclid=secret'); f.api.setConsent({analytics:true,recording:true}); assert.equal(f.scripts.length,2); const data=JSON.stringify(f.window.dataLayer); assert.ok(data.includes('spring')); assert.ok(!data.includes('private@example.com')); assert.ok(!data.includes('secret')); });

check('historical analytics consent does not start recording before new choice', () => { const f=fixture(); f.api.setConsent({analytics:true}); assert.equal(f.scripts.length,2); f.api.setConsent({analytics:true,recording:true}); assert.equal(f.scripts.length,3); });
check('advanced page classification works without consent without duplicate page view', () => { const f=fixture(true); f.api.setConsent({analytics:false}); assert.equal(f.events().filter(e=>e[1]==='service_view').length,1); f.api.setConsent({analytics:true}); assert.equal(f.events().filter(e=>e[1]==='service_view').length,1); assert.equal(f.events().filter(e=>e[1]==='page_view').length,1); });
check('wrong host never initializes measurement', () => { const f=fixture(); f.window.__qctStack=undefined; vm.runInContext("globalThis.preview = createAnalytics({hostname:'production.example',site:'preview',ga:'G-TEST'});",f.context); f.context.preview.setConsent({analytics:true}); assert.equal(f.scripts.length,0); });

check('continuous mode starts GA and Clarity with denied storage before acceptance', () => {
  const f=fixture(true,'',false,true); f.api.setConsent({analytics:false});
  assert.deepEqual(f.scripts.map(s=>s.id),['qct-ga4','qct-clarity']);
  assert.equal(f.window.clarity.q[0][0],'consentv2');
  assert.equal(f.window.clarity.q[0][1].analytics_Storage,'denied');
  assert.equal(f.window.clarity.q[0][1].ad_Storage,'denied');
  assert.equal(f.api.track('email_click'),true); assert.equal(f.storage.size,0);
  f.context.scrollY=950; f.listeners.scroll();
  assert.equal(f.events().filter(e=>e[1]==='scroll_depth').length,4);
  f.api.setConsent({analytics:true,recording:true});
  assert.equal(f.scripts.length,3); assert.equal(f.events().filter(e=>e[1]==='page_view').length,1);
  assert.equal(f.window.clarity.q.filter(x=>x[0]==='consentv2').at(-1)[1].analytics_Storage,'granted');
});
check('continuous mode keeps denial and privacy protections after revocation', () => {
  const f=fixture(true,'',false,true); f.api.setConsent({analytics:true,recording:true}); f.api.setConsent({analytics:false});
  assert.equal(f.location.reloaded,true); assert.equal(f.storage.size,0);
  assert.equal(f.window.clarity.q.filter(x=>x[0]==='consentv2').at(-1)[1].analytics_Storage,'denied');
  const next=fixture(true,'?email=private@example.com',false,true); next.api.setConsent({analytics:false});
  assert.equal(next.scripts.length,1); assert.ok(!JSON.stringify(next.window.dataLayer).includes('private@example.com'));
});
console.log(`${checks} analytics checks passed`);
