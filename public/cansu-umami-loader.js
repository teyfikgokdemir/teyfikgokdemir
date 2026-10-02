(() => {
  const current = document.currentScript;
  const site = current?.dataset.site;
  if (!site || document.querySelector('script[data-cansu-umami-loaded="true"]')) return;

  const endpoint = 'https://cansu.teyfikgokdemir.com/api/umami-config?site=' + encodeURIComponent(site);

  fetch(endpoint, { mode: 'cors', credentials: 'omit', cache: 'default' })
    .then((response) => response.ok ? response.json() : null)
    .then((config) => {
      if (!config?.enabled || !config?.scriptUrl || !config?.websiteId) return;
      if (document.querySelector('script[data-website-id="' + config.websiteId + '"]')) return;

      const script = document.createElement('script');
      script.defer = true;
      script.src = config.scriptUrl;
      script.dataset.websiteId = config.websiteId;
      script.dataset.domains = config.domain || location.hostname;
      script.dataset.performance = config.performance ? 'true' : 'false';
      script.dataset.excludeHash = 'true';
      script.dataset.cansuUmamiLoaded = 'true';
      document.head.appendChild(script);
    })
    .catch(() => {});
})();
