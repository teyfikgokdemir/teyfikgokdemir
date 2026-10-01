(() => {
  const current = document.currentScript;
  const site = current?.dataset.site;
  const endpoint = current?.dataset.endpoint || 'https://teyfikgokdemir.com/api/conversions';
  if (!site || !endpoint) return;

  const context = () => {
    const query = new URLSearchParams(location.search);
    let referrerHost = '';
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    return {
      site,
      landing_path: location.pathname,
      referrer_host: referrerHost,
      utm_source: query.get('utm_source') || '',
      utm_medium: query.get('utm_medium') || '',
      event_quality: 'browser',
    };
  };

  const send = (eventType, extra = {}) => {
    const payload = JSON.stringify({ ...context(), ...extra, event_type: eventType });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) return true;
      }
    } catch {}
    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    }).catch(() => {});
    return true;
  };

  const classify = (href) => {
    const value = String(href || '').trim().toLowerCase();
    if (!value) return null;
    if (value.startsWith('tel:')) return 'phone_click';
    if (value.startsWith('mailto:')) return 'email_click';
    if (value.includes('wa.me/') || value.includes('api.whatsapp.com/') || value.includes('whatsapp.com/send')) return 'whatsapp_click';
    return null;
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!target) return;
    const type = classify(target.getAttribute('href'));
    if (type) send(type);
  }, { capture: true });

  window.CansuEvents = Object.freeze({
    track(eventType, extra = {}) {
      return send(eventType, extra);
    },
  });
})();
