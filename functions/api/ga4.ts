interface Env { GSC_CLIENT_ID?: string; GSC_CLIENT_SECRET?: string; GA4_PROPERTY_QCTONE?: string; CANSU_GSC_TOKENS?: KVNamespace; }
const sites = [
  ['qct-commerce-tr','QCT Commerce','537161539'], ['ctseg','CTSEG','547090229'],
  ['qct-studio','QCT Studio','546070664'],
  ['teyfikgokdemir','Teyfik Gökdemir','546781081'], ['mythborn','Mythborn','533726221'],
];
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, {...init, signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  const body = await response.json() as Record<string, any>;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_response');
  return body;
}
const metricNames = ['sessions','totalUsers','screenPageViews','averageSessionDuration','bounceRate'];
const dateRanges = [
  {name:'oneDay', startDate:'today', endDate:'today'},
  {name:'sevenDays', startDate:'6daysAgo', endDate:'today'},
  {name:'thirtyDays', startDate:'29daysAgo', endDate:'today'},
];
const emptyPeriod = () => ({visits:0, visitors:0, pageviews:0, totaltime:0, bounces:0});
const reportCacheKey = (siteKey: string) => `ga4_report:${siteKey}`;
async function readCachedReport(env: Env, siteKey: string) {
  try {
    const raw = await env.CANSU_GSC_TOKENS?.get(reportCacheKey(siteKey));
    if (!raw) return null;
    const cached = JSON.parse(raw) as Record<string, any>;
    return cached?.connected === true && cached?.periods && typeof cached.periods === 'object' ? cached : null;
  } catch { return null; }
}
async function writeCachedReport(env: Env, siteKey: string, report: Record<string, any>) {
  try {
    await env.CANSU_GSC_TOKENS?.put(reportCacheKey(siteKey), JSON.stringify({...report,cachedAt:new Date().toISOString()}), {expirationTtl:60*60*24*7});
  } catch { /* Reporting must not fail when the fallback cache is unavailable. */ }
}
function parsePeriod(row: Record<string, any>) {
  const values = row.metricValues?.map((v:any)=>Number(v.value)) || [0,0,0,0,0];
  if (values.length !== metricNames.length || values.some((v:number)=>!Number.isFinite(v))) throw new Error('invalid_metrics');
  return {visits:values[0], visitors:values[1], pageviews:values[2], totaltime:values[3]*values[0], bounces:values[4]*values[0]};
}
async function runPeriods(property: string, accessToken: string) {
  const report = await fetchJson(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method:'POST',
    headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json'},
    body:JSON.stringify({dateRanges,metrics:metricNames.map(name=>({name}))}),
  });
  if (report.rows && !Array.isArray(report.rows)) throw new Error('invalid_response');
  const periods: Record<string, ReturnType<typeof emptyPeriod>> = {
    oneDay:emptyPeriod(), sevenDays:emptyPeriod(), thirtyDays:emptyPeriod(),
  };
  for (const row of report.rows || []) {
    const rangeName = row.dimensionValues?.at(-1)?.value;
    if (typeof rangeName === 'string' && rangeName in periods) periods[rangeName] = parsePeriod(row);
  }
  return periods;
}
export const onRequestGet: PagesFunction<Env> = async ({request,env}) => {
  const refresh = await env.CANSU_GSC_TOKENS?.get('ga4_refresh_token');
  if (!refresh || !env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET) return json({ok:false, configured:false, source:'GA4', connectUrl:'/api/gsc/start?analytics=1', reason:'GA4 salt okunur Google bağlantısı gerekli'});
  try {
    const allSites = [...sites, ['qctone','QCT One', env.GA4_PROPERTY_QCTONE || '']];
    const requestedSite = new URL(request.url).searchParams.get('site');
    const selectedSites = requestedSite ? allSites.filter(([key]) => key === requestedSite) : allSites;
    if (requestedSite && selectedSites.length === 0) return json({ok:false, configured:true, source:'GA4', reason:'Geçersiz site'},400);
    const token = await fetchJson('https://oauth2.googleapis.com/token', {method:'POST', body:new URLSearchParams({client_id:env.GSC_CLIENT_ID, client_secret:env.GSC_CLIENT_SECRET, refresh_token:refresh, grant_type:'refresh_token'})});
    if (typeof token.access_token !== 'string') throw new Error('invalid_token');
    const results: Record<string, any>[] = [];
    for (let index = 0; index < selectedSites.length; index += 2) {
      const chunk = selectedSites.slice(index,index + 2);
      results.push(...await Promise.all(chunk.map(async ([key,name,property]) => {
        if (!property) return {key,name,connected:false,reason:'QCT One GA4 property ID bekleniyor'};
        try {
          const periods = await runPeriods(property, token.access_token);
          const report = {key,name,connected:true,property,periods};
          await writeCachedReport(env, key, report);
          return report;
        } catch (error) {
          const detail = error instanceof Error && /^(upstream_\d+|invalid_(response|reports|metrics))$/.test(error.message) ? error.message : 'timeout';
          const cached = await readCachedReport(env, key);
          if (cached) return {...cached,key,name,property,connected:true,stale:true,reason:'Google Data API yanıtı gecikti; son başarılı rapor gösteriliyor'};
          const reason = detail === 'timeout'
            ? 'Google Data API yanıtı zaman aşımına uğradı'
            : detail === 'upstream_403'
              ? 'GA4 mülk görüntüleme yetkisi kontrol edilmeli (403)'
              : `GA4 raporu alınamadı (${detail})`;
          return {key,name,connected:false,reason};
        }
      })));
    }
    return json({ok:true,configured:true,source:'GA4',generatedAt:new Date().toISOString(),connectedCount:results.filter(s=>s.connected).length,sites:results});
  } catch { return json({ok:false,configured:true,source:'GA4',reason:'Google bağlantısı yenilenmeli veya API erişimi kontrol edilmeli'},502); }
};
