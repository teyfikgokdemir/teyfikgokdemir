(() => {
  const endpoint = 'https://teyfikgokdemir.com/api/sources';
  const current = document.currentScript;
  const site = current?.dataset.site;
  if (!site) return;

  const sessionKey = 'cansu-source-sent-v2:' + site;
  const RETRY_DELAYS = [1200, 5000];

  const payload = () => {
    const query = new URLSearchParams(location.search);
    let referrerHost = '';
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {}
    if (referrerHost === location.hostname) referrerHost = '';

    return {
      site,
      landing_path: location.pathname,
      referrer_host: referrerHost,
      utm_source: query.get('utm_source') || '',
      utm_medium: query.get('utm_medium') || '',
      utm_campaign: query.get('utm_campaign') || '',
    };
  };

  const alreadySent = () => {
    try { return sessionStorage.getItem(sessionKey) === '1'; } catch { return false; }
  };

  const markSent = () => {
    try { sessionStorage.setItem(sessionKey, '1'); } catch {}
  };

  const post = async () => {
    if (alreadySent()) return true;
    const body = JSON.stringify(payload());

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) {
          markSent();
          return true;
        }
      }
    } catch {}

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        keepalive: true,
      });
      if (response.ok) {
        markSent();
        return true;
      }
    } catch {}

    return false;
  };

  const run = async () => {
    if (await post()) return;
    for (const delay of RETRY_DELAYS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (await post()) return;
    }
  };

  run();
})();
