import { pool } from './db.js';
import { googleAccessForProject } from './google.js';

type AnalyticsProperty={property?:string;displayName?:string;accountName?:string;account?:string};
type AnalyticsStream={displayName?:string;webStreamData?:{measurementId?:string;defaultUri?:string}};
type AnalyticsSummary={accountSummaries?:Array<{account?:string;displayName?:string;propertySummaries?:Array<{property?:string;displayName?:string}>}>;nextPageToken?:string};

type ReportCoverage={rowCount?:number;metadata?:{dataLossFromOtherRow?:boolean;subjectToThresholding?:boolean;samplingMetadatas?:unknown[];dataTruncationReasons?:unknown[];emptyReason?:string;schemaRestrictionResponse?:{activeMetricRestrictions?:unknown[]}}};
function reportIsPartial(report:ReportCoverage & {rows?:unknown[]}){
  return (report.rowCount??0)>(report.rows?.length||0)||Boolean(report.metadata?.dataLossFromOtherRow||report.metadata?.subjectToThresholding||report.metadata?.samplingMetadatas?.length||report.metadata?.dataTruncationReasons?.length||report.metadata?.emptyReason||report.metadata?.schemaRestrictionResponse?.activeMetricRestrictions?.length);
}

const ANALYTICS_HTTP_TIMEOUT_MS=20_000;
const ANALYTICS_HTTP_MAX_BYTES=4*1024*1024;
const ANALYTICS_ACCOUNT_SUMMARY_MAX_PAGES=100;

async function readLimitedText(response:Response,maxBytes=ANALYTICS_HTTP_MAX_BYTES){
  const contentLength=Number(response.headers.get('content-length')||'0');
  if(Number.isFinite(contentLength)&&contentLength>maxBytes)throw new Error('Google Analytics API yanıtı boyut limitini aştı.');
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
        throw new Error('Google Analytics API yanıtı boyut limitini aştı.');
      }
      chunks.push(value);
    }
  }finally{
    reader.releaseLock();
  }
  const bytes=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){
    bytes.set(chunk,offset);
    offset+=chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchText(url:string,accessToken:string,init:RequestInit={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(new Error('Google Analytics API isteği zaman aşımına uğradı.')),ANALYTICS_HTTP_TIMEOUT_MS);
  try{
    const headers=new Headers(init.headers);
    headers.set('authorization',`Bearer ${accessToken}`);
    const response=await fetch(url,{...init,headers,signal:controller.signal});
    const text=await readLimitedText(response);
    return {response,text};
  }finally{
    clearTimeout(timeout);
  }
}

async function getJson(url:string,accessToken:string):Promise<unknown>{
  const {response,text}=await fetchText(url,accessToken);
  let data:unknown={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!response.ok)throw new Error(`Google Analytics API ${response.status}: ${typeof data==='object'?JSON.stringify(data):text}`);
  return data;
}

async function postJson<T>(url:string,accessToken:string,body:unknown):Promise<T>{
  const {response,text}=await fetchText(url,accessToken,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  let data:unknown={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!response.ok)throw new Error(`Google Analytics API ${response.status}: ${typeof data==='object'?JSON.stringify(data):text}`);
  return data as T;
}

function normalizeDomain(value:string){return value.replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].toLowerCase()}

async function listProperties(accessToken:string){
  const properties:AnalyticsProperty[]=[];
  const seenPageTokens=new Set<string>();
  let pageToken='';
  for(let page=0;page<ANALYTICS_ACCOUNT_SUMMARY_MAX_PAGES;page++){
    const url=new URL('https://analyticsadmin.googleapis.com/v1beta/accountSummaries');
    url.searchParams.set('pageSize','200');
    if(pageToken)url.searchParams.set('pageToken',pageToken);
    const summaries=await getJson(url.toString(),accessToken) as AnalyticsSummary;
    properties.push(...(summaries.accountSummaries||[]).flatMap(account=>(account.propertySummaries||[]).map(property=>({...property,accountName:account.displayName||'',account:account.account||''}))));
    const nextPageToken=(summaries.nextPageToken||'').trim();
    if(!nextPageToken)return properties;
    if(seenPageTokens.has(nextPageToken))throw new Error('Google Analytics account summary pagination döngüsü algılandı.');
    seenPageTokens.add(nextPageToken);
    pageToken=nextPageToken;
  }
  throw new Error('Google Analytics account summary pagination güvenlik sayfa limitini aştı.');
}

async function streamsForProperty(property:string,accessToken:string){
  const response=await getJson(`https://analyticsadmin.googleapis.com/v1beta/${property}/dataStreams`,accessToken) as {dataStreams?:AnalyticsStream[]};
  return response.dataStreams||[];
}

export async function selectAnalyticsPropertyForProject(projectId:string,property:string){
  const accessToken=await googleAccessForProject(projectId);
  const properties=await listProperties(accessToken);
  const selected=properties.find(item=>item.property===property);
  if(!selected)throw new Error('Bu GA4 property için erişim bulunamadı.');

  const client=await pool.connect();
  try{
    await client.query('begin');
    const projectResult=await client.query('select status from projects where id=$1 for update',[projectId]);
    if(projectResult.rows[0]?.status!=='active')throw new Error('Proje aktif değil veya bulunamadı.');
    const {rows}=await client.query(`
      update integrations
      set metadata=coalesce(metadata,'{}'::jsonb)||$2::jsonb
      where project_id=$1 and provider='google_oauth' and status='connected'
      returning id,provider,account_label,status,mode,last_sync_at,metadata`,[projectId,JSON.stringify({selectedAnalyticsProperty:property,selectedAnalyticsPropertyName:selected.displayName||property})]);
    if(!rows[0])throw new Error('Google bağlantısı bulunamadı.');
    await client.query('commit');
  }catch(error){
    await client.query('rollback');
    throw error;
  }finally{
    client.release();
  }
  return {selectedAnalyticsProperty:property,propertyName:selected.displayName||property,accountName:selected.accountName||null};
}

export async function analyticsPerformanceForProject(projectId:string){
  const [projectResult,integrationResult,accessToken]=await Promise.all([
    pool.query('select domain from projects where id=$1',[projectId]),
    pool.query("select metadata from integrations where project_id=$1 and provider='google_oauth' and status='connected' order by created_at desc limit 1",[projectId]),
    googleAccessForProject(projectId)
  ]);
  const domain=normalizeDomain(String(projectResult.rows[0]?.domain||''));
  if(!domain)throw new Error('Proje bulunamadı.');
  const metadata=integrationResult.rows[0]?.metadata as {selectedAnalyticsProperty?:string}|undefined;
  const properties=await listProperties(accessToken);
  const selectedProperty=metadata?.selectedAnalyticsProperty?properties.find(item=>item.property===metadata.selectedAnalyticsProperty):undefined;
  if(metadata?.selectedAnalyticsProperty&&!selectedProperty?.property){
    return {matched:false,properties,selectedAnalyticsProperty:metadata.selectedAnalyticsProperty,message:'Seçili GA4 property için artık erişim bulunamadı. Yeni property açıkça seçilmeli.'};
  }

  let matched:null|{property?:string;displayName?:string;accountName?:string;stream?:{displayName?:string;measurementId?:string;defaultUri?:string};timeZone?:string;currencyCode?:string}=null;
  if(selectedProperty?.property){
    const streams=await streamsForProperty(selectedProperty.property,accessToken);
    const web=streams.find(stream=>stream.webStreamData?.defaultUri&&normalizeDomain(stream.webStreamData.defaultUri)===domain)||streams.find(stream=>stream.webStreamData);
    const detail=await getJson(`https://analyticsadmin.googleapis.com/v1beta/${selectedProperty.property}`,accessToken) as {timeZone?:string;currencyCode?:string};
    matched={property:selectedProperty.property,displayName:selectedProperty.displayName,accountName:selectedProperty.accountName,stream:web?{displayName:web.displayName,measurementId:web.webStreamData?.measurementId,defaultUri:web.webStreamData?.defaultUri}:undefined,timeZone:detail.timeZone,currencyCode:detail.currencyCode};
  }else{
    for(const property of properties){
      if(!property.property)continue;
      try{
        const streams=await streamsForProperty(property.property,accessToken);
        const web=streams.find(stream=>normalizeDomain(stream.webStreamData?.defaultUri||'')===domain);
        if(!web)continue;
        const detail=await getJson(`https://analyticsadmin.googleapis.com/v1beta/${property.property}`,accessToken) as {timeZone?:string;currencyCode?:string};
        matched={property:property.property,displayName:property.displayName,accountName:property.accountName,stream:{displayName:web.displayName,measurementId:web.webStreamData?.measurementId,defaultUri:web.webStreamData?.defaultUri},timeZone:detail.timeZone,currencyCode:detail.currencyCode};
        break;
      }catch{}
    }
  }

  if(!matched?.property)return {matched:false,properties,selectedAnalyticsProperty:metadata?.selectedAnalyticsProperty||null,message:`${domain} için GA4 web data stream otomatik eşleşmedi.`};
  const propertyId=matched.property.replace('properties/','');
  const dateRanges=[{startDate:'28daysAgo',endDate:'today'}];
  const summary=await postJson<ReportCoverage & {rows?:Array<{metricValues?:Array<{value?:string}>}>}>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,accessToken,{dateRanges,metrics:[{name:'activeUsers'},{name:'newUsers'},{name:'sessions'},{name:'screenPageViews'},{name:'keyEvents'},{name:'transactions'},{name:'totalRevenue'}]});
  const values=summary.rows?.[0]?.metricValues||[];
  const traffic=await postJson<ReportCoverage & {rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>}>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,accessToken,{dateRanges,dimensions:[{name:'sessionDefaultChannelGroup'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'keyEvents'},{name:'totalRevenue'}],orderBys:[{metric:{metricName:'sessions'},desc:true}],limit:50});
  const landing=await postJson<ReportCoverage & {rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>}>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,accessToken,{dateRanges,dimensions:[{name:'landingPagePlusQueryString'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'keyEvents'},{name:'totalRevenue'}],orderBys:[{metric:{metricName:'sessions'},desc:true}],limit:50});
  const n=(value?:string)=>Number(value||0);
  return {
    partial:reportIsPartial(summary)||reportIsPartial(traffic)||reportIsPartial(landing),
    partialSummary:reportIsPartial(summary),partialTraffic:reportIsPartial(traffic),partialLandingPages:reportIsPartial(landing),
    matched:true,days:28,property:matched.property,propertyName:matched.displayName,accountName:matched.accountName,stream:matched.stream||null,
    selectedAnalyticsProperty:metadata?.selectedAnalyticsProperty||null,
    metadata:{timeZone:matched.timeZone,currencyCode:matched.currencyCode},
    summary:{activeUsers:n(values[0]?.value),newUsers:n(values[1]?.value),sessions:n(values[2]?.value),views:n(values[3]?.value),keyEvents:n(values[4]?.value),transactions:n(values[5]?.value),totalRevenue:n(values[6]?.value)},
    traffic:(traffic.rows||[]).map(row=>({channel:row.dimensionValues?.[0]?.value||'Unknown',sessions:n(row.metricValues?.[0]?.value),activeUsers:n(row.metricValues?.[1]?.value),keyEvents:n(row.metricValues?.[2]?.value),totalRevenue:n(row.metricValues?.[3]?.value)})),
    landingPages:(landing.rows||[]).map(row=>({page:row.dimensionValues?.[0]?.value||'/',sessions:n(row.metricValues?.[0]?.value),activeUsers:n(row.metricValues?.[1]?.value),keyEvents:n(row.metricValues?.[2]?.value),totalRevenue:n(row.metricValues?.[3]?.value)})),properties
  };
}
