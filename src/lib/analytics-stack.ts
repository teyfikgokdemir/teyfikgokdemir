/** QCT reference analytics runtime. GA remains site-owned; GTM must not duplicate GA/Clarity. */
export type Params = Record<string, unknown>;
type Consent = { analytics: boolean; marketing?: boolean; recording?: boolean };
type Config = { hostname?: string; site: string; ga: string; gtm?: string; clarity?: string; advanced?: boolean; clarityCookieless?: boolean };
const names = new Set(('whatsapp_click phone_click email_click cta_click contact_click contact_cta_click outbound_click language_change service_view reference_view blog_view scroll_depth form_start form_submit contact_form_start contact_intent_toggle form_fallback_download contact_form_submit_attempt contact_form_success contact_form_error generate_lead email_draft_open pricing_start pricing_complete profit_calculator_complete product_quote_click catalog_download how_we_work_cta_click case_scenario_cta_click trade_intent_click direct_contact_click fa_landing_referral_click case_study_click service_detail_click').split(' '));
const keys = new Set(('intent cta_type cta_location service platform product_scope form_name form_type trade_intent support_need trade_direction product_family contact_channel catalog_language target_locale page_type lead_source destination percent_scrolled pricing_value').split(' '));
export function safeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { value = decodeURIComponent(value); } catch { return ''; }
  return String(value).replace(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi, '[redacted]').replace(/\+?\d[\d\s().-]{6,}\d/g, '[redacted]').split(/[?#]/)[0].slice(0, 100);
}
export function safePath(value: string): string {
  try { return safeText(new URL(value, location.origin).pathname); } catch { return '/'; }
}
export function createAnalytics(config: Config) {
  if (config.hostname && ![config.hostname, 'www.' + config.hostname].includes(location.hostname)) return { setConsent(_next: Consent) {}, track(_name: string, _params: Params = {}) { return false; }, page() {}, destroy() {} };
  const w = window as any;
  if (w.__qctStack) return w.__qctStack as ReturnType<typeof build>;
  return w.__qctStack = build(config);
}
function build(config: Config) {
  const w = window as any;
  let consent: Consent = { analytics: false, marketing: false };
  let gaLoaded = false, extrasLoaded = false, clarityLoaded = false, lastPage = '', classifiedPage = '';
  let attribution: Params = {};
  const scrolls = new Set<number>();
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  const googleConsent = (kind: string) => w.gtag('consent', kind, {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.marketing ? 'granted' : 'denied',
    ad_user_data: consent.marketing ? 'granted' : 'denied',
    ad_personalization: consent.marketing ? 'granted' : 'denied',
  });
  googleConsent('default');
  const load = (id: string, src: string) => {
    if (document.getElementById(id)) return;
    const s = document.createElement('script'); s.id = id; s.async = true; s.src = src;
    document.head.appendChild(s);
  };
  function captureAttribution() {
    if (!consent.analytics) return;
    const key = config.site + '-analytics-attribution-v2';
    const allowed = ['utm_source', 'utm_medium', 'utm_campaign'];
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        attribution = Object.fromEntries(['landing_path', 'referrer_host', ...allowed].filter(k => typeof saved[k] === 'string').map(k => [k, safeText(saved[k])]));
        return;
      }
    } catch {}
    let referrer = '';
    try { referrer = new URL(document.referrer).hostname; } catch {}
    attribution = { landing_path: safePath(location.href), referrer_host: referrer === location.hostname ? '' : safeText(referrer) };
    const query = new URLSearchParams(location.search);
    for (const key of allowed) {
      const value = query.get(key) || '';
      // Campaign identifiers only: no free text, emails, click identifiers or search terms.
      if (/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value) && !/\d{7}/.test(value)) attribution[key] = value;
    }
    try { sessionStorage.setItem(key, JSON.stringify(attribution)); } catch {}
  }
  function context() {
    return { site_id: config.site, page_path: safePath(location.href), page_location: location.origin + safePath(location.href), page_referrer: (() => { try { return new URL(document.referrer).origin; } catch { return ''; } })(), language: safeText(document.documentElement.lang), ...attribution };
  }
  function loadGa() {
    if (gaLoaded || !/^G-[A-Z0-9]+$/.test(config.ga)) return;
    gaLoaded = true;
    w.gtag('js', new Date());
    w.gtag('config', config.ga, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ...context() });
    load('qct-ga4', 'https://www.googletagmanager.com/gtag/js?id=' + config.ga);
  }
  function page() {
    const path = safePath(location.href);
    if (!consent.analytics && !config.advanced) return;
    if (path !== lastPage) {
      lastPage = path; scrolls.clear();
      loadGa();
      w.gtag('event', 'page_view', context());
    }
    if ((consent.analytics || config.advanced) && path !== classifiedPage) {
      classifiedPage = path;
      if (/\/(blog|insights|icgoruler)\/.+/.test(path)) track('blog_view');
      else if (/\/(work|calismalar|referanslar|references|case-studies|referenzen|realisations|temsili-calisma-senaryolari)(\/|$)/.test(path)) track('reference_view');
      else if (/\/(services|hizmetler|cozumler|website-design|web-design|web-tasarim|ecommerce|e-commerce|e-ticaret|seo|seo-geo|search-visibility|meta-ads|meta-reklamlari|ai-automation|yapay-zeka-otomasyonlari|shopify|ikas|sourcing|supplier-verification)(\/|-|$)/.test(path)) track('service_view');
    }
  }
  function extras() {
    if (consent.analytics && !extrasLoaded && /^GTM-[A-Z0-9]+$/.test(config.gtm || '')) {
      extrasLoaded = true;
      w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      load('qct-gtm', 'https://www.googletagmanager.com/gtm.js?id=' + config.gtm);
    }
    // Recording never starts on URLs containing potentially sensitive query/hash data.
    if (!clarityLoaded && (config.clarityCookieless || (consent.analytics && consent.recording === true)) && /^[a-z0-9]{5,20}$/.test(config.clarity || '') && !location.search && !location.hash) {
      clarityLoaded = true;
      w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
      document.body.setAttribute('data-clarity-mask', 'true');
      w.clarity('consentv2', { analytics_Storage: consent.analytics && consent.recording ? 'granted' : 'denied', ad_Storage: consent.marketing ? 'granted' : 'denied' });
      load('qct-clarity', 'https://www.clarity.ms/tag/' + config.clarity);
    }
  }
  function setConsent(next: Consent) {
    const revoked = consent.analytics && next.analytics !== true;
    consent = { analytics: next.analytics === true, marketing: next.marketing === true, recording: next.recording === true };
    googleConsent('update');
    if (w.clarity) w.clarity('consentv2', { analytics_Storage: consent.analytics && consent.recording ? 'granted' : 'denied', ad_Storage: consent.marketing ? 'granted' : 'denied' });
    if (revoked) {
      attribution = {}; w.__ctsegAttribution = {};
      try { sessionStorage.removeItem(config.site + '-analytics-attribution-v2'); } catch {}
      for (const item of document.cookie.split(';')) {
        const name = item.trim().split('=')[0];
        if (!/^(_ga|_gid|_gat|_clck|_clsk)(_|$)/.test(name)) continue;
        const parts = location.hostname.split('.');
        document.cookie = name + '=; Max-Age=0; path=/';
        for (let i = 0; i < parts.length - 1; i++) document.cookie = name + '=; Max-Age=0; path=/; domain=.' + parts.slice(i).join('.');
      }
      // Loaded third-party scripts cannot be unloaded reliably. Reload after persisting choice.
      location.reload();
      return;
    }
    if (consent.analytics) { captureAttribution(); w.__ctsegAttribution = { ...attribution }; loadGa(); extras(); }
    else if (config.advanced) loadGa();
    extras();
    page();
  }
  function track(name: string, params: Params = {}) {
    if ((!consent.analytics && !config.advanced) || !names.has(name)) return false;
    const clean: Params = {};
    for (const [key, value] of Object.entries(params || {})) {
      if (!keys.has(key)) continue;
      if (key === 'percent_scrolled' || key === 'pricing_value') {
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000000) clean[key] = value;
      } else if (typeof value === 'string') clean[key] = safeText(value);
    }
    const data = { ...context(), ...clean };
    w.gtag('event', name, data);
    // Separate envelope avoids GTM re-sending the GA-owned events by default.
    w.dataLayer.push({ event: 'qct_event', qct_event_name: name, qct_event_params: data });
    if (w.clarity) w.clarity('event', name);
    return true;
  }
  function onClick(event: Event) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    let url: URL;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.protocol === 'mailto:') track('email_click');
    else if (url.protocol === 'tel:') track('phone_click');
    else if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) track('whatsapp_click');
    else if (link.hasAttribute('hreflang')) track('language_change', { target_locale: link.hreflang });
    else if (/^https?:$/.test(url.protocol) && url.origin !== location.origin) track('outbound_click', { destination: url.hostname });
    else if (link.matches('[data-cta], [data-qct-cta], .button, .qct-btn, .nav-cta, .v2-btn, .btn')) track('cta_click', { destination: safePath(url.href) });
  }
  function onScroll() {
    if (!consent.analytics && !config.advanced) return;
    const height = document.documentElement.scrollHeight - innerHeight;
    if (height <= 0) return;
    const percent = scrollY / height * 100;
    for (const step of [25, 50, 75, 90]) if (percent >= step && !scrolls.has(step)) { scrolls.add(step); track('scroll_depth', { percent_scrolled: step }); }
  }
  document.addEventListener('click', onClick);
  window.addEventListener('scroll', onScroll, { passive: true });
  return { setConsent, track, page, destroy() { document.removeEventListener('click', onClick); window.removeEventListener('scroll', onScroll); } };
}
