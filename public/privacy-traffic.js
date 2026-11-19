(() => {
  if (window.__qctPrivacyTrafficLoaded) return;
  window.__qctPrivacyTrafficLoaded = true;

  const script = document.currentScript;
  const site = script?.dataset.site || '';
  const hosts = {
    teyfikgokdemir: ['teyfikgokdemir.com', 'www.teyfikgokdemir.com'],
    ctseg: ['ctseg.com.tr', 'www.ctseg.com.tr'],
    mythborn: ['mythborn.co', 'www.mythborn.co'],
    'qct-studio': ['qctstudio.com', 'www.qctstudio.com'],
    'qct-commerce-tr': ['qctcommerce.com', 'www.qctcommerce.com'],
    qctone: ['qctone.com', 'www.qctone.com'],
  };
  if (!hosts[site]?.includes(location.hostname)) return;

  const ENDPOINT = 'https://cansu.teyfikgokdemir.com/api/sources';
  const send = (payload, preferBeacon = false) => {
    const body = JSON.stringify(payload);
    if (preferBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        if (navigator.sendBeacon(ENDPOINT, body)) return;
      } catch {}
    }
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
      headers: { 'content-type': 'text/plain;charset=UTF-8' },
      body,
    }).catch(() => {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon(ENDPOINT, body);
        }
      } catch {}
    });
  };

  // 1. Always-on lossless cookieless pageview aggregate (runs regardless of banner decision)
  send({
    site,
    landing_path: location.pathname || '/',
    collector_version: '5',
  });

  // 2. Always-on anonymous cookie-banner decision aggregate (zero cookies, zero storage, zero identity)
  const BANNER_SELECTOR = '[data-cookie-consent],[data-cookie-banner],[data-consent-banner],.consent-dialog,.qct-cookie-consent,.cookie-banner,.cookie-consent,#cookie';
  const ACCEPT_SELECTOR = '[data-cookie-accept],[data-consent-accept],[data-accept-cookies],[data-analytics-consent="accept"]';
  const REJECT_SELECTOR = '[data-cookie-reject],[data-consent-reject],[data-reject-cookies],[data-analytics-consent="reject"]';
  const DISMISS_SELECTOR = '[data-cookie-close],[data-consent-close],[data-cookie-dismiss],[data-consent-dismiss],[data-analytics-consent="dismiss"]';

  let bannerShownSent = false;
  let decisionSent = false;

  const isBannerVisible = () => {
    const nodes = document.querySelectorAll(BANNER_SELECTOR);
    for (const el of nodes) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.hidden) continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) continue;
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (!rect || rect.width > 0 || rect.height > 0) return true;
    }
    return false;
  };

  const emitConsentAction = (action, preferBeacon = false) => {
    if (action === 'banner_shown') {
      if (bannerShownSent) return;
      bannerShownSent = true;
    } else {
      if (decisionSent) return;
      decisionSent = true;
    }
    send({
      site,
      action,
      collector_version: 'consent-v1',
    }, preferBeacon);
  };

  const checkBanner = () => {
    if (!bannerShownSent && isBannerVisible()) emitConsentAction('banner_shown');
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest(ACCEPT_SELECTOR)) {
      emitConsentAction('accept');
      return;
    }
    if (target.closest(REJECT_SELECTOR)) {
      emitConsentAction('reject');
      return;
    }
    if (target.closest(DISMISS_SELECTOR)) {
      emitConsentAction('dismiss');
      return;
    }
    const closeInBanner = target.closest('button[aria-label*="kapat" i],button[aria-label*="close" i]');
    if (closeInBanner && closeInBanner.closest(BANNER_SELECTOR)) {
      emitConsentAction('dismiss');
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && bannerShownSent && !decisionSent && isBannerVisible()) {
      emitConsentAction('dismiss');
    }
  }, true);

  window.addEventListener('pagehide', () => {
    if (bannerShownSent && !decisionSent) {
      emitConsentAction('ignored', true);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && bannerShownSent && !decisionSent) {
      emitConsentAction('ignored', true);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkBanner, { once: true });
  } else {
    checkBanner();
  }
  setTimeout(checkBanner, 400);
  setTimeout(checkBanner, 1500);

  if (typeof MutationObserver === 'function' && document.documentElement) {
    const observer = new MutationObserver(() => {
      if (bannerShownSent) { observer.disconnect(); return; }
      checkBanner();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'aria-hidden'] });
    setTimeout(() => observer.disconnect(), 10000);
  }
})();
