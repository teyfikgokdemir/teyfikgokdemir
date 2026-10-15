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

const DASHBOARD = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Growth OS | Kontrol Merkezi</title><style>
:root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,sans-serif;background:#090e1b;color:#e9f0ff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 0%,#17264c 0%,#090e1b 52%);min-height:100vh}header{padding:24px max(24px,calc((100vw - 1120px)/2));border-bottom:1px solid #263550;display:flex;align-items:center;justify-content:space-between;gap:14px}h1{font-size:clamp(29px,4vw,45px);letter-spacing:-1.4px;margin:14px 0}p{color:#aabbd5;line-height:1.6}.brand{font-weight:750;letter-spacing:.3px}.badge{font-size:12px;color:#acc8fa;border:1px solid #344867;padding:8px 11px;border-radius:999px}main{max-width:1120px;margin:auto;padding:55px 24px 80px}.lead{max-width:690px}.eyebrow{color:#75b7ff;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:750}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin-top:32px}.card{background:#121c31;border:1px solid #273956;border-radius:16px;padding:22px;min-height:185px}.card h2{margin:0 0 10px;font-size:20px}.card p{font-size:14px;margin:6px 0 18px}.action{background:#3478f6;color:white;border:none;border-radius:9px;padding:11px 15px;font-weight:700;cursor:pointer}.action:disabled{opacity:.6;cursor:wait}.result{border-top:1px solid #283b57;margin-top:17px;padding-top:14px;color:#b1cbe7;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}.status{display:inline-flex;gap:8px;align-items:center;background:#162740;border-radius:9px;padding:10px 13px;font-size:13px;color:#a9c4e8;margin-top:22px}footer{margin-top:42px;font-size:13px;color:#8197ba}a{color:#81b4ff}@media(max-width:580px){header{padding:18px 22px}main{padding:35px 22px}.badge{font-size:10px}}
</style></head><body><header><div class="brand">◈ &nbsp;Growth OS</div><div class="badge">Cloudflare · Geliştirme sürümü</div></header><main><div class="eyebrow">Merkezi yönetim platformu</div><h1>Growth Intelligence</h1><p class="lead">Projelerimiz için teknik site kontrolünün ilk çalışan modülü. SEO, GEO, AEO ve ticaret araçlarının kapsamlı paneli geliştirme aşamasında.</p><div class="status" id="status">● Altyapı durumu kontrol ediliyor…</div><section class="grid" id="sites"></section><footer>Bu sürüm yalnızca herkese açık web sayfalarının temel teknik sinyallerini denetler. Özel proje verileri ve entegrasyonlar henüz bağlı değildir.</footer></main><script>
const names={ctseg:'CTSEG',commerce:'QCT Commerce',studio:'QCT Studio',mythborn:'Mythborn',personal:'Kişisel Web Sitesi'};
const escapeHtml=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{try{const r=await fetch('/health',{cache:'no-store'});const data=await r.json();document.getElementById('status').textContent='● Worker: '+(r.ok?'aktif':'kontrol gerekli')+' · Veritabanı: '+escapeHtml(data.database)}catch{document.getElementById('status').textContent='● Sağlık kontrolüne erişilemedi'}})();
const grid=document.getElementById('sites');
Object.entries(names).forEach(([id,name])=>{const card=document.createElement('article');card.className='card';const title=document.createElement('h2');title.textContent=name;const desc=document.createElement('p');desc.textContent='HTTP, başlık, açıklama, canonical ve yapılandırılmış veri kontrolü.';const button=document.createElement('button');button.className='action';button.textContent='Kontrol et';const result=document.createElement('div');result.className='result';result.textContent='Henüz kontrol yapılmadı.';button.onclick=async()=>{button.disabled=true;button.textContent='Kontrol ediliyor…';try{const res=await fetch('/api/public-site-check?site='+encodeURIComponent(id),{cache:'no-store'});const d=await res.json();result.textContent=d.status==='request-failed'?'Erişim hatası: '+d.reason:'HTTP: '+(d.httpStatus??'—')+'\\nBaşlık: '+(d.title??'Bulunamadı')+'\\nMeta açıklama: '+(d.hasDescription?'Var':'Yok')+'\\nCanonical: '+(d.hasCanonical?'Var':'Yok')+'\\nJSON-LD: '+(d.hasStructuredData?'Var':'Yok')+'\\nYanıt: '+(d.durationMs??'—')+' ms'}catch{result.textContent='Kontrol servisine ulaşılamadı.'}finally{button.disabled=false;button.textContent='Yeniden kontrol et'}};card.append(title,desc,button,result);grid.append(card)});
</script></body></html>`;

export default {
  async fetch(request,env){
    const u=new URL(request.url),path=u.pathname;
    if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'METHOD_NOT_ALLOWED'},405);
    if(path==='/'||path==='/index.html')return new Response(request.method==='HEAD'?null:DASHBOARD,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",'x-robots-tag':'noindex, nofollow'}});
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
