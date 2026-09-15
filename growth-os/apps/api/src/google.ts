import crypto from 'node:crypto';
import { pool } from './db.js';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/content'
];

type SearchConsoleRow={keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number};
type SearchConsoleResponse={rows?:SearchConsoleRow[]};
type SearchConsoleSites={siteEntry?:Array<{siteUrl?:string;permissionLevel?:string}>};
type MerchantAccount={name?:string;accountName?:string;timeZone?:{id?:string}|string;languageCode?:string};
type MerchantAccountsResponse={accounts?:MerchantAccount[]};
type MerchantHomepage={uri?:string;claimed?:boolean};
type MerchantProductStatus={
  destinationStatuses?:Array<{reportingContext?:string;approvedCountries?:string[];pendingCountries?:string[];disapprovedCountries?:string[]}>;
  itemLevelIssues?:Array<{code?:string;severity?:string;attribute?:string;description?:string;detail?:string;documentation?:string;reportingContext?:string}>;
};
type MerchantProduct={name?:string;offerId?:string;contentLanguage?:string;feedLabel?:string;attributes?:{title?:string;availability?:string;link?:string};productStatus?:MerchantProductStatus};
type MerchantProductsResponse={products?:MerchantProduct[];nextPageToken?:string};
type MerchantAccountIssue={name?:string;title?:string;severity?:string;detail?:string;documentationUri?:string;impactedDestinations?:unknown[]};
type MerchantIssuesResponse={accountIssues?:MerchantAccountIssue[];nextPageToken?:string};

function required(name:string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} yapılandırılmamış.`);
  return value;
}

function key() {
  return crypto.createHash('sha256').update(required('INTEGRATION_ENCRYPTION_KEY')).digest();
}

export function encryptSecret(value:string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(value:string) {
  const [ivText, tagText, dataText] = value.split('.');
  if (!ivText || !tagText || !dataText) throw new Error('Şifreli credential formatı geçersiz.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
}

export function buildGoogleAuthUrl(state:string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', required('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', required('GOOGLE_REDIRECT_URI'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeGoogleCode(code:string) {
  const body = new URLSearchParams({
    code,
    client_id: required('GOOGLE_CLIENT_ID'),
    client_secret: required('GOOGLE_CLIENT_SECRET'),
    redirect_uri: required('GOOGLE_REDIRECT_URI'),
    grant_type: 'authorization_code'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  const data = await response.json() as {access_token?:string;refresh_token?:string;expires_in?:number;scope?:string;token_type?:string;id_token?:string;error?:string;error_description?:string};
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || 'Google token alınamadı.');
  return data;
}

export async function refreshGoogleAccessToken(refreshToken:string) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: required('GOOGLE_CLIENT_ID'),
    client_secret: required('GOOGLE_CLIENT_SECRET'),
    grant_type: 'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  const data = await response.json() as {access_token?:string;expires_in?:number;error?:string;error_description?:string};
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || 'Google token yenilenemedi.');
  return data.access_token;
}

export async function googleAccessForProject(projectId:string) {
  const { rows } = await pool.query("select metadata from integrations where project_id=$1 and provider='google_oauth' and status='connected' order by created_at desc limit 1", [projectId]);
  const metadata = rows[0]?.metadata as {refreshTokenEncrypted?:string}|undefined;
  if (!metadata?.refreshTokenEncrypted) throw new Error('Google bağlantısı bulunamadı.');
  return refreshGoogleAccessToken(decryptSecret(metadata.refreshTokenEncrypted));
}

async function getJson(url:string, accessToken:string, extraHeaders:Record<string,string>={}):Promise<unknown> {
  const response = await fetch(url, {headers:{authorization:`Bearer ${accessToken}`,...extraHeaders}});
  const text = await response.text();
  let data:unknown = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {raw:text}; }
  if (!response.ok) throw new Error(`Google API ${response.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`);
  return data;
}

async function postJson<T>(url:string, accessToken:string, body:unknown):Promise<T> {
  const response=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json'},body:JSON.stringify(body)});
  const text=await response.text();
  let data:unknown={};
  try { data=text?JSON.parse(text):{}; } catch { data={raw:text}; }
  if(!response.ok)throw new Error(`Google API ${response.status}: ${typeof data==='object'?JSON.stringify(data):text}`);
  return data as T;
}

function isoDate(date:Date){return date.toISOString().slice(0,10)}
function normalizeDomain(value:string){return value.replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].toLowerCase()}
function searchConsoleSiteDomain(siteUrl:string){
  const value=siteUrl.trim().toLowerCase();
  if(value.startsWith('sc-domain:'))return normalizeDomain(value.slice('sc-domain:'.length));
  try{return normalizeDomain(new URL(value).hostname)}catch{return ''}
}

export async function searchConsolePerformanceForProject(projectId:string,days=28){
  const project=await pool.query('select domain from projects where id=$1',[projectId]);
  const domain=String(project.rows[0]?.domain||'').replace(/^www\./,'').toLowerCase();
  if(!domain)throw new Error('Proje bulunamadı.');
  const accessToken=await googleAccessForProject(projectId);
  const sites=(await getJson('https://www.googleapis.com/webmasters/v3/sites',accessToken)) as SearchConsoleSites;
  const entries=sites.siteEntry||[];
  const exactDomain=`sc-domain:${domain}`;
  const site=entries.find(s=>s.siteUrl===exactDomain)||entries.find(s=>s.siteUrl&&searchConsoleSiteDomain(s.siteUrl)===domain);
  if(!site?.siteUrl)throw new Error(`Search Console içinde ${domain} için erişilebilir property bulunamadı.`);
  const normalizedDays=Math.max(1,Math.min(days,90));
  const end=new Date();
  const start=new Date();
  start.setUTCDate(start.getUTCDate()-(normalizedDays-1));
  const base={startDate:isoDate(start),endDate:isoDate(end),rowLimit:1000,dataState:'final'};
  const endpoint=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`;
  const queries=await postJson<SearchConsoleResponse>(endpoint,accessToken,{...base,dimensions:['query']});
  const pages=await postJson<SearchConsoleResponse>(endpoint,accessToken,{...base,dimensions:['page']});
  const queryRows:SearchConsoleRow[]=queries.rows||[];
  const pageRows:SearchConsoleRow[]=pages.rows||[];
  let clicks=0;
  let impressions=0;
  let positionWeighted=0;
  for(const row of queryRows){
    const rowClicks=Number(row.clicks||0);
    const rowImpressions=Number(row.impressions||0);
    clicks+=rowClicks;
    impressions+=rowImpressions;
    positionWeighted+=Number(row.position||0)*rowImpressions;
  }
  return {
    siteUrl:site.siteUrl,
    permissionLevel:site.permissionLevel||null,
    days:normalizedDays,
    summary:{clicks,impressions,ctr:impressions>0?clicks/impressions:0,position:impressions>0?positionWeighted/impressions:null},
    queries:queryRows.slice(0,100),
    pages:pageRows.slice(0,100)
  };
}

async function merchantCommerceForProject(projectId:string,accessToken:string){
  const [project,integration]=await Promise.all([
    pool.query('select domain from projects where id=$1',[projectId]),
    pool.query("select metadata from integrations where project_id=$1 and provider='google_oauth' and status='connected' order by created_at desc limit 1",[projectId])
  ]);
  const domain=normalizeDomain(String(project.rows[0]?.domain||''));
  if(!domain)throw new Error('Proje bulunamadı.');
  const metadata=integration.rows[0]?.metadata as {selectedMerchantAccountName?:string}|undefined;

  const accountsResponse=(await getJson('https://merchantapi.googleapis.com/accounts/v1/accounts?pageSize=500',accessToken)) as MerchantAccountsResponse;
  const accounts=accountsResponse.accounts||[];
  const enriched=await Promise.all(accounts.map(async account=>{
    if(!account.name)return {...account,homepage:null as MerchantHomepage|null};
    try{
      const homepage=(await getJson(`https://merchantapi.googleapis.com/accounts/v1/${account.name}/homepage`,accessToken)) as MerchantHomepage;
      return {...account,homepage};
    }catch{return {...account,homepage:null as MerchantHomepage|null}}
  }));

  const selected=metadata?.selectedMerchantAccountName ? enriched.find(a=>a.name===metadata.selectedMerchantAccountName) : undefined;
  const accountList=enriched.map(a=>({name:a.name||'',accountName:a.accountName||a.name||'Merchant Center',homepage:a.homepage?.uri||null,claimed:a.homepage?.claimed??null,timeZone:typeof a.timeZone==='string'?a.timeZone:a.timeZone?.id||null,languageCode:a.languageCode||null}));
  if(metadata?.selectedMerchantAccountName&&!selected?.name){
    return {matched:false,domain,message:'Seçili Merchant Center hesabına artık erişim bulunamadı. Yeni hesap açıkça seçilmeli.',accounts:accountList,selectedMerchantAccountName:metadata.selectedMerchantAccountName};
  }
  const matched=selected||enriched.find(a=>normalizeDomain(a.homepage?.uri||'')===domain);

  if(!matched?.name){
    return {matched:false,domain,message:`${domain} için Merchant Center hesabı otomatik eşleşmedi.`,accounts:accountList,selectedMerchantAccountName:metadata?.selectedMerchantAccountName||null};
  }

  const [productsResponse,issuesResponse]=await Promise.all([
    getJson(`https://merchantapi.googleapis.com/products/v1/${matched.name}/products?pageSize=250`,accessToken) as Promise<MerchantProductsResponse>,
    getJson(`https://merchantapi.googleapis.com/accounts/v1/${matched.name}/issues?pageSize=100&languageCode=tr-TR&timeZone=Europe%2FIstanbul`,accessToken) as Promise<MerchantIssuesResponse>
  ]);
  const products=productsResponse.products||[];
  const accountIssues=issuesResponse.accountIssues||[];
  let approved=0,pending=0,disapproved=0,withIssues=0;
  const productRows=products.map(product=>{
    const statuses=product.productStatus?.destinationStatuses||[];
    const itemIssues=product.productStatus?.itemLevelIssues||[];
    const hasDisapproved=statuses.some(s=>(s.disapprovedCountries?.length||0)>0)||itemIssues.some(i=>String(i.severity||'').toUpperCase()==='DISAPPROVED');
    const hasPending=statuses.some(s=>(s.pendingCountries?.length||0)>0);
    const hasApproved=statuses.some(s=>(s.approvedCountries?.length||0)>0);
    const status=hasDisapproved?'disapproved':hasPending?'pending':hasApproved?'approved':'unknown';
    if(status==='disapproved')disapproved++;else if(status==='pending')pending++;else if(status==='approved')approved++;
    if(itemIssues.length)withIssues++;
    return {name:product.name||'',offerId:product.offerId||'',title:product.attributes?.title||product.offerId||'Ürün',availability:product.attributes?.availability||null,link:product.attributes?.link||null,status,issueCount:itemIssues.length,issues:itemIssues.slice(0,5)};
  });
  const severityCounts=accountIssues.reduce((acc,issue)=>{const key=String(issue.severity||'UNKNOWN').toLowerCase();acc[key]=(acc[key]||0)+1;return acc},{} as Record<string,number>);
  return {
    matched:true,
    domain,
    selectedMerchantAccountName:matched.name,
    account:{name:matched.name,accountName:matched.accountName||matched.name,homepage:matched.homepage?.uri||null,claimed:matched.homepage?.claimed??null,timeZone:typeof matched.timeZone==='string'?matched.timeZone:matched.timeZone?.id||null,languageCode:matched.languageCode||null},
    accounts:accountList,
    summary:{totalProducts:products.length,approved,pending,disapproved,withIssues,accountIssues:accountIssues.length,criticalIssues:severityCounts.critical||0,errorIssues:severityCounts.error||0,suggestionIssues:severityCounts.suggestion||0,partialProducts:Boolean(productsResponse.nextPageToken)},
    accountIssues:accountIssues.slice(0,50),
    products:productRows.slice(0,100)
  };
}

export async function discoverGoogleResources(projectId:string) {
  const accessToken = await googleAccessForProject(projectId);
  const adsVersion = process.env.GOOGLE_ADS_API_VERSION || 'v25';
  const results:{ads?:unknown;analytics?:unknown;analyticsPerformance?:unknown;searchConsole?:unknown;merchant?:unknown;merchantCommerce?:unknown;errors:Record<string,string>} = {errors:{}};

  const jobs:[keyof Omit<typeof results,'errors'>,()=>Promise<unknown>][] = [
    ['ads',()=>getJson(`https://googleads.googleapis.com/${adsVersion}/customers:listAccessibleCustomers`,accessToken,{'developer-token':required('GOOGLE_ADS_DEVELOPER_TOKEN')})],
    ['analytics',()=>getJson('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',accessToken)],
    ['analyticsPerformance',async()=>{
      const project=await pool.query('select domain from projects where id=$1',[projectId]);
      const domain=String(project.rows[0]?.domain||'').replace(/^www\./,'').toLowerCase();
      const summaries=await getJson('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',accessToken) as {accountSummaries?:Array<{account?:string;displayName?:string;propertySummaries?:Array<{property?:string;displayName?:string}>}>};
      const properties=(summaries.accountSummaries||[]).flatMap(a=>(a.propertySummaries||[]).map(p=>({...p,accountName:a.displayName||'',account:a.account||''})));
      let matched:null|{property?:string;displayName?:string;accountName?:string;stream?:{displayName?:string;measurementId?:string;defaultUri?:string};timeZone?:string;currencyCode?:string}=null;
      for(const p of properties){
        if(!p.property)continue;
        try{
          const streams=await getJson(`https://analyticsadmin.googleapis.com/v1beta/${p.property}/dataStreams`,accessToken) as {dataStreams?:Array<{displayName?:string;webStreamData?:{measurementId?:string;defaultUri?:string}}>};
          const web=(streams.dataStreams||[]).find(s=>normalizeDomain(s.webStreamData?.defaultUri||'')===domain);
          if(web){
            const detail=await getJson(`https://analyticsadmin.googleapis.com/v1beta/${p.property}`,accessToken) as {timeZone?:string;currencyCode?:string};
            matched={property:p.property,displayName:p.displayName,accountName:p.accountName,stream:{displayName:web.displayName,measurementId:web.webStreamData?.measurementId,defaultUri:web.webStreamData?.defaultUri},timeZone:detail.timeZone,currencyCode:detail.currencyCode};break;
          }
        }catch{}
      }
      if(!matched)return {matched:false,properties,message:`${domain} için GA4 web data stream otomatik eşleşmedi.`};
      const propertyId=matched.property!.replace('properties/','');
      const dateRanges=[{startDate:'28daysAgo',endDate:'today'}];
      const summary=await postJson<{rows?:Array<{metricValues?:Array<{value?:string}>}>}>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,accessToken,{dateRanges,metrics:[{name:'activeUsers'},{name:'newUsers'},{name:'sessions'},{name:'screenPageViews'},{name:'keyEvents'},{name:'transactions'},{name:'totalRevenue'}]});
      const sv=summary.rows?.[0]?.metricValues||[];
      const traffic=await postJson<{rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>}>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,accessToken,{dateRanges,dimensions:[{name:'sessionDefaultChannelGroup'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'keyEvents'},{name:'totalRevenue'}],orderBys:[{metric:{metricName:'sessions'},desc:true}],limit:50});
      const landing=await postJson<{rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>}>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,accessToken,{dateRanges,dimensions:[{name:'landingPagePlusQueryString'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'keyEvents'},{name:'totalRevenue'}],orderBys:[{metric:{metricName:'sessions'},desc:true}],limit:50});
      const n=(value?:string)=>Number(value||0);
      return {matched:true,days:28,property:matched.property,propertyName:matched.displayName,accountName:matched.accountName,stream:matched.stream,metadata:{timeZone:matched.timeZone,currencyCode:matched.currencyCode},summary:{activeUsers:n(sv[0]?.value),newUsers:n(sv[1]?.value),sessions:n(sv[2]?.value),views:n(sv[3]?.value),keyEvents:n(sv[4]?.value),transactions:n(sv[5]?.value),totalRevenue:n(sv[6]?.value)},traffic:(traffic.rows||[]).map(r=>({channel:r.dimensionValues?.[0]?.value||'Unknown',sessions:n(r.metricValues?.[0]?.value),activeUsers:n(r.metricValues?.[1]?.value),keyEvents:n(r.metricValues?.[2]?.value),totalRevenue:n(r.metricValues?.[3]?.value)})),landingPages:(landing.rows||[]).map(r=>({page:r.dimensionValues?.[0]?.value||'/',sessions:n(r.metricValues?.[0]?.value),activeUsers:n(r.metricValues?.[1]?.value),keyEvents:n(r.metricValues?.[2]?.value),totalRevenue:n(r.metricValues?.[3]?.value)})),properties};
    }],
    ['searchConsole',()=>getJson('https://www.googleapis.com/webmasters/v3/sites',accessToken)],
    ['merchant',()=>getJson('https://merchantapi.googleapis.com/accounts/v1/accounts?pageSize=500',accessToken)],
    ['merchantCommerce',()=>merchantCommerceForProject(projectId,accessToken)]
  ];

  await Promise.all(jobs.map(async ([key,job])=>{
    try { results[key] = await job(); }
    catch (error) { results.errors[key] = error instanceof Error ? error.message : 'Kaynak okunamadı'; }
  }));
  return results;
}
