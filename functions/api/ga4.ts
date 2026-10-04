interface Env { GSC_CLIENT_ID?: string; GSC_CLIENT_SECRET?: string; CANSU_GSC_TOKENS?: KVNamespace; }
const sites = [
  ['qct-commerce-tr','QCT Commerce','537161539'], ['ctseg','CTSEG','547090229'],
  ['qct-studio','QCT Studio','546070664'], ['olivon-agency','Olivon','553540693'],
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
async function runPeriod(property: string, accessToken: string, startDate: string, endDate: string) {
  const report = await fetchJson(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method:'POST',
    headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json'},
    body:JSON.stringify({dateRanges:[{startDate,endDate}],metrics:metricNames.map(name=>({name}))}),
  });
  const values = report.rows?.[0]?.metricValues?.map((v:any)=>Number(v.value)) || [0,0,0,0,0];
  if (values.length !== metricNames.length || values.some((v:number)=>!Number.isFinite(v))) throw new Error('invalid_metrics');
  return {visits:values[0], visitors:values[1], pageviews:values[2], totaltime:values[3]*values[0], bounces:values[4]*values[0]};
}
export const onRequestGet: PagesFunction<Env> = async ({env}) => {
  const refresh = await env.CANSU_GSC_TOKENS?.get('ga4_refresh_token');
  if (!refresh || !env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET) return json({ok:false, configured:false, source:'GA4', connectUrl:'/api/gsc/start?analytics=1', reason:'GA4 salt okunur Google bağlantısı gerekli'});
  try {
    const token = await fetchJson('https://oauth2.googleapis.com/token', {method:'POST', body:new URLSearchParams({client_id:env.GSC_CLIENT_ID, client_secret:env.GSC_CLIENT_SECRET, refresh_token:refresh, grant_type:'refresh_token'})});
    if (typeof token.access_token !== 'string') throw new Error('invalid_token');
    const results = await Promise.all(sites.map(async ([key,name,property]) => {
      try {
        const periods = {
          oneDay: await runPeriod(property, token.access_token, 'today', 'today'),
          sevenDays: await runPeriod(property, token.access_token, '6daysAgo', 'today'),
          thirtyDays: await runPeriod(property, token.access_token, '29daysAgo', 'today'),
        };
        return {key,name,connected:true,property,periods};
      } catch { return {key,name,connected:false,reason:'GA4 rapor erişimi / API yapılandırması kontrol edilmeli'}; }
    }));
    return json({ok:true,configured:true,source:'GA4',generatedAt:new Date().toISOString(),connectedCount:results.filter(s=>s.connected).length,sites:results});
  } catch { return json({ok:false,configured:true,source:'GA4',reason:'Google bağlantısı yenilenmeli veya API erişimi kontrol edilmeli'},502); }
};
