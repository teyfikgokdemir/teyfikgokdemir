(() => {
  const current = document.currentScript;
  const site = current?.dataset.site;
  if (!site) return;

  // Guard against duplicate loader executions (e.g. framework double-mount) and duplicate Umami scripts.
  if (window.__cansuUmamiLoader) return;
  window.__cansuUmamiLoader = true;
  if (document.querySelector('script[data-cansu-umami-loaded="true"]')) return;

  // The Cansu subdomain is the primary analytics control plane; the apex path stays as a legacy fallback.
  const endpoints = [
    'https://cansu.teyfikgokdemir.com/api/umami-config?site=' + encodeURIComponent(site),
    'https://teyfikgokdemir.com/api/umami-config?site=' + encodeURIComponent(site),
  ];
  const RETRY_DELAY_MS = 1200;

  // Observable state without console noise: window.__cansuUmami, <html data-cansu-umami>, and a DOM event.
  const state = { site, state: 'loading', attempts: 0, error: '', updatedAt: Date.now() };
  window.__cansuUmami = state;
  const report = (next, error) => {
    state.state = next;
    state.error = error ? String(error).slice(0, 160) : '';
    state.updatedAt = Date.now();
    try {
      document.documentElement.dataset.cansuUmami = next;
      window.dispatchEvent(new CustomEvent('cansu:umami', { detail: { ...state } }));
      if (next.endsWith('failed') && localStorage.getItem('cansu-debug') === '1') {
        console.warn('[cansu-umami]', next, state.error);
      }
    } catch {}
  };

  const fetchConfig = async (url) => {
    state.attempts += 1;
    const response = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'default' });
    if (!response.ok) throw new Error('config HTTP ' + response.status);
    return response.json();
  };

  const loadConfig = async () => {
    try {
      return await fetchConfig(endpoints[0]);
    } catch (firstError) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      try {
        return await fetchConfig(endpoints[1]);
      } catch (secondError) {
        throw new Error((firstError?.message || 'fetch error') + ' | ' + (secondError?.message || 'fetch error'));
      }
    }
  };

  loadConfig()
    .then((config) => {
      if (!config?.enabled || !config?.scriptUrl || !config?.websiteId) {
        report('disabled');
        return;
      }
      if (document.querySelector('script[data-website-id="' + config.websiteId + '"]')) {
        report('ready');
        return;
      }

      const script = document.createElement('script');
      script.defer = true;
      script.src = config.scriptUrl;
      script.dataset.websiteId = config.websiteId;
      script.dataset.domains = config.domain || location.hostname;
      script.dataset.performance = config.performance ? 'true' : 'false';
      script.dataset.excludeHash = 'true';
      script.dataset.cansuUmamiLoaded = 'true';
      script.onload = () => report('ready');
      script.onerror = () => report('script-failed', 'script.js load failed: ' + config.scriptUrl);
      document.head.appendChild(script);
    })
    .catch((error) => report('config-failed', error?.message || error));
})();
