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

// Bounded homepage hreflang inspection; no external destinations are fetched.
function htmlLinks(html){
 const links=html.match(/<link\b[^>]*>/gi)||[];
 const attr=(tag,name)=>{const m=tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\\x27])([^"\\x27]*?)\\1','i'));return m?.[2]||''};
 return {attr,links};
}
async function localeAudit(site){
 const target=SITES[site];if(!target)return null;
 try{
  const response=await fetch(target,{signal:AbortSignal.timeout(6500),redirect:'follow'});
  if(!response.ok)return {site,status:'http-error',httpStatus:response.status,alternates:[],warnings:['Ana sayfa HTTP hatası'],reciprocal:[]};
  const html=(await response.text()).slice(0,220000);
  const {attr,links}=htmlLinks(html);
  const alternates=[];
  for(const tag of links){
   if(!attr(tag,'rel').toLowerCase().split(/\s+/).includes('alternate'))continue;
   const lang=attr(tag,'hreflang'),href=attr(tag,'href');if(!lang||!href)continue;
   try{const u=new URL(href,response.url);if(!['https:','http:'].includes(u.protocol))continue;alternates.push({lang:lang.slice(0,32),url:u.href.slice(0,350),sameHost:u.hostname===new URL(response.url).hostname})}catch{}
   if(alternates.length>=80)break;
  }
  const seen=new Set(),duplicates=[];
  for(const a of alternates){if(seen.has(a.lang.toLowerCase()))duplicates.push(a.lang);seen.add(a.lang.toLowerCase())}
  const canonicalTag=links.find(t=>attr(t,'rel').toLowerCase().split(/\s+/).includes('canonical'));
  const canonical=canonicalTag?attr(canonicalTag,'href'):null;
  const origin=new URL(response.url);
  const sameOrigin=alternates.filter(a=>{try{return new URL(a.url).origin===origin.origin}catch{return false}}).slice(0,5);
  const reciprocal=await Promise.all(sameOrigin.map(async a=>{
   try{
    const r=await fetch(a.url,{signal:AbortSignal.timeout(4500),redirect:'manual'});
    if(!r.ok)return {lang:a.lang,url:a.url,state:'unknown',detail:'HTTP '+r.status};
    const h=(await r.text()).slice(0,150000),parsed=htmlLinks(h);
    const entries=parsed.links.filter(t=>parsed.attr(t,'rel').toLowerCase().split(/\s+/).includes('alternate')).map(t=>parsed.attr(t,'href'));
    const back=entries.some(x=>{try{return new URL(x,a.url).href===response.url}catch{return false}});
    return {lang:a.lang,url:a.url,state:back?'pass':'warning',detail:back?'Geri bağlantı bulundu':'Başlangıç adresine geri bağlantı tespit edilmedi'};
   }catch{return {lang:a.lang,url:a.url,state:'unknown',detail:'Kontrol edilemedi'}}
  }));
  const warnings=[];
  if(duplicates.length)warnings.push('Tekrarlanan hreflang: '+duplicates.join(', '));
  if(!alternates.length)warnings.push('Hreflang bulunamadı (tek dilde normal olabilir)');
  return {site,checkedAt:new Date().toISOString(),httpStatus:response.status,canonical,alternates,reciprocal,warnings,scope:'En fazla 5 aynı origin dil URL adresinde geri bağlantı aranır. Diğer alan adları, sitemap ve tam dil eşitliği doğrulanmaz.'};
 }catch{return {site,status:'unreachable',alternates:[],reciprocal:[],warnings:['Ana sayfa okunamadı']}}
}

async function schemaAudit(site){
 const target=SITES[site];if(!target)return null;
 try{
  const r=await fetch(target,{signal:AbortSignal.timeout(6500),redirect:'follow'});
  if(!r.ok)return {site,status:'http-error',httpStatus:r.status,items:[],issues:[{severity:'high',message:'Ana sayfa HTTP '+r.status}]};
  const html=(await r.text()).slice(0,260000);
  const scripts=Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)).filter(m=>/type\s*=\s*(['"])application\/ld\+json\1/i.test(m[1])).slice(0,25);
  const items=[],issues=[];
  function collect(obj){
   if(!obj||typeof obj!=='object')return;
   if(Array.isArray(obj)){for(const x of obj.slice(0,50))collect(x);return}
   if(obj['@graph'])collect(obj['@graph']);
   if(obj['@type']){
    const types=Array.isArray(obj['@type'])?obj['@type']: [obj['@type']];
    items.push({types:types.map(x=>String(x).slice(0,80)).slice(0,8),hasId:!!obj['@id'],hasName:!!obj.name,hasUrl:!!obj.url});
   }
  }
  for(const m of scripts){try{collect(JSON.parse(m[2]))}catch{issues.push({severity:'high',message:'Geçersiz JSON-LD JSON sözdizimi'})}}
  if(!scripts.length)issues.push({severity:'info',message:'Ana sayfada JSON-LD script bulunamadı'});
  if(scripts.length&&!items.length)issues.push({severity:'medium',message:'JSON-LD var fakat @type tespit edilemedi'});
  return {site,checkedAt:new Date().toISOString(),httpStatus:r.status,scriptCount:scripts.length,items:items.slice(0,80),issues,scope:'Yalnızca ana sayfanın ilk 260 KB HTML içeriğinde JSON-LD sözdizimi ve türleri kontrol edilir. Schema.org uygunluğu veya rich result geçerliliği doğrulanmaz.'};
 }catch{return {site,status:'unreachable',items:[],issues:[{severity:'unknown',message:'Ana sayfaya erişilemedi'}]}}
}

async function auditCenter(site,env){
 const [technical,locale,schema]=await Promise.all([technicalAudit(site),localeAudit(site),schemaAudit(site)]);
 const findings=[];
 for(const item of technical?.signals||[]){
  if(item.state==='warning')findings.push({severity:item.id==='index'||item.id==='homepage'?'high':'medium',source:'technical',title:item.label,detail:item.detail});
  else if(item.state==='unknown')findings.push({severity:'unknown',source:'technical',title:item.label,detail:item.detail});
 }
 for(const warning of locale?.warnings||[])findings.push({severity:'info',source:'locale',title:'Hreflang',detail:warning});
 for(const item of locale?.reciprocal||[])if(item.state!=='pass')findings.push({severity:item.state==='unknown'?'unknown':'medium',source:'locale',title:'Karşılıklı hreflang: '+item.lang,detail:item.detail});
 for(const issue of schema?.issues||[])findings.push({severity:issue.severity,source:'schema',title:'JSON-LD',detail:issue.message});
 const weight={high:0,medium:1,low:2,info:3,unknown:4};
 findings.sort((a,b)=>(weight[a.severity]??5)-(weight[b.severity]??5));
 const high=findings.filter(x=>x.severity==='high').length,medium=findings.filter(x=>x.severity==='medium').length,unknown=findings.filter(x=>x.severity==='unknown').length;
 const score=Math.max(0,100-high*20-medium*8);
 const report={site,createdAt:new Date().toISOString(),score,scoreType:'heuristic_preview',counts:{high,medium,unknown},findings,technical,locale,schema,disclaimer:'Bu puan yalnızca kontrol edilen teknik sinyallere göre hesaplanan önizleme göstergesidir; SEO/GEO/AEO/AIO performans veya Google sıralama puanı değildir.'};
 try{
  const saved=await env.PREVIEW_DB.prepare('INSERT INTO audit_center_runs (site,created_at,score,high_count,medium_count,unknown_count,report_json) VALUES (?,?,?,?,?,?,?)').bind(site,report.createdAt,score,high,medium,unknown,JSON.stringify(report)).run();
  report.saved=!!saved.success;
 }catch{report.saved=false}
 return report;
}

// Public reference data only, no credentials or commercially sensitive records.
async function tradeReference(){
  const sources={fx:'Frankfurter (ECB reference rates)',countries:'World Bank Indicators API'};
  const jobs=[
    fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,TRY',{signal:AbortSignal.timeout(6500)}).then(async r=>{if(!r.ok)throw Error('FX_UPSTREAM');const d=await r.json();if(!d.date||!Number.isFinite(d.rates?.USD)||!Number.isFinite(d.rates?.TRY))throw Error('FX_DATA_INVALID');return {date:d.date,base:'EUR',USD:d.rates.USD,TRY:d.rates.TRY}}),
    fetch('https://api.worldbank.org/v2/country/TR;DOM;IRN/indicator/NY.GDP.MKTP.CD?format=json&per_page=12',{signal:AbortSignal.timeout(6500)}).then(async r=>{if(!r.ok)throw Error('WB_UPSTREAM');const d=await r.json();if(!Array.isArray(d)||!Array.isArray(d[1]))throw Error('WB_DATA_INVALID');const latest=new Map();for(const v of d[1]){const id=v.countryiso3code||v.country?.id;if(v.value!==null&&!latest.has(id))latest.set(id,{country:v.country?.value,year:v.date,usd:v.value})}return Array.from(latest.entries()).map(([code,data])=>({code,...data}))})
  ];
  const settled=await Promise.allSettled(jobs);
  return {asOf:new Date().toISOString(),sources,fx:settled[0].status==='fulfilled'?settled[0].value:null,gdp:settled[1].status==='fulfilled'?settled[1].value:[],unavailable:{fx:settled[0].status==='rejected',gdp:settled[1].status==='rejected'},notes:'Dövizler işlem/anlık teklif kuru değildir; GSYİH son yayımlanan yıllık gözlemdir. Ticari kararlar için bağımsız doğrulama gerekir.'};
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
</style></head><body><header><a href="/">← Growth OS / Projeler</a><span class="tag">Proje çalışma alanı</span></header><main><div class="eyebrow">Executive Workspace</div><h1>${title}</h1><p>${domain} · Büyüme, operasyon ve proje görünümü</p><section class="grid" id="executiveGrid"><article class="box"><h2>Site kontrolleri</h2><div class="value" id="kpiChecks">—</div><p class="muted" id="kpiCheckDate">D1 kayıtları</p></article><article class="box"><h2>Audit raporları</h2><div class="value" id="kpiAudits">—</div><p class="muted">Kaydedilmiş kapsamlı analiz</p></article><article class="box"><h2>Analitik bağlantıları</h2><div class="value" style="font-size:19px">Bağlı değil</div><p class="muted">GA4 · Search Console</p></article><article class="box"><h2>Ticari operasyon</h2><div class="value" style="font-size:19px">Bağlı değil</div><p class="muted">CRM · Teklif · Gelir</p></article></section><section class="box" style="margin-top:18px"><h2>Growth Operations</h2><p>Mevcut D1 analiz kayıtları aktiftir. Ziyaretçi, satış ve ticari fırsat verileri için ilgili hesapların güvenli bağlantısı gereklidir. Bu alanlar gerçek veri olmadan doldurulmaz.</p></section><section class="box" id="tradeSection" style="margin-top:18px" hidden><h2>Trade Intelligence</h2><p class="muted">Dış ticaret araştırmaları için döviz referansları ve ülke ekonomik göstergeleri.</p><button id="tradeLoad">Verileri güncelle</button><p class="muted" id="tradeStatus">Henüz veri alınmadı.</p><div id="tradeData"></div></section><details style="margin-top:26px"><summary style="cursor:pointer;padding:18px;background:#1a2a43;border-radius:12px;font-weight:700">Teknik SEO ve Audit Center araçlarını aç</summary><div style="padding-top:20px"><button id="run">Yeni kontrol çalıştır</button><span id="message" role="status">Geçmiş veriler yükleniyor…</span><section class="grid"><article class="box"><h2>Son ölçüm</h2><div class="value" id="last">—</div><p class="muted" id="lastdate">Henüz veri yok</p></article><article class="box"><h2>SEO sinyalleri</h2><div id="signals">Bekleniyor…</div></article><article class="box"><h2>Son değişiklikler</h2><div id="diff">Bekleniyor…</div></article></section><section class="box" style="margin-top:18px"><h2>Audit Center</h2><p class="muted">Üç analizi birlikte çalıştır ve öncelikli bulguları kaydet.</p><button id="auditRun">Tüm kontrolleri çalıştır</button><p class="muted" id="auditMessage">Henüz kapsamlı analiz yapılmadı.</p><div id="auditResults"></div></section><section class="box" style="margin-top:18px"><h2>Teknik SEO denetimi</h2><button id="technicalRun">Robots / Sitemap / Index kontrolü</button><p class="muted" id="technicalMessage">Kontrol henüz çalıştırılmadı.</p><div id="technicalResults"></div></section><section class="box" style="margin-top:18px"><h2>Çok dilli SEO / hreflang</h2><button id="localeRun">Dil bağlantılarını incele</button><p class="muted" id="localeMessage">Henüz kontrol yapılmadı.</p><div id="localeResults"></div></section><section class="box" style="margin-top:18px"><h2>Yapılandırılmış veri / JSON-LD</h2><button id="schemaRun">Schema türlerini denetle</button><p class="muted" id="schemaMessage">Henüz kontrol yapılmadı.</p><div id="schemaResults"></div></section><section class="box" style="margin-top:18px"><h2>Son 10 kontrol</h2><div id="history" class="muted">Yükleniyor…</div></section><div class="warning">Bu bölüm yalnızca kamuya açık sayfa sinyallerini analiz eder. Search Console, GA4, sıralama ve tam tarama sonuçları henüz entegre değildir.</div></div></details></main><script>
const site=${JSON.stringify(id)};
if(site==='ctseg'||site==='commerce'){
 const box=pick('tradeSection');box.hidden=false;
 pick('tradeLoad').addEventListener('click',async()=>{
  const btn=pick('tradeLoad');btn.disabled=true;setText('tradeStatus','Kaynaklar sorgulanıyor…');
  try{
   const response=await fetch('/api/trade-reference?site='+site,{cache:'no-store'});if(!response.ok)throw Error('UPSTREAM');
   const data=await response.json(),container=pick('tradeData');container.replaceChildren();
   const fx=document.createElement('div');fx.className='row';fx.textContent=data.fx?'ECB referans · '+data.fx.date+' · 1 EUR = '+data.fx.USD+' USD / '+data.fx.TRY+' TRY':'Döviz kaynağına erişilemedi';container.append(fx);
   for(const item of data.gdp||[]){const row=document.createElement('div');row.className='row';const country=document.createElement('strong');country.textContent=item.country+' ('+item.year+')';const number=document.createElement('span');number.textContent=item.usd===null?'Veri yok':new Intl.NumberFormat('tr-TR',{notation:'compact',maximumFractionDigits:2}).format(item.usd)+' USD (GSYİH)';row.append(country,number);container.append(row)}
   setText('tradeStatus','Kaynaklar: Frankfurter / World Bank · Güncelleme: '+data.asOf+' · Veriler yalnızca referanstır.');
  }catch{setText('tradeStatus','Veri alınamadı; değer gösterilmiyor.')}finally{btn.disabled=false}
 });
}
const pick=id=>document.getElementById(id);
const format=v=>v?'Var':'Yok';
(async()=>{try{const r=await fetch('/api/executive-overview?site='+site,{cache:'no-store'});if(!r.ok)throw Error('OVERVIEW_FAILED');const d=await r.json();setText('kpiChecks',d.measurements.checks);setText('kpiAudits',d.measurements.audits);setText('kpiCheckDate',d.measurements.latestCheck?'Son kontrol: '+d.measurements.latestCheck:'Henüz kontrol yapılmadı')}catch{setText('kpiChecks','Veri yok');setText('kpiAudits','Veri yok');setText('kpiCheckDate','Kayıtlar okunamadı')}})();
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
pick('auditRun').addEventListener('click',async()=>{
 const btn=pick('auditRun');btn.disabled=true;setText('auditMessage','Audit Center analizleri çalışıyor…');
 try{const res=await fetch('/api/audit-center-run?site='+site,{cache:'no-store'});if(!res.ok)throw Error('AUDIT_FAILED');const report=await res.json();const box=pick('auditResults');box.replaceChildren();
 const summary=document.createElement('p');summary.textContent='Önizleme skoru: '+report.score+'/100 · Yüksek: '+report.counts.high+' · Orta: '+report.counts.medium+' · Belirsiz: '+report.counts.unknown+' · Kaydedildi: '+(report.saved?'Evet':'Hayır');box.append(summary);
 for(const item of report.findings){const row=document.createElement('div');row.className='row';const t=document.createElement('strong');t.textContent=item.severity.toUpperCase()+' · '+item.title;const d=document.createElement('span');d.textContent=item.detail;row.append(t,d);box.append(row)}
 setText('auditMessage','Tamamlandı: '+report.createdAt+' · Puan arama performansı ölçümü değildir.');
 }catch{setText('auditMessage','Audit Center çalıştırılamadı.')}finally{btn.disabled=false}
});
pick('schemaRun').addEventListener('click',async()=>{
 const btn=pick('schemaRun');btn.disabled=true;setText('schemaMessage','JSON-LD inceleniyor…');
 try{const r=await fetch('/api/schema-audit?site='+site,{cache:'no-store'});if(!r.ok)throw Error('AUDIT_FAILED');const data=await r.json();const box=pick('schemaResults');box.replaceChildren();
 for(const item of data.items||[]){const row=document.createElement('div');row.className='row';const name=document.createElement('strong');name.textContent=item.types.join(', ');const more=document.createElement('span');more.textContent='@id: '+(item.hasId?'Var':'Yok')+' · name: '+(item.hasName?'Var':'Yok');row.append(name,more);box.append(row)}
 for(const issue of data.issues||[]){const row=document.createElement('p');row.className='muted';row.textContent=issue.severity.toUpperCase()+': '+issue.message;box.append(row)}
 setText('schemaMessage','Script: '+(data.scriptCount??'—')+' · Tür: '+(data.items?.length??0)+' · Kapsam: Ana sayfa');
 }catch{setText('schemaMessage','JSON-LD incelemesi başarısız.')}finally{btn.disabled=false}
});
pick('localeRun').addEventListener('click',async()=>{
 const btn=pick('localeRun');btn.disabled=true;setText('localeMessage','Hreflang kontrolü sürüyor…');
 try{
  const r=await fetch('/api/locale-audit?site='+site,{cache:'no-store'});if(!r.ok)throw Error('AUDIT_FAILED');
  const data=await r.json();const box=pick('localeResults');box.replaceChildren();
  const details=document.createElement('p');details.className='muted';details.textContent='Canonical: '+(data.canonical||'Bulunamadı')+' · Dil bağlantısı: '+data.alternates.length;box.append(details);
  for(const a of data.alternates){const row=document.createElement('div');row.className='row';const lang=document.createElement('strong');lang.textContent=a.lang;const url=document.createElement('span');url.textContent=a.url;row.append(lang,url);box.append(row)}
  for(const item of data.reciprocal||[]){const row=document.createElement('div');row.className='row';const label=document.createElement('strong');label.textContent='Geri bağlantı · '+item.lang;const detail=document.createElement('span');detail.textContent=item.state+' · '+item.detail;row.append(label,detail);box.append(row)}
  setText('localeMessage',(data.warnings||[]).join(' | ')||'Kontrol tamamlandı; yalnızca aynı origin adresleri için sınırlı doğrulama yapıldı.');
 }catch{setText('localeMessage','Dil analizi gerçekleştirilemedi.')}finally{btn.disabled=false}
});
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
    if(path==='/api/trade-reference'){
      const site=u.searchParams.get('site')||'';
      if(site!=='ctseg'&&site!=='commerce')return json({error:'NOT_APPLICABLE'},404);
      const result=await tradeReference();
      return new Response(JSON.stringify(result),{headers:{...JSON_HEADERS,'cache-control':'public, max-age=300'}});
    }
    if(path==='/api/executive-overview'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      try{
        const [checks,audits]=await Promise.all([
          env.PREVIEW_DB.prepare('SELECT COUNT(*) AS count, MAX(checked_at) AS latest FROM public_site_checks WHERE site=?').bind(site).first(),
          env.PREVIEW_DB.prepare('SELECT COUNT(*) AS count, MAX(created_at) AS latest FROM audit_center_runs WHERE site=?').bind(site).first()
        ]);
        return json({site,measurements:{checks:checks?.count??0,latestCheck:checks?.latest??null,audits:audits?.count??0,latestAudit:audits?.latest??null},integrations:{ga4:'not_connected',searchConsole:'not_connected',crm:'not_connected',revenue:'not_connected'},scope:'Counts are real D1 records. They are not site visitors or sales.'});
      }catch{return json({error:'OVERVIEW_UNAVAILABLE'},503)}
    }
    if(path==='/api/audit-center-run'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      return json(await auditCenter(site,env));
    }
    if(path==='/api/audit-center-history'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      try{const q=await env.PREVIEW_DB.prepare('SELECT id,created_at,score,high_count,medium_count,unknown_count,report_json FROM audit_center_runs WHERE site=? ORDER BY id DESC LIMIT 5').bind(site).all();return json({site,reports:(q.results||[]).map(({report_json,...row})=>({...row,findings:JSON.parse(report_json).findings}))})}catch{return json({error:'AUDIT_HISTORY_UNAVAILABLE'},503)}
    }
    if(path==='/api/schema-audit'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      return json(await schemaAudit(site));
    }
    if(path==='/api/locale-audit'){
      const site=u.searchParams.get('site')||'';
      if(!Object.hasOwn(SITES,site))return json({error:'UNKNOWN_SITE'},400);
      return json(await localeAudit(site));
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
