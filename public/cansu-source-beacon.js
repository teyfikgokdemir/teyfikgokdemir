(() => {
  const endpoint = 'https://teyfikgokdemir.com/api/sources';
  const site = document.currentScript?.dataset.site;
  const consentKey = 'tg-cookie-consent';
  const sessionKey = 'cansu-source-sent-v1';

  const send = () => {
    if (!site) return;
    try {
      if (localStorage.getItem(consentKey) !== 'accepted') return;
      if (sessionStorage.getItem(sessionKey)) return;

      const query = new URLSearchParams(location.search);
      const referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
      const params = new URLSearchParams({
        event_site: site,
        landing_path: location.pathname,
        referrer_host: referrerHost && referrerHost !== location.hostname ? referrerHost : '',
        utm_source: query.get('utm_source') || '',
        utm_medium: query.get('utm_medium') || '',
        utm_campaign: query.get('utm_campaign') || '',
      });

      const beacon = new Image();
      beacon.src = `${endpoint}?${params.toString()}`;
      sessionStorage.setItem(sessionKey, '1');
    } catch {}
  };

  send();
  window.addEventListener('tg:analytics-consent', send, { once: true });
})();
