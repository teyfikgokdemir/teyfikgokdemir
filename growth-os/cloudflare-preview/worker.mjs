// Growth OS isolated migration preview. Public data only; no internal dashboard or credentials.
const SITES = Object.freeze({
  ctseg: 'https://ctseg.com.tr',
  commerce: 'https://qctcommerce.com',
  studio: 'https://qctstudio.com',
  mythborn: 'https://mythborn.co',
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

// Public homepage technical checks only. Do not interpret these as Google index status.
async function technicalAudit(site){
  const origin=SITES[site]; if(!origin)return null;
  async function read(path){
    try{
      const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(6000),headers:{'user-agent':'GrowthOS-SiteAudit/1.0'}});
      const type=response.headers.get('content-type')||'';
      const body=(type.includes('text')||type.includes('xml'))&&response.ok?(await response.text()).slice(0,120000):'';
      return {httpStatus:response.status,contentType:type,body,robotsHeader:response.headers.get('x-robots-tag')||''};
    }catch{return {httpStatus:null,contentType:'',body:'',robotsHeader:'',error:'unreachable'}}
  }
  const [home,robots,sitemap]=await Promise.all([read('/'),read('/robots.txt'),read('/sitemap.xml')]);
  const metaRobots=home.body.match(/<meta\s+[^>]*name=['"]robots['"][^>]*content=['"]([^'"]*)['"]/i)?.[1]||'';
  const noindex=/(^|[,\s])noindex([,\s]|$)/i.test(metaRobots+' '+home.robotsHeader);
  const canonical=home.body.match(/<link\s+[^>]*rel=['"]canonical['"][^>]*href=['"]([^'"]+)['"]/i)?.[1]||null;
  const robotsDisallowAll=/(?:^|\n)\s*User-agent:\s*\*\s*\r?\n\s*Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots.body);
  const sitemapXml=/<(?:urlset|sitemapindex)(?:\s|>)/i.test(sitemap.body);
  const signals=[
    {id:'homepage',label:'Ana sayfa erişimi',state:home.httpStatus===200?'pass':home.httpStatus===null?'unknown':'warning',detail:'HTTP '+(home.httpStatus??'erişilemedi')},
    {id:'robots',label:'robots.txt',state:robots.httpStatus===200?'pass':robots.httpStatus===null?'unknown':'warning',detail:'HTTP '+(robots.httpStatus??'erişilemedi')},
    {id:'robots_block',label:'Genel robots engeli',state:robots.httpStatus!==200?'unknown':robotsDisallowAll?'warning':'pass',detail:robotsDisallowAll?'Genel Disallow: / kuralı tespit edildi':'Genel tam engel tespit edilmedi'},
    {id:'sitemap',label:'XML Sitemap',state:sitemapXml?'pass':sitemap.httpStatus===200?'warning':'unknown',detail:'HTTP '+(sitemap.httpStatus??'erişilemedi')},
    {id:'index',label:'Ana sayfa noindex sinyali',state:home.httpStatus!==200?'unknown':noindex?'warning':'pass',detail:noindex?'Noindex direktifi bulundu':'Noindex direktifi tespit edilmedi'},
    {id:'canonical',label:'Canonical',state:home.httpStatus!==200?'unknown':canonical?'pass':'warning',detail:canonical||'Bulunamadı'}
  ];
  return {site,checkedAt:new Date().toISOString(),signals,disclaimer:'Bu denetim yalnızca ana sayfa ve iki standart dosyayı kontrol eder; gerçek Google indekslenmesini ve kapsamlı robots değerlendirmesini doğrulamaz.'};
}

const DASHBOARD = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Growth OS | Kontrol Merkezi</title><style>
:root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,sans-serif;background:#090e1b;color:#e9f0ff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 0%,#17264c 0%,#090e1b 52%);min-height:100vh}header{padding:24px max(24px,calc((100vw - 1120px)/2));border-bottom:1px solid #263550;display:flex;align-items:center;justify-content:space-between;gap:14px}h1{font-size:clamp(29px,4vw,45px);letter-spacing:-1.4px;margin:14px 0}p{color:#aabbd5;line-height:1.6}.brand{font-weight:750;letter-spacing:.3px}.badge{font-size:12px;color:#acc8fa;border:1px solid #344867;padding:8px 11px;border-radius:999px}main{max-width:1120px;margin:auto;padding:55px 24px 80px}.lead{max-width:690px}.eyebrow{color:#75b7ff;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:750}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin-top:32px}.card{background:#121c31;border:1px solid #273956;border-radius:16px;padding:26px;min-height:154px}.card h2{margin:0 0 10px;font-size:20px}.card p{font-size:14px;margin:6px 0 18px}.action{background:#3478f6;color:white;border:none;border-radius:9px;padding:11px 15px;font-weight:700;cursor:pointer}.action:disabled{opacity:.6;cursor:wait}.result{border-top:1px solid #283b57;margin-top:17px;padding-top:14px;color:#b1cbe7;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}.status{display:inline-flex;gap:8px;align-items:center;background:#162740;border-radius:9px;padding:10px 13px;font-size:13px;color:#a9c4e8;margin-top:22px}footer{margin-top:42px;font-size:13px;color:#8197ba}a{color:#81b4ff}@media(max-width:580px){header{padding:18px 22px}main{padding:35px 22px}.badge{font-size:10px}}
</style></head><body><header><div class="brand">◈ &nbsp;Growth OS</div><div class="badge">Cloudflare · Geliştirme sürümü</div></header><main><div class="eyebrow">Merkezi yönetim platformu</div><h1>Growth Intelligence</h1><section class="grid" id="sites"></section></main><script>
const names={ctseg:'CTSEG',commerce:'QCT Commerce',studio:'QCT Studio',mythborn:'Mythborn',personal:'Kişisel Web Sitesi'};
const escapeHtml=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const grid=document.getElementById('sites');
Object.entries(names).forEach(([id,name])=>{
  const card=document.createElement('article');card.className='card';
  const title=document.createElement('h2');title.textContent=name;
  const open=document.createElement('a');open.href='/site/'+id;
  open.className='action';open.textContent='Proje panelini aç →';
  open.style.cssText='display:inline-block;text-decoration:none;margin-top:18px';
  card.append(title,open);grid.append(card);
});
</script></body></html>`;

const SITE_LABELS={ctseg:'CTSEG',commerce:'QCT Commerce',studio:'QCT Studio',mythborn:'Mythborn',personal:'Kişisel Web Sitesi'};
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function sitePage(id){
  const title=escapeHtml(SITE_LABELS[id]),domain=escapeHtml(new URL(SITES[id]).hostname);
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} | Growth OS</title><style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,sans-serif;background:#090e1b;color:#eaf1ff}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 90% 0,#17284e,#090e1b 56%)}header,main{max-width:1120px;margin:auto;padding:24px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2c3b54}a{color:#91bfff;text-decoration:none}.tag{font-size:12px;padding:7px 11px;border:1px solid #425576;border-radius:22px}main{padding-top:52px}h1{font-size:clamp(32px,5vw,52px);margin:12px 0}h2{font-size:19px;margin:0 0 18px}p{color:#adbfda;line-height:1.65}.eyebrow{font-size:12px;letter-spacing:2px;color:#80b6ff;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:27px}.box{background:#121d32;border:1px solid #2a3a57;padding:23px;border-radius:17px;min-height:145px}button{background:#357efa;color:white;border:0;border-radius:9px;padding:12px 16px;font-weight:700;cursor:pointer}button:disabled{opacity:.6}.value{font-size:27px;font-weight:700}.muted{font-size:13px;color:#99abc7}.row{padding:11px 0;border-bottom:1px solid #2a3a57;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}#message{margin-left:15px;color:#aabed9}.warning{padding:13px;border:1px solid #544c39;background:#2b281e;border-radius:8px;font-size:13px;margin-top:28px}@media(max-width:600px){header{gap:10px}main{padding-top:28px}}
</style></head><body><header><a href="/">← Growth OS / Projeler</a><span class="tag">Proje çalışma alanı</span></header><main><div class="eyebrow">Site Intelligence</div><h1>${title}</h1><p>${domain} · Teknik kontrol, geçmiş ölçümler ve değişiklik takibi</p><button id="run">Yeni kontrol çalıştır</button><span id="message" role="status">Geçmiş veriler yükleniyor…</span><section class="grid"><article class="box"><h2>Son ölçüm</h2><div class="value" id="last">—</div><p class="muted" id="lastdate">Henüz veri yok</p></article><article class="box"><h2>SEO sinyalleri</h2><div id="signals">Bekleniyor…</div></article><article class="box"><h2>Son değişiklikler</h2><div id="diff">Bekleniyor…</div></article></section><section class="box" style="margin-top:18px"><h2>Teknik SEO denetimi</h2><button id="technicalRun">Robots / Sitemap / Index kontrolü</button><p class="muted" id="technicalMessage">Kontrol henüz çalıştırılmadı.</p><div id="technicalResults"></div></section><section class="box" style="margin-top:18px"><h2>Son 10 kontrol</h2><div id="history" class="muted">Yükleniyor…</div></section><div class="warning">Bu ekran yalnızca kamuya açık sayfa sinyallerini analiz eder. Search Console, GA4, sıralama ve tam tarama sonuçları henüz entegre değildir.</div></main><script>
const site=${JSON.stringify(id)};
const pick=id=>document.getElementById(id);
const format=v=>v?'Var':'Yok';
function setText(id,v){pick(id).textContent=String(v)}
async function load(){
try{
const [hr,cr]=await Promise.all([fetch('/api/public-site-history?site='+site,{cache:'no-store'}),fetch('/api/public-site-comparison?site='+site,{cache:'no-store'})]);
if(!hr.ok||!cr.ok)throw Error('API_UNAVAILABLE');
const history=(await hr.json()).history||[];
const comparison=await cr.json();
if(history.length){const h=history[0];setText('last',h.http_status===null?'Hata':'HTTP '+h.http_status);setText('lastdate',h.checked_at);setText('signals','Meta açıklama: '+format(h.has_description)+' · Canonical: '+format(h.has_canonical)+' · JSON-LD: '+format(h.has_structured_data));}
else {setText('last','Kayıt yok');setText('signals','İlk kontrolü çalıştırın.')}
setText('diff',comparison.state==='changed'?comparison.changes.map(c=>c.label+': '+String(c.before??'—')+' → '+String(c.after??'—')).join(' | '):comparison.state==='unchanged'?'Son iki ölçümde değişiklik yok.':comparison.state==='baseline'?'İkinci ölçüm bekleniyor.':'Kayıt yok.');
const el=pick('history');el.replaceChildren();
for(const h of history){const row=document.createElement('div');row.className='row';const t=document.createElement('span');t.textContent=h.checked_at;const v=document.createElement('strong');v.textContent=h.http_status===null?(h.error_code||'Hata'):'HTTP '+h.http_status+' · '+(h.duration_ms??'—')+' ms';row.append(t,v);el.append(row)}
if(!history.length)el.textContent='Kayıt yok.';
setText('message','Sonuçlar yüklendi.');
}catch{setText('message','Kontrol geçmişine erişilemedi.');setText('history','Veri alınamadı.')}
}
pick('technicalRun').addEventListener('click',async()=>{
const btn=pick('technicalRun');btn.disabled=true;setText('technicalMessage','Kontrol sürüyor…');
try{const r=await fetch('/api/technical-audit?site='+site,{cache:'no-store'});if(!r.ok)throw Error('AUDIT_FAILED');const data=await r.json();const container=pick('technicalResults');container.replaceChildren();for(const item of data.signals){const row=document.createElement('div');row.className='row';const name=document.createElement('span');name.textContent=item.label;const status=document.createElement('strong');status.textContent=(item.state==='pass'?'✓ ':item.state==='warning'?'! ':'? ')+item.detail;row.append(name,status);container.append(row)}setText('technicalMessage','Tamamlandı: '+data.checkedAt+' · Sonuçlar yalnızca gözlemlenen teknik sinyallerdir.')}catch{setText('technicalMessage','Teknik denetim gerçekleştirilemedi.')}finally{btn.disabled=false}
});
pick('run').addEventListener('click',async()=>{pick('run').disabled=true;setText('message','Kontrol çalışıyor…');try{const r=await fetch('/api/public-site-check?site='+site,{cache:'no-store'});if(!r.ok)throw Error('CHECK_FAILED');await load()}catch{setText('message','Kontrol başarısız oldu.')}finally{pick('run').disabled=false}});
load();
</script></body></html>`;
}

export default {
  async fetch(request,env){
    const u=new URL(request.url),path=u.pathname;
    if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'METHOD_NOT_ALLOWED'},405);
    if(path.startsWith('/site/')){
      const id=path.split('/')[2];
      if(!Object.hasOwn(SITES,id)||path!==('/site/'+id))return json({error:'UNKNOWN_SITE'},404);
      return new Response(request.method==='HEAD'?null:sitePage(id),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex,nofollow','x-content-type-options':'nosniff','x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});
    }
    if(path==='/'||path==='/index.html')return new Response(request.method==='HEAD'?null:DASHBOARD,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",'x-robots-tag':'noindex, nofollow'}});
    if(path==='/health'){
      let database='unavailable';
      try{const r=await env.PREVIEW_DB.prepare("SELECT value FROM migration_meta WHERE key = 'state'").first();if(r?.value==='preview-infrastructure-only')database='ready'}catch{}
      return json({service:'growth-os-cloudflare-preview',phase:'public-diagnostics',applicationReady:false,database},database==='ready'?200:503);
    }
    if(path==='/api/technical-audit'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      return json(await technicalAudit(site));
    }
    if(path==='/api/public-site-check'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE',validSites:Object.keys(SITES)},400);
      const result=await checkSite(site);
      try {
        await env.PREVIEW_DB.prepare("INSERT INTO public_site_checks(site,checked_at,http_status,ok,title,has_description,has_canonical,has_structured_data,duration_ms,error_code) VALUES (?,?,?,?,?,?,?,?,?,?)")
          .bind(site,result.checkedAt||new Date().toISOString(),result.httpStatus??null,result.ok?1:0,result.title??null,result.hasDescription?1:0,result.hasCanonical?1:0,result.hasStructuredData?1:0,result.durationMs??null,result.status==='request-failed'?result.reason:null).run();
        result.saved=true;
      } catch {result.saved=false;}
      return json(result);
    }
    if(path==='/api/public-site-history'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      try{
        const rows=await env.PREVIEW_DB.prepare('SELECT checked_at,http_status,ok,title,has_description,has_canonical,has_structured_data,duration_ms,error_code FROM public_site_checks WHERE site=? ORDER BY id DESC LIMIT 10').bind(site).all();
        return json({site,history:rows.results||[]});
      }catch{return json({error:'HISTORY_UNAVAILABLE'},503)}
    }
    if(path==='/api/public-site-comparison'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      try{
        const response=await env.PREVIEW_DB.prepare('SELECT checked_at,http_status,ok,title,has_description,has_canonical,has_structured_data,duration_ms,error_code FROM public_site_checks WHERE site=? ORDER BY id DESC LIMIT 2').bind(site).all();
        const [current,previous]=response.results||[];
        if(!current)return json({site,state:'no-data',current:null,previous:null,changes:[]});
        if(!previous)return json({site,state:'baseline',current,previous:null,changes:[]});
        const labels={http_status:'HTTP',ok:'Erişilebilirlik',title:'Sayfa başlığı',has_description:'Meta açıklama',has_canonical:'Canonical',has_structured_data:'JSON-LD',error_code:'Hata'};
        const changes=Object.entries(labels).filter(([key])=>current[key]!==previous[key]).map(([key,label])=>({field:key,label,before:previous[key],after:current[key]}));
        return json({site,state:changes.length?'changed':'unchanged',current,previous,changes});
      }catch{return json({error:'COMPARISON_UNAVAILABLE'},503)}
    }
    if(path==='/api/public-sites')return json({sites:Object.entries(SITES).map(([id,url])=>({id,host:new URL(url).hostname})),disclaimer:'Public website diagnostics only; not authenticated Growth OS'});
    return json({error:'PREVIEW_NOT_CONFIGURED'},403);
  }
};
