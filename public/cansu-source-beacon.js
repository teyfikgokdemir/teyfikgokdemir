(() => {
  const endpoint = 'https://teyfikgokdemir.com/api/sources';
  const current = document.currentScript;
  const site = current?.dataset.site;
  if (!site) return;

  const HOSTS = {
    teyfikgokdemir: ['teyfikgokdemir.com', 'www.teyfikgokdemir.com'],
    ctseg: ['ctseg.com.tr', 'www.ctseg.com.tr'],
    mythborn: ['mythborn.co', 'www.mythborn.co'],
    'qct-studio': ['qctstudio.com', 'www.qctstudio.com'],
    'qct-commerce-tr': ['qctcommerce.com', 'www.qctcommerce.com'],
    'olivon-agency': ['olivon.com.tr', 'www.olivon.com.tr'],
  };

  const allowedHosts = HOSTS[site] || [];
  const ua = navigator.userAgent || '';
  const automated =
    navigator.webdriver === true ||
    /headlesschrome|playwright|lighthouse|pagespeed|googlebot|bingbot|crawler|spider|bot\b/i.test(ua);

  if (!allowedHosts.includes(location.hostname) || automated) return;

  const sessionIdKey = 'cansu-source-session-v3:' + site;
  const sentKey = 'cansu-source-sent-v3:' + site;
  const RETRY_DELAYS = [1200, 5000];

  const getSessionId = () => {
    try {
      let value = sessionStorage.getItem(sessionIdKey);
      if (value) return value;
      value = (crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2))).replace(/[^a-zA-Z0-9_-]/g, '');
      sessionStorage.setItem(sessionIdKey, value);
      return value;
    } catch {
      return (Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g, '');
    }
  };

  const payload = () => {
    const query = new URLSearchParams(location.search);
    let referrerHost = '';
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {}
    if (referrerHost === location.hostname) referrerHost = '';

    return {
      collector_version: '3',
      session_id: getSessionId(),
      site,
      landing_path: location.pathname,
      referrer_host: referrerHost,
      utm_source: query.get('utm_source') || '',
      utm_medium: query.get('utm_medium') || '',
      utm_campaign: query.get('utm_campaign') || '',
    };
  };

  const alreadySent = () => {
    try { return sessionStorage.getItem(sentKey) === '1'; } catch { return false; }
  };

  const markSent = () => {
    try { sessionStorage.setItem(sentKey, '1'); } catch {}
  };

  const post = async () => {
    if (alreadySent()) return true;
    const body = JSON.stringify(payload());

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
