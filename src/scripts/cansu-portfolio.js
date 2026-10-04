const period = document.getElementById('portfolio-period');
const search = document.getElementById('portfolio-search');
const rows = document.getElementById('portfolio-rows');
const state = document.getElementById('portfolio-state');
let snapshot;
const number = value => new Intl.NumberFormat('tr-TR').format(value);
function render() {
  if (!snapshot) return;
  const { data, cached } = snapshot;
  rows.replaceChildren();
  state.textContent = `${cached ? 'Önbellek' : 'Son alınan veri'} · ${data.connectedCount ?? 0}/6 site bağlı · ${data.generatedAt ? new Date(data.generatedAt).toLocaleString('tr-TR') : 'zaman bilgisi yok'}`;
  const sites = (data.sites || []).filter(site => String(site.name).toLocaleLowerCase('tr-TR').includes(search.value.toLocaleLowerCase('tr-TR')));
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
  if (!sites.length) state.textContent += ' · Aramaya uygun site bulunamadı';
}
window.addEventListener('cansu:umami', event => { snapshot = event.detail; render(); });
period.addEventListener('change', render);
search.addEventListener('input', render);
