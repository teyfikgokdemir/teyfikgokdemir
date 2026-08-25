(() => {
  const endpoint = 'https://teyfikgokdemir.com/api/sources';
  const site = document.currentScript?.dataset.site;
  if (!site || sessionStorage.getItem('cansu-source-sent-v1')) return;
  try {
    const query = new URLSearchParams(location.search);
    const referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
    const payload = {
      site,
      landing_path: location.pathname,
      referrer_host: referrerHost && referrerHost !== location.hostname ? referrerHost : '',
      utm_source: query.get('utm_source') || '',
      utm_medium: query.get('utm_medium') || '',
      utm_campaign: query.get('utm_campaign') || '',
    };
    const params = new URLSearchParams({
      event_site: payload.site,
      landing_path: payload.landing_path,
      referrer_host: payload.referrer_host,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
    });
    const beacon = new Image();
    beacon.src = `${endpoint}?${params.toString()}`;
    sessionStorage.setItem('cansu-source-sent-v1', '1');
  } catch {}
})();
