import { pool } from './db.js';
import { googleAccessForProject, searchConsoleRows } from './google.js';

type SearchConsoleRow={keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number};
type SearchConsoleResponse={rows?:SearchConsoleRow[]};
type SearchConsoleSite={siteUrl?:string;permissionLevel?:string};
type SearchConsoleSites={siteEntry?:SearchConsoleSite[]};

const SEARCH_CONSOLE_HTTP_TIMEOUT_MS=20_000;
const SEARCH_CONSOLE_HTTP_MAX_BYTES=4*1024*1024;

async function readLimitedText(response:Response,maxBytes=SEARCH_CONSOLE_HTTP_MAX_BYTES){
  const contentLength=Number(response.headers.get('content-length')||'0');
  if(Number.isFinite(contentLength)&&contentLength>maxBytes)throw new Error('Search Console API yanıtı boyut limitini aştı.');
  if(!response.body)return '';
  const reader=response.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>maxBytes){
        await reader.cancel();
        throw new Error('Search Console API yanıtı boyut limitini aştı.');
      }
      chunks.push(value);
    }
  }finally{
    reader.releaseLock();
  }
  const bytes=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder().decode(bytes);
}

async function fetchText(url:string,init:RequestInit={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(new Error('Search Console API isteği zaman aşımına uğradı.')),SEARCH_CONSOLE_HTTP_TIMEOUT_MS);
  try{
    const response=await fetch(url,{...init,signal:controller.signal});
    const text=await readLimitedText(response);
    return {response,text};
  }finally{
    clearTimeout(timeout);
  }
}

async function getJson(url:string,accessToken:string):Promise<unknown>{
  const {response,text}=await fetchText(url,{headers:{authorization:`Bearer ${accessToken}`}});
  let data:unknown={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!response.ok)throw new Error(`Search Console API ${response.status}: ${typeof data==='object'?JSON.stringify(data):text}`);
  return data;
}

async function postJson<T>(url:string,accessToken:string,body:unknown):Promise<T>{
  const {response,text}=await fetchText(url,{method:'POST',headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json'},body:JSON.stringify(body)});
  let data:unknown={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!response.ok)throw new Error(`Search Console API ${response.status}: ${typeof data==='object'?JSON.stringify(data):text}`);
  return data as T;
}

function isoDate(date:Date){return date.toISOString().slice(0,10)}
function normalizeDomain(value:string){return value.replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].toLowerCase()}
function searchConsoleSiteDomain(siteUrl:string){
  const value=siteUrl.trim().toLowerCase();
  if(value.startsWith('sc-domain:'))return normalizeDomain(value.slice('sc-domain:'.length));
  try{return normalizeDomain(new URL(value).hostname)}catch{return ''}
}

async function listSites(accessToken:string){
  const sites=await getJson('https://www.googleapis.com/webmasters/v3/sites',accessToken) as SearchConsoleSites;
  return sites.siteEntry||[];
}

export async function selectSearchConsoleSiteForProject(projectId:string,siteUrl:string){
  const accessToken=await googleAccessForProject(projectId);
  const sites=await listSites(accessToken);
  const selected=sites.find(site=>site.siteUrl===siteUrl);
  if(!selected?.siteUrl)throw new Error('Bu Search Console property için erişim bulunamadı.');

  const client=await pool.connect();
  try{
    await client.query('begin');
    const projectResult=await client.query('select status from projects where id=$1 for update',[projectId]);
    if(projectResult.rows[0]?.status!=='active')throw new Error('Proje aktif değil veya bulunamadı.');
    const {rows}=await client.query(`
      update integrations
      set metadata=coalesce(metadata,'{}'::jsonb)||$2::jsonb
      where project_id=$1 and provider='google_oauth' and status='connected'
      returning id,provider,account_label,status,mode,last_sync_at,metadata`,[projectId,JSON.stringify({selectedSearchConsoleSiteUrl:selected.siteUrl})]);
    if(!rows[0])throw new Error('Google bağlantısı bulunamadı.');
    await client.query('commit');
  }catch(error){
    await client.query('rollback');
    throw error;
  }finally{
    client.release();
  }
  return {selectedSearchConsoleSiteUrl:selected.siteUrl,permissionLevel:selected.permissionLevel||null};
}

export async function searchConsolePerformanceForWorkspaceProject(projectId:string,days=28){
  const [projectResult,integrationResult,accessToken]=await Promise.all([
    pool.query('select domain from projects where id=$1',[projectId]),
    pool.query("select metadata from integrations where project_id=$1 and provider='google_oauth' and status='connected' order by created_at desc limit 1",[projectId]),
    googleAccessForProject(projectId)
  ]);
  const domain=normalizeDomain(String(projectResult.rows[0]?.domain||''));
  if(!domain)throw new Error('Proje bulunamadı.');
  const metadata=integrationResult.rows[0]?.metadata as {selectedSearchConsoleSiteUrl?:string}|undefined;
  const sites=await listSites(accessToken);
  const selected=metadata?.selectedSearchConsoleSiteUrl?sites.find(site=>site.siteUrl===metadata.selectedSearchConsoleSiteUrl):undefined;
  if(metadata?.selectedSearchConsoleSiteUrl&&!selected?.siteUrl){
    return {matched:false,days:Math.max(1,Math.min(days,90)),sites,selectedSearchConsoleSiteUrl:metadata.selectedSearchConsoleSiteUrl,message:'Seçili Search Console property için artık erişim bulunamadı. Yeni property açıkça seçilmeli.'};
  }
  const exactDomain=`sc-domain:${domain}`;
  const site=selected||sites.find(item=>item.siteUrl===exactDomain)||sites.find(item=>item.siteUrl&&searchConsoleSiteDomain(item.siteUrl)===domain);
  if(!site?.siteUrl){
    return {matched:false,days:Math.max(1,Math.min(days,90)),sites,selectedSearchConsoleSiteUrl:metadata?.selectedSearchConsoleSiteUrl||null,message:`Search Console içinde ${domain} için property otomatik eşleşmedi.`};
  }

  const normalizedDays=Math.max(1,Math.min(days,90));
  const end=new Date();
  const start=new Date();
  start.setUTCDate(start.getUTCDate()-(normalizedDays-1));
  const base={startDate:isoDate(start),endDate:isoDate(end),dataState:'final'};
  const endpoint=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`;
  const [totals,queries,pages]=await Promise.all([
    postJson<SearchConsoleResponse>(endpoint,accessToken,{...base,rowLimit:1}),
    searchConsoleRows(endpoint,accessToken,base,'query'),
    searchConsoleRows(endpoint,accessToken,base,'page')
  ]);
  const totalRow=totals.rows?.[0];
  const queryRows=queries.rows||[];
  const pageRows=pages.rows||[];
  const clicks=Number(totalRow?.clicks||0);
  const impressions=Number(totalRow?.impressions||0);
  return {
    matched:true,
    siteUrl:site.siteUrl,
    permissionLevel:site.permissionLevel||null,
    selectedSearchConsoleSiteUrl:metadata?.selectedSearchConsoleSiteUrl||null,
    days:normalizedDays,
    summary:{clicks,impressions,ctr:Number(totalRow?.ctr||0),position:totalRow?.position==null?null:Number(totalRow.position)},
    partial:queries.partial||pages.partial,partialQueries:queries.partial,partialPages:pages.partial,detailCoverage:'top_rows',
    queries:queryRows.slice(0,100),
    pages:pageRows.slice(0,100),
    sites
  };
}
