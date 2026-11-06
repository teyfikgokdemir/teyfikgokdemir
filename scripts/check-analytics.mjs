import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = stripTypeScriptTypes(readFileSync(process.argv[2] || 'src/lib/analytics-stack.ts', 'utf8')).replace(/export /g, '');
function fixture(advanced = false, query = '', blocked = false, clarityCookieless = false) {
  const scripts = [], listeners = {}, storage = new Map();
  const location = new URL('https://example.com/services/' + query); location.reload = () => { location.reloaded = true; };
  const document = { cookie: '_ga=one; _clck=two', referrer: 'https://search.example/?email=private@example.com', documentElement: { lang: 'en', scrollHeight: 2000 }, body: { setAttribute() {} }, head: { appendChild(s) { scripts.push(s); } }, getElementById(id) { return scripts.find(s => s.id === id); }, createElement() { return { dataset: {} }; }, addEventListener(n, f) { listeners[n] = f; }, removeEventListener() {} };
  const context = { document, location, URL, URLSearchParams, Date, Set, console, innerHeight: 1000, scrollY: 0, Element: class {}, sessionStorage: { getItem(k) { if (blocked) throw Error(); return storage.get(k); }, setItem(k,v) { if (blocked) throw Error(); storage.set(k,v); }, removeItem(k) { storage.delete(k); } } };
  context.window = { addEventListener(n,f) { listeners[n] = f; }, removeEventListener() {} };
  vm.createContext(context);
  vm.runInContext(source + `
globalThis.api = createAnalytics({site:'test',ga:'G-TEST',gtm:'GTM-TEST',clarity:'abcde123',cansu:true,advanced:${advanced},clarityCookieless:${clarityCookieless}});
`, context);
  const events = () => context.window.dataLayer.filter(x => x[0] === 'event');
  return { ...context, context, scripts, storage, events, listeners, api: context.api };
}
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('PASS ' + name); };

check('no consent keeps vendors unloaded and blocks analytics events', () => {
  const f = fixture(true);
  assert.deepEqual(f.scripts.map(s => s.id), []);
  assert.equal(f.window.__qctAnalyticsConsent, false);
  f.api.setConsent({analytics:false,recording:false});
  assert.deepEqual(f.scripts.map(s => s.id), []);
  assert.equal(f.window.__qctAnalyticsConsent, false);
  assert.equal(f.window.dataLayer[0][2].analytics_storage, 'denied');
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 0);
  assert.equal(f.api.track('whatsapp_click'), false);
});

check('accept loads only consented vendors and records a page view', () => {
  const f = fixture();
  f.api.setConsent({analytics:true,recording:true});
  assert.equal(f.window.__qctAnalyticsConsent, true);
  assert.deepEqual(f.scripts.map(s => s.id), ['qct-ga4','qct-gtm','qct-clarity','qct-cansu-source-beacon','qct-cansu-events','qct-cansu-umami']);
  assert.equal(f.window.__qctAnalyticsConsent, true);
  assert.equal(f.window.dataLayer[0][2].analytics_storage, 'denied');
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
  assert.ok(f.window.clarity.q.some(args => args[0] === 'consentv2' && args[1].analytics_Storage === 'granted'));
});

check('withdrawal updates consent and stops events without reloading vendors', () => {
  const f = fixture();
  f.api.setConsent({analytics:true,recording:true});
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
  f.api.setConsent({analytics:false,recording:false});
  assert.equal(f.window.__qctAnalyticsConsent, false);
  assert.equal(f.api.track('whatsapp_click'), false);
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
  assert.equal(f.window.dataLayer.at(-1)[2].analytics_storage, 'denied');
  assert.ok(f.window.clarity.q.some(args => args[0] === 'consentv2' && args[1].analytics_Storage === 'denied'));
  f.api.setConsent({analytics:true,recording:true});
  assert.equal(f.window.__qctAnalyticsConsent, true);
  assert.deepEqual(f.scripts.map(s => s.id), ['qct-ga4','qct-gtm','qct-clarity','qct-cansu-source-beacon','qct-cansu-events','qct-cansu-umami']);
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 2);
});

check('custom events are blocked until consent and sanitized after consent', () => {
  const f = fixture();
  assert.equal(f.api.track('whatsapp_click',{email:'private@example.com'}), false);
  f.api.setConsent({analytics:true,recording:false});
  assert.equal(f.api.track('whatsapp_click',{link_url:'https://wa.me/905551234567?text=secret', email:'private@example.com', service:'private@example.com', revenue:50000}), true);
  const data = JSON.stringify(f.events());
  assert.ok(!data.includes('905551234567'));
  assert.ok(!data.includes('private@example.com'));
  assert.ok(!data.includes('50000'));
  assert.equal(f.api.track('arbitrary_event',{}), false);
});

check('scroll events wait for consent and reset on SPA navigation', () => {
  const f = fixture();
  f.context.scrollY = 950;
  f.listeners.scroll();
  assert.equal(f.events().length, 0);
  f.api.setConsent({analytics:true,recording:false});
  f.listeners.scroll(); f.listeners.scroll();
  assert.equal(f.events().filter(e => e[1] === 'scroll_depth').length, 4);
  f.location.pathname = '/work/test/';
  f.api.page();
  f.listeners.scroll();
  assert.equal(f.events().filter(e => e[1] === 'scroll_depth').length, 8);
});

check('campaign attribution is captured only after consent and Clarity skips sensitive URLs', () => {
  const f = fixture(false,'?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=private@example.com&gclid=secret');
  f.api.setConsent({analytics:false,recording:false});
  assert.equal(f.storage.size, 0);
  assert.deepEqual(f.scripts.map(s => s.id), []);
  assert.equal(f.window.__qctAnalyticsConsent, false);
  f.api.setConsent({analytics:true,recording:true});
  assert.equal(f.window.__qctAnalyticsConsent, true);
  assert.deepEqual(f.scripts.map(s => s.id), ['qct-ga4','qct-gtm','qct-cansu-source-beacon','qct-cansu-events','qct-cansu-umami']);
  const data = JSON.stringify(f.window.dataLayer);
  assert.ok(data.includes('spring'));
  assert.ok(!data.includes('private@example.com'));
  assert.ok(!data.includes('secret'));
});

check('blocked storage does not bypass explicit consent', () => {
  const f = fixture(false,'',true);
  f.api.setConsent({analytics:false,recording:false});
  assert.equal(f.scripts.length, 0);
  f.api.setConsent({analytics:true,recording:false});
  assert.equal(f.api.track('email_click'), true);
});

check('wrong host never initializes measurement', () => {
  const f = fixture();
  f.context.window.__qctStack = undefined;
  vm.runInContext("globalThis.preview = createAnalytics({hostname:'production.example',site:'preview',ga:'G-TEST'});", f.context);
  f.context.preview.setConsent({analytics:true,recording:true});
  assert.equal(f.scripts.length, 0);
});
check('Cansu conversion events send only while consent is active', () => {
  const signals = { count: 0 };
  const browser = {
    window: { __qctAnalyticsConsent: false },
    document: { currentScript: { dataset: { site: 'test' } }, referrer: '', addEventListener() {} },
    location: { pathname: '/test/', search: '' }, URL, URLSearchParams, Blob,
    navigator: { sendBeacon() { signals.count++; return true; } },
    Element: class {}, HTMLFormElement: class {}, setTimeout,
  };
  vm.createContext(browser);
  vm.runInContext(readFileSync('public/cansu-events.js', 'utf8'), browser);
  assert.equal(browser.window.CansuEvents.track('test_event'), false);
  assert.equal(signals.count, 0);
  browser.window.__qctAnalyticsConsent = true;
  assert.equal(browser.window.CansuEvents.track('test_event'), true);
  assert.equal(signals.count, 1);
  browser.window.__qctAnalyticsConsent = false;
  assert.equal(browser.window.CansuEvents.track('test_event'), false);
  assert.equal(signals.count, 1);
});

check('Cansu tracking is not embedded statically in page layouts', () => {
  const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
  assert.doesNotMatch(layout, /cansu-(?:source-beacon|events|umami-loader)/);
});

console.log(`${checks} analytics checks passed`);
