const period = document.getElementById('portfolio-period');
const search = document.getElementById('portfolio-search');
const rows = document.getElementById('portfolio-rows');
const state = document.getElementById('portfolio-state');
const source = document.getElementById('portfolio-source');
const connect = document.getElementById('portfolio-connect');
const snapshots = {};
const number = value => new Intl.NumberFormat('tr-TR').format(value);
function render() {
  period.options[0].textContent = source.value === 'ga4' ? 'Bugün' : 'Son 24 saat';
  rows.replaceChildren();
  const snapshot = snapshots[source.value];
  connect.hidden = true;
  if (!snapshot) { state.textContent = 'Veri kaynağı yükleniyor…'; return; }
  const { data, cached } = snapshot;
  if (!data.configured || data.ok === false) {
    state.textContent = data.reason || 'Veri kaynağı hazır değil';
    connect.hidden = source.value !== 'ga4';
    return;
  }
  state.textContent = `${cached ? 'Önbellek' : 'Son alınan veri'} · ${data.connectedCount ?? 0}/6 site bağlı · ${data.generatedAt ? new Date(data.generatedAt).toLocaleString('tr-TR') : 'zaman bilgisi yok'}`;
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
async function loadGa4() {
  try {
    const response = await fetch('/api/ga4', {signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error('unavailable');
    snapshots.ga4 = {data:await response.json(),cached:false};
  } catch { snapshots.ga4 = {data:{ok:false,reason:'GA4 verisi alınamadı; oturum ve bağlantı kontrol edilmeli'}}; }
  render();
}
loadGa4();
period.addEventListener('change', render);
search.addEventListener('change', render);
