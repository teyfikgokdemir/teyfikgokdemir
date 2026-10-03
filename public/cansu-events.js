(() => {
  const current = document.currentScript;
  const site = current?.dataset.site;
  const endpoint = current?.dataset.endpoint || 'https://teyfikgokdemir.com/api/conversions';
  if (!site || !endpoint) return;

  const context = () => {
    const query = new URLSearchParams(location.search);
    let referrerHost = '';
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    if (referrerHost === location.hostname) referrerHost = '';
    return {
      site,
      landing_path: location.pathname,
      referrer_host: referrerHost,
      utm_source: query.get('utm_source') || '',
      utm_medium: query.get('utm_medium') || '',
      utm_campaign: query.get('utm_campaign') || '',
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

  const classifyLink = (href) => {
    const value = String(href || '').trim().toLowerCase();
    if (!value) return null;
    if (value.startsWith('tel:')) return 'phone_click';
    if (value.startsWith('mailto:')) return 'email_click';
    if (value.includes('wa.me/') || value.includes('api.whatsapp.com/') || value.includes('web.whatsapp.com/') || value.includes('whatsapp.com/send')) return 'whatsapp_click';
    if (value.includes('t.me/') || value.includes('telegram.me/') || value.startsWith('tg://')) return 'telegram_click';
    return null;
  };

  const classifyForm = (form) => {
    const signature = [
      form.getAttribute('action') || '',
      form.getAttribute('id') || '',
      form.getAttribute('name') || '',
      form.getAttribute('class') || '',
      form.getAttribute('data-form-type') || '',
      form.getAttribute('data-event') || '',
    ].join(' ').toLowerCase();
    return /(rfq|quote|quotation|teklif|talep|request)/i.test(signature) ? 'rfq_submit' : 'form_submit';
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!target) return;
    const type = classifyLink(target.getAttribute('href'));
    if (type) send(type);
  }, { capture: true });

  document.addEventListener('submit', (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    if (form.dataset.cansuTracked === 'true') return;
    form.dataset.cansuTracked = 'true';
    send(classifyForm(form), {
      form_name: (form.getAttribute('name') || form.getAttribute('id') || '').slice(0, 80),
    });
    setTimeout(() => { try { delete form.dataset.cansuTracked; } catch {} }, 3000);
  }, { capture: true });

  window.CansuEvents = Object.freeze({
    track(eventType, extra = {}) {
      return send(eventType, extra);
    },
  });
})();
