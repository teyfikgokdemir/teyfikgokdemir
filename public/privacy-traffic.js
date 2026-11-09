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

  const body = JSON.stringify({
    site,
    landing_path: location.pathname || '/',
    collector_version: '5',
  });

  fetch('https://cansu.teyfikgokdemir.com/api/sources', {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    keepalive: true,
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    body,
  }).catch(() => {});
})();
