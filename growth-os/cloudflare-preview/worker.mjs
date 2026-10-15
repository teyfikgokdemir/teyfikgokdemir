// Growth OS isolated migration preview. Public data only; no internal dashboard or credentials.
const SITES = Object.freeze({
  ctseg: 'https://ctseg.com.tr',
  commerce: 'https://qctcommerce.com',
  studio: 'https://qctstudio.com',
  mythborn: 'https://mythborn.com',
  personal: 'https://teyfikgokdemir.com'
});
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','access-control-allow-origin':'none'};
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:JSON_HEADERS})}
async function checkSite(name){
  const target=SITES[name];
  if(!target)return {site:name,status:'unsupported'};
  const started=Date.now();
  try{
    const response=await fetch(target,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(6500),headers:{'user-agent':'GrowthOS-PublicSiteDiagnostics/1.0'}});
    const type=response.headers.get('content-type')||'';
    // Only consume a bounded text response; no arbitrary URLs or private address targets.
    const page=type.includes('text/html') ? (await response.text()).slice(0,150000) : '';
    const title=page.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim().slice(0,150)||null;
    const description=page.match(/<meta\s+[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i)?.[1]?.slice(0,200)||null;
    return {site:name,host:new URL(target).hostname,httpStatus:response.status,ok:response.ok,contentType:type,title,hasDescription:!!description,hasCanonical:/<link\s+[^>]*rel=['"]canonical['"]/i.test(page),hasStructuredData:/application\/ld\+json/i.test(page),durationMs:Date.now()-started,checkedAt:new Date().toISOString()};
  }catch(e){return {site:name,host:new URL(target).hostname,status:'request-failed',reason:e?.name==='TimeoutError'?'timeout':'upstream-error',checkedAt:new Date().toISOString()}}
}
export default {
  async fetch(request,env){
    const u=new URL(request.url),path=u.pathname;
    if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'METHOD_NOT_ALLOWED'},405);
    if(path==='/health'){
      let database='unavailable';
      try{const r=await env.PREVIEW_DB.prepare("SELECT value FROM migration_meta WHERE key = 'state'").first();if(r?.value==='preview-infrastructure-only')database='ready'}catch{}
      return json({service:'growth-os-cloudflare-preview',phase:'public-diagnostics',applicationReady:false,database},database==='ready'?200:503);
    }
    if(path==='/api/public-site-check'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE',validSites:Object.keys(SITES)},400);
      return json(await checkSite(site));
    }
    if(path==='/api/public-sites')return json({sites:Object.entries(SITES).map(([id,url])=>({id,host:new URL(url).hostname})),disclaimer:'Public website diagnostics only; not authenticated Growth OS'});
    return json({error:'PREVIEW_NOT_CONFIGURED'},403);
  }
};
