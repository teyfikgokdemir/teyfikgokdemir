const period = document.getElementById('portfolio-period');
const search = document.getElementById('portfolio-search');
const rows = document.getElementById('portfolio-rows');
const state = document.getElementById('portfolio-state');
const source = document.getElementById('portfolio-source');
const sourceTabs = [...document.querySelectorAll('[data-source]')];
const clarityPanel = document.getElementById('clarity-source-panel');
const clarityState = document.getElementById('clarity-api-state');
const clarityStatus = document.getElementById('clarity-api-status');
const clarityUpdated = document.getElementById('clarity-api-updated');
const claritySessions = document.getElementById('clarity-sessions');
const clarityVisitors = document.getElementById('clarity-visitors');
const claritySiteGrid = document.getElementById('clarity-site-grid');
const ga4OverviewGrid = document.getElementById('ga4-overview-grid');
const clarityOverviewGrid = document.getElementById('clarity-overview-grid');
const claritySites = [
  ['qct-commerce-tr', 'QCT Commerce'], ['ctseg', 'CTSEG'], ['qct-studio', 'QCT Studio'],
  ['teyfikgokdemir', 'Kişisel site'], ['mythborn', 'Mythborn'], ['qctone', 'QCT One']
];
const snapshots = {};
let clarityLoadPromise;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clarityFailureLabel = code => ({ missing_token: 'token bekleniyor', rate_limited: 'istek limiti aşıldı', auth_error: 'yetkilendirme hatası' }[code] || 'API kullanılamıyor');
const number = value => new Intl.NumberFormat('tr-TR').format(value);
const overviewCard = (name, label, value, detail) => `<article class="quality-card"><div class="quality-card__head"><div class="quality-card__name">${escapeHtml(name)}</div><span class="status-pill status-pill--good">CANLI</span></div><div class="quality-lines"><div class="quality-line"><span>${escapeHtml(label)}</span><strong>${number(value)}</strong></div><div class="quality-line"><span>Durum</span><strong>${escapeHtml(detail)}</strong></div></div></article>`;
const renderGa4Overview = data => {
  if (!ga4OverviewGrid) return;
  const sites = (data?.sites || []).filter(site => site.connected).sort((a, b) => Number(b.periods?.sevenDays?.visits || 0) - Number(a.periods?.sevenDays?.visits || 0)).slice(0, 3);
  ga4OverviewGrid.innerHTML = sites.map(site => overviewCard(site.name, 'Oturum · 7g', Number(site.periods?.sevenDays?.visits || 0), 'GA4 rapor verisi')).join('') || '<div class="country-empty">GA4 verisi bekleniyor…</div>';
};
const renderClarityOverview = results => {
  if (!clarityOverviewGrid) return;
  const trafficFor = result => result.payload.data?.find(item => item.metricName === 'Traffic')?.information || [];
  const sites = results.filter(result => result.ok).map(result => ({ ...result, sessions: trafficFor(result).reduce((total, row) => total + Number(row.totalSessionCount || 0), 0) })).sort((a, b) => b.sessions - a.sessions).slice(0, 3);
  clarityOverviewGrid.innerHTML = sites.map(site => overviewCard(site.name, 'Oturum · 24s', site.sessions, 'Clarity API verisi')).join('') || '<div class="country-empty">Clarity verisi bekleniyor…</div>';
};
const loadAllClaritySites = () => {
  if (clarityLoadPromise) return clarityLoadPromise;
  clarityLoadPromise = Promise.all(claritySites.map(async ([key, name]) => {
    try {
      const response = await fetch(`/api/clarity?numOfDays=1&site=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(15000) });
      const payload = await response.json();
      if (!payload.code && response.status === 429) payload.code = 'rate_limited';
      return { key, name, payload, ok: response.ok && payload.ok };
    }
    catch (error) { return { key, name, payload: { reason: error instanceof Error ? error.message : 'API verisi alınamadı' }, ok: false }; }
  }));
  return clarityLoadPromise;
};
function render() {
  const isClarity = source.value === 'clarity';
  period.options[0].textContent = source.value === 'ga4' ? 'Bugün' : 'Son 24 saat';
  rows.replaceChildren();
  if (clarityPanel) clarityPanel.hidden = !isClarity;
  sourceTabs.forEach(tab => { const active = tab.dataset.source === source.value; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
  if (isClarity) { state.textContent = 'Clarity davranış görünümü etkin'; loadClarity(); return; }
  const snapshot = snapshots[source.value];
  if (!snapshot) { state.textContent = 'Veri kaynağı yükleniyor…'; return; }
  const { data, cached } = snapshot;
  if (!data.configured || data.ok === false) {
    state.textContent = data.reason || 'Veri kaynağı hazır değil';
    return;
  }
  state.textContent = `${cached ? 'Önbellek' : 'Son alınan veri'} · ${data.connectedCount ?? 0}/${data.sites?.length ?? 7} site bağlı · ${data.generatedAt ? new Date(data.generatedAt).toLocaleString('tr-TR') : 'zaman bilgisi yok'}`;
  const sites = (data.sites || []).filter(site => !search.value || site.key === search.value);
  sites.sort((a,b) => (b.periods?.[period.value]?.visits || 0) - (a.periods?.[period.value]?.visits || 0));
  for (const site of sites) {
    const metrics = site.periods?.[period.value];
    const visits = Number(metrics?.visits || 0);
    const values = [site.name, metrics ? number(visits) : '—', metrics ? number(metrics.visitors) : '—', metrics ? number(metrics.pageviews) : '—', metrics && visits ? `${number(Math.round(metrics.totaltime / visits))} sn` : '—', metrics && visits ? `${number(Math.round(metrics.bounces / visits * 100))}%` : '—', site.connected ? (cached ? 'Önbellek' : 'Bağlı') : (site.reason || 'Veri yok')];
    const row = document.createElement('tr');
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      cell.style.cssText = 'padding:.9rem .6rem;border-bottom:1px solid #334155;white-space:nowrap';
      row.append(cell);
    }
    rows.append(row);
  }
  if (!sites.length) state.textContent += ' · Seçilen site için veri bulunamadı';
}
window.addEventListener('cansu:umami', event => { snapshots.umami = event.detail; render(); });
if (window.cansuUmamiSnapshot) snapshots.umami = window.cansuUmamiSnapshot;
render();
source.addEventListener('change', render);
sourceTabs.forEach(tab => tab.addEventListener('click', () => { source.value = tab.dataset.source; render(); }));
async function loadClarity() {
  if (clarityState?.dataset.loading === 'true') return;
  if (clarityState) clarityState.dataset.loading = 'true';
  try {
    const allResults = await loadAllClaritySites();
    const results = search.value ? allResults.filter(result => result.key === search.value) : allResults;
    const connected = results.filter(result => result.ok).length;
    const failed = results.filter(result => !result.ok);
    const failureLabel = failed.every(result => result.payload.code === failed[0]?.payload.code) ? clarityFailureLabel(failed[0]?.payload.code) : 'API bağlantıları kontrol edilmeli';
    if (clarityState) {
      clarityState.textContent = `Clarity · ${connected === results.length ? 'bağlı' : connected ? 'kısmen bağlı' : failureLabel}`;
      clarityState.classList.toggle('is-warning', failed.length > 0);
    }
    if (clarityStatus) clarityStatus.textContent = failed.length ? `${connected}/${results.length} site bağlı · ${failed.map(result => `${result.name}: ${result.payload.reason || 'Veri yok'}`).join(' · ')}` : 'API verisi alındı';
    const generatedAt = results.find(result => result.payload?.generatedAt)?.payload.generatedAt;
    if (clarityUpdated) clarityUpdated.textContent = generatedAt ? new Date(generatedAt).toLocaleString('tr-TR') : '—';
    const trafficFor = result => result.payload.data?.find(item => item.metricName === 'Traffic')?.information || [];
    renderClarityOverview(allResults);
    const traffic = results.flatMap(trafficFor);
    const sum = key => traffic.reduce((total, row) => total + Number(row[key] || 0), 0);
    if (claritySessions) claritySessions.textContent = connected ? number(sum('totalSessionCount')) : '—';
    if (clarityVisitors) clarityVisitors.textContent = connected ? number(sum('distinctUserCount')) : '—';
    if (claritySiteGrid) claritySiteGrid.innerHTML = results.map(result => {
      const rows = trafficFor(result); const sessions = rows.reduce((total, row) => total + Number(row.totalSessionCount || 0), 0); const visitors = rows.reduce((total, row) => total + Number(row.distinctUserCount || 0), 0);
      return `<article class="quality-card"><div class="quality-card__head"><div class="quality-card__name">${result.name}</div><span class="status-pill ${result.ok ? 'status-pill--good' : 'status-pill--warn'}">${result.ok ? 'BAĞLI' : escapeHtml(clarityFailureLabel(result.payload.code))}</span></div><div class="quality-lines"><div class="quality-line"><span>Oturum · 24s</span><strong>${result.ok ? number(sessions) : '—'}</strong></div><div class="quality-line"><span>Tekil ziyaretçi · 24s</span><strong>${result.ok ? number(visitors) : '—'}</strong></div><div class="quality-line"><span>Durum</span><strong>${result.ok ? 'Clarity API verisi alındı' : escapeHtml(result.payload.reason || 'Veri yok')}</strong></div></div></article>`;
    }).join('');
  } catch (error) {
    if (clarityState) { clarityState.textContent = 'Clarity · API kullanılamıyor'; clarityState.classList.add('is-warning'); }
    if (clarityStatus) clarityStatus.textContent = error instanceof Error ? error.message : 'API verisi alınamadı';
    if (claritySiteGrid) claritySiteGrid.textContent = 'Clarity verisi alınamadı.';
  } finally { if (clarityState) clarityState.dataset.loading = 'false'; }
}
async function loadGa4() {
  try {
    const sites = [];
    for (const [key, name] of claritySites) {
      try {
        const response = await fetch(`/api/ga4?site=${encodeURIComponent(key)}`, {signal:AbortSignal.timeout(15000)});
        if (!response.ok) throw new Error('unavailable');
        const payload = await response.json();
        sites.push(...(payload.sites || []));
      } catch {
        sites.push({key, name, connected:false, reason:'GA4 rapor isteği zaman aşımına uğradı'});
      }
    }
    const data = {ok:true,configured:true,source:'GA4',generatedAt:new Date().toISOString(),connectedCount:sites.filter(site=>site.connected).length,sites};
    snapshots.ga4 = {data,cached:false};
    renderGa4Overview(snapshots.ga4.data);
  } catch { snapshots.ga4 = {data:{ok:false,reason:'GA4 verisi alınamadı; oturum ve bağlantı kontrol edilmeli'}}; }
  render();
}
loadGa4();
period.addEventListener('change', render);
search.addEventListener('change', render);
