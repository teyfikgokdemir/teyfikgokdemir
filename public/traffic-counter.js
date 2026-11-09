(() => {
  // Privacy-Safe Aggregate Traffic Monitor (PSATM)
  // 7-day temporary monitoring window: 2026-11-09T00:00:00Z - 2026-11-16T23:59:59Z
  // Strictly cookieless, non-persistent, non-identifying aggregate hit counter.
  const EXPIRY = 1794787199000;
  if (Date.now() > EXPIRY) return;

  const current = document.currentScript;
  const site = current?.dataset?.site;
  if (!site) return;

  // Endpoint configuration (supports relative or production origin)
  const endpoint = current?.dataset?.endpoint || 'https://teyfikgokdemir.com/api/counter';

  // Client-side bot and automation detection
  const ua = navigator.userAgent || '';
  const isBot =
    navigator.webdriver === true ||
    /headlesschrome|playwright|puppeteer|lighthouse|pagespeed|googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|crawler|spider|bot\b/i.test(ua);

  const path = (location.pathname || '/').slice(0, 100);

  // Client-side session deduplication (prevents rapid F5 spam within same session)
  const dedupeKey = `_psatm_${site}_${path}`;
  try {
    const lastPing = window.sessionStorage?.getItem(dedupeKey);
    if (lastPing && Date.now() - Number(lastPing) < 15000) {
      return; // Deduplicated within 15 seconds
    }
  } catch {}

  const ping = () => {
    try {
      window.sessionStorage?.setItem(dedupeKey, String(Date.now()));
    } catch {}

    const payload = JSON.stringify({
      site,
      path,
      is_bot: isBot,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, payload);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: payload,
          mode: 'cors',
          credentials: 'omit',
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  };

  if (document.readyState === 'complete') {
    ping();
  } else {
    window.addEventListener('load', ping, { once: true });
  }
})();
