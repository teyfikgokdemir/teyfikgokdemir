import { pool } from './db.js';
import { decryptSecret, googleAccessForProject } from './google.js';

type NormalizedMetric={
  provider:'google_ads'|'meta_ads'|'tiktok_ads';
  campaignId:string;
  campaignName:string;
  date:string;
  spend:number;
  impressions:number;
  clicks:number;
  conversions:number;
  revenue:number;
  metadata?:Record<string,unknown>;
};

function asNumber(value:unknown){
  const n=Number(value??0);
  return Number.isFinite(n)?n:0;
}

function isoDate(d:Date){return d.toISOString().slice(0,10)}
function lastNDays(days:number){
  const end=new Date();
  const start=new Date();
  start.setUTCDate(start.getUTCDate()-(days-1));
  return {start:isoDate(start),end:isoDate(end)};
}

async function integration(projectId:string,provider:string){
  const {rows}=await pool.query("select id,account_label,external_account_id,metadata from integrations where project_id=$1 and provider=$2 and status='connected' order by created_at desc limit 1",[projectId,provider]);
  if(!rows[0])throw new Error(`${provider} bağlantısı bulunamadı.`);
  return rows[0] as {id:string;account_label?:string;external_account_id?:string;metadata:Record<string,unknown>};
}

async function googleMetrics(projectId:string,days:number):Promise<NormalizedMetric[]>{
  const row=await integration(projectId,'google_oauth');
  const metadata=row.metadata as {selectedCustomerId?:string};
  if(!metadata.selectedCustomerId)throw new Error('Önce Google Ads müşteri hesabını seçin.');
  const developerToken=process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if(!developerToken)throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN yapılandırılmamış.');
  const accessToken=await googleAccessForProject(projectId);
  const version=process.env.GOOGLE_ADS_API_VERSION?.trim()||'v25';
  const {start,end}=lastNDays(days);
  const query=`SELECT campaign.id, campaign.name, campaign.status, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}' AND campaign.status != 'REMOVED'`;
  const headers:Record<string,string>={
    authorization:`Bearer ${accessToken}`,
    'developer-token':developerToken,
    'content-type':'application/json'
  };
  const loginCustomerId=process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/\D/g,'');
  if(loginCustomerId)headers['login-customer-id']=loginCustomerId;
  const response=await fetch(`https://googleads.googleapis.com/${version}/customers/${metadata.selectedCustomerId}/googleAds:searchStream`,{method:'POST',headers,body:JSON.stringify({query})});
  const text=await response.text();
  if(!response.ok)throw new Error(`Google Ads API ${response.status}: ${text.slice(0,500)}`);
  const batches=JSON.parse(text) as Array<{results?:Array<{campaign?:{id?:string;name?:string;status?:string};segments?:{date?:string};metrics?:Record<string,unknown>}>}>;
  return batches.flatMap(batch=>(batch.results||[]).map(r=>({
    provider:'google_ads' as const,
    campaignId:String(r.campaign?.id||''),
    campaignName:r.campaign?.name||'Ads campaign',
    date:r.segments?.date||end,
    spend:asNumber(r.metrics?.costMicros)/1_000_000,
    impressions:asNumber(r.metrics?.impressions),
    clicks:asNumber(r.metrics?.clicks),
    conversions:asNumber(r.metrics?.conversions),
    revenue:asNumber(r.metrics?.conversionsValue),
    metadata:{status:r.campaign?.status||null}
  })).filter(x=>x.campaignId));
}

function metaActionValue(items:unknown,key:string){
  if(!Array.isArray(items))return 0;
  const row=(items as Array<{action_type?:string;value?:string|number}>).find(i=>i.action_type===key);
  return asNumber(row?.value);
}
function metaPurchase(items:unknown){
  const keys=['purchase','omni_purchase','offsite_conversion.fb_pixel_purchase'];
  for(const key of keys){const value=metaActionValue(items,key);if(value)return value}
  return 0;
}

async function metaMetrics(projectId:string,days:number):Promise<NormalizedMetric[]>{
  const row=await integration(projectId,'meta_ads');
  const metadata=row.metadata as {accessTokenEncrypted?:string;selectedAdAccountId?:string};
  if(!metadata.accessTokenEncrypted)throw new Error('Meta access token bulunamadı.');
  if(!metadata.selectedAdAccountId)throw new Error('Önce Meta Ads hesabını seçin.');
  const token=decryptSecret(metadata.accessTokenEncrypted);
  const version=process.env.META_GRAPH_API_VERSION?.trim()||'v26.0';
  const accountId=metadata.selectedAdAccountId.startsWith('act_')?metadata.selectedAdAccountId:`act_${metadata.selectedAdAccountId}`;
  const {start,end}=lastNDays(days);
  const url=new URL(`https://graph.facebook.com/${version}/${accountId}/insights`);
  url.searchParams.set('access_token',token);
  url.searchParams.set('level','campaign');
  url.searchParams.set('time_increment','1');
  url.searchParams.set('time_range',JSON.stringify({since:start,until:end}));
  url.searchParams.set('fields','campaign_id,campaign_name,date_start,date_stop,spend,impressions,clicks,actions,action_values');
  url.searchParams.set('limit','500');
  const all:Array<Record<string,unknown>>=[];
  let next:string|null=url.toString();
  while(next&&all.length<5000){
    const response=await fetch(next);
    const data=await response.json() as {data?:Array<Record<string,unknown>>;paging?:{next?:string};error?:{message?:string}};
    if(!response.ok)throw new Error(data.error?.message||`Meta API ${response.status}`);
    all.push(...(data.data||[]));
    next=data.paging?.next||null;
  }
  return all.map(r=>({
    provider:'meta_ads' as const,
    campaignId:String(r.campaign_id||''),
    campaignName:String(r.campaign_name||'Meta campaign'),
    date:String(r.date_start||end),
    spend:asNumber(r.spend),
    impressions:asNumber(r.impressions),
    clicks:asNumber(r.clicks),
    conversions:metaPurchase(r.actions),
    revenue:metaPurchase(r.action_values),
    metadata:{}
  })).filter(x=>x.campaignId);
}

async function tiktokMetrics(projectId:string,days:number):Promise<NormalizedMetric[]>{
  const row=await integration(projectId,'tiktok_ads');
  const metadata=row.metadata as {accessTokenEncrypted?:string;selectedAdvertiserId?:string};
  if(!metadata.accessTokenEncrypted)throw new Error('TikTok access token bulunamadı.');
  if(!metadata.selectedAdvertiserId)throw new Error('Önce TikTok Ads hesabını seçin.');
  const token=decryptSecret(metadata.accessTokenEncrypted);
  const {start,end}=lastNDays(days);
  const url=new URL('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/');
  url.searchParams.set('advertiser_id',metadata.selectedAdvertiserId);
  url.searchParams.set('report_type','BASIC');
  url.searchParams.set('data_level','AUCTION_CAMPAIGN');
  url.searchParams.set('dimensions',JSON.stringify(['campaign_id','stat_time_day']));
  url.searchParams.set('metrics',JSON.stringify(['campaign_name','spend','impressions','clicks','conversion']));
  url.searchParams.set('start_date',start);
  url.searchParams.set('end_date',end);
  url.searchParams.set('page_size','1000');
  const response=await fetch(url,{headers:{'Access-Token':token}});
  const payload=await response.json() as {code?:number;message?:string;data?:{list?:Array<{dimensions?:Record<string,unknown>;metrics?:Record<string,unknown>}>}};
  if(!response.ok||payload.code!==0)throw new Error(payload.message||`TikTok API ${response.status}`);
  return (payload.data?.list||[]).map(r=>({
    provider:'tiktok_ads' as const,
    campaignId:String(r.dimensions?.campaign_id||''),
    campaignName:String(r.metrics?.campaign_name||`TikTok ${r.dimensions?.campaign_id||''}`),
    date:String(r.dimensions?.stat_time_day||end).slice(0,10),
    spend:asNumber(r.metrics?.spend),
    impressions:asNumber(r.metrics?.impressions),
    clicks:asNumber(r.metrics?.clicks),
    conversions:asNumber(r.metrics?.conversion),
    revenue:0,
    metadata:{}
  })).filter(x=>x.campaignId);
}

async function persist(projectId:string,metrics:NormalizedMetric[]){
  const client=await pool.connect();
  try{
    await client.query('begin');
    for(const m of metrics){
      await client.query(`insert into campaign_metrics(project_id,provider,external_campaign_id,campaign_name,metric_date,spend,impressions,clicks,conversions,attributed_revenue,metadata)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        on conflict(project_id,provider,external_campaign_id,metric_date) do update set campaign_name=excluded.campaign_name,spend=excluded.spend,impressions=excluded.impressions,clicks=excluded.clicks,conversions=excluded.conversions,attributed_revenue=excluded.attributed_revenue,metadata=excluded.metadata`,
        [projectId,m.provider,m.campaignId,m.campaignName,m.date,m.spend,m.impressions,m.clicks,m.conversions,m.revenue,m.metadata||{}]);
    }
    await client.query('commit');
  }catch(error){await client.query('rollback');throw error}finally{client.release()}
}

export async function syncAdsProject(projectId:string,days=30){
  const providers=await pool.query("select provider from integrations where project_id=$1 and status='connected' and provider in ('google_oauth','meta_ads','tiktok_ads')",[projectId]);
  const active=new Set(providers.rows.map(r=>r.provider as string));
  const results:Array<{provider:string;ok:boolean;rows:number;error?:string}>=[];
  const jobs:Array<[string,()=>Promise<NormalizedMetric[]>]>=[];
  if(active.has('google_oauth'))jobs.push(['google_ads',()=>googleMetrics(projectId,days)]);
  if(active.has('meta_ads'))jobs.push(['meta_ads',()=>metaMetrics(projectId,days)]);
  if(active.has('tiktok_ads'))jobs.push(['tiktok_ads',()=>tiktokMetrics(projectId,days)]);
  for(const [provider,job] of jobs){
    try{
      const metrics=await job();
      await persist(projectId,metrics);
      await pool.query("update integrations set last_sync_at=now() where project_id=$1 and provider=$2",[projectId,provider==='google_ads'?'google_oauth':provider]);
      results.push({provider,ok:true,rows:metrics.length});
    }catch(error){results.push({provider,ok:false,rows:0,error:error instanceof Error?error.message:'Senkronizasyon başarısız.'})}
  }
  return {readOnly:true,days,results};
}
