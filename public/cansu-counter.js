(() => {
  // CANSU 7-Day Privacy-Safe Aggregate Traffic Monitor (PSATM)
  // Window: 2026-11-09T00:00:00Z - 2026-11-16T23:59:59Z
  const EXPIRY = 1794787199000;
  if (Date.now() > EXPIRY) return;

  const current = document.currentScript;
  const site = current?.dataset.site;
  if (!site) return;

  const endpoint = 'https://cansu.teyfikgokdemir.com/api/counter';
  const ua = navigator.userAgent || '';
  const isBot =
    navigator.webdriver === true ||
    /headlesschrome|playwright|puppeteer|lighthouse|pagespeed|googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|crawler|spider|bot\b/i.test(ua);

  // Send single aggregate count ping per navigation
  const ping = () => {
    try {
      const data = JSON.stringify({
        site,
        path: location.pathname || '/',
        is_bot: isBot,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, data);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: data,
          mode: 'cors',
          credentials: 'omit',
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  };

  // Run on load
  if (document.readyState === 'complete') {
    ping();
  } else {
    window.addEventListener('load', ping, { once: true });
  }
})();
