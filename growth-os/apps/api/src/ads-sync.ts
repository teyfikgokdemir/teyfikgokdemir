import { pool } from './db.js';
import type { PoolClient } from 'pg';
import { decryptSecret, googleAccessForProject } from './google.js';
import { refreshGrowthIntelligence } from './growth-intelligence.js';

class AdsSyncAbortedError extends Error {
  constructor(){super('Proje arşivlendi; reklam senkronizasyonu durduruldu.')}
}

async function assertProjectStillActive(projectId:string,client?:PoolClient){
  // Hold the project lock until the local write transaction commits. Never across provider fetches.
  const {rows}=await (client||pool).query(`select status from projects where id=$1${client?' for update':''}`,[projectId]);
  if(rows[0]?.status!=='active')throw new AdsSyncAbortedError();
}

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

type CampaignAggregate={
  provider:NormalizedMetric['provider'];
  campaignId:string;
  campaignName:string;
  spend:number;
  impressions:number;
  clicks:number;
  conversions:number;
  revenue:number;
};

type BusinessTargets={
  target_roas?:number|string|null;
  target_cpa?:number|string|null;
  break_even_roas?:number|string|null;
};

const ADS_PROVIDER_TIMEOUT_MS=30_000;
const ADS_PROVIDER_MAX_BYTES=8*1024*1024;

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

async function readProviderText(response:Response,maxBytes=ADS_PROVIDER_MAX_BYTES){
  const contentLength=Number(response.headers.get('content-length')||0);
  if(Number.isFinite(contentLength)&&contentLength>maxBytes){
    await response.body?.cancel();
    throw new Error('Reklam sağlayıcısı yanıtı güvenli boyut sınırını aştı.');
  }
  if(!response.body)return '';
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let total=0;
  let text='';
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      if(!value)continue;
      total+=value.byteLength;
      if(total>maxBytes){
        await reader.cancel();
        throw new Error('Reklam sağlayıcısı yanıtı güvenli boyut sınırını aştı.');
      }
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  }finally{
    reader.releaseLock();
  }
}

async function providerFetchText(input:string|URL,init:RequestInit={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(new Error('Reklam sağlayıcısı isteği zaman aşımına uğradı.')),ADS_PROVIDER_TIMEOUT_MS);
  try{
    const response=await fetch(input,{...init,signal:controller.signal});
    const text=await readProviderText(response);
    return {response,text};
  }finally{
    clearTimeout(timeout);
  }
}

async function providerFetchJson<T>(input:string|URL,init:RequestInit={}){
  const {response,text}=await providerFetchText(input,init);
  let data:unknown={};
  try{data=text?JSON.parse(text):{}}catch{throw new Error(`Reklam sağlayıcısı geçersiz JSON döndürdü: ${text.slice(0,300)}`)}
  return {response,data:data as T};
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
  const accessToken=await googleAccessForProject(projectId);
  const version=process.env.GOOGLE_ADS_API_VERSION?.trim()||'v25';
  const {start,end}=lastNDays(days);
  const query=`SELECT campaign.id, campaign.name, campaign.status, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}' AND campaign.status != 'REMOVED'`;
  const headers:Record<string,string>={
    authorization:`Bearer ${accessToken}`,
    'content-type':'application/json'
  };
  if(developerToken)headers['developer-token']=developerToken;
  const loginCustomerId=process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/\D/g,'');
  if(loginCustomerId)headers['login-customer-id']=loginCustomerId;
  await assertProjectStillActive(projectId);
  const {response,text}=await providerFetchText(`https://googleads.googleapis.com/${version}/customers/${metadata.selectedCustomerId}/googleAds:searchStream`,{method:'POST',headers,body:JSON.stringify({query})});
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
  }))).filter(x=>x.campaignId);
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
  while(next){
    await assertProjectStillActive(projectId);
    const {response,data}=await providerFetchJson<{data?:Array<Record<string,unknown>>;paging?:{next?:string};error?:{message?:string}}>(next);
    if(!response.ok)throw new Error(data.error?.message||`Meta API ${response.status}`);
    all.push(...(data.data||[]));
    next=data.paging?.next||null;
    if(next&&all.length>=5000)throw new Error('Meta Ads raporu 5000 kayıt limitini aştı; eksik veri kaydedilmedi.');
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
  const all:Array<{dimensions?:Record<string,unknown>;metrics?:Record<string,unknown>}>=[];
  const maxPages=100;
  let page=1;
  while(true){
    url.searchParams.set('page',String(page));
    await assertProjectStillActive(projectId);
    const {response,data:payload}=await providerFetchJson<{code?:number;message?:string;data?:{list?:Array<{dimensions?:Record<string,unknown>;metrics?:Record<string,unknown>}>;page_info?:{page?:number;page_size?:number;total_number?:number;total_page?:number}}}>(url,{headers:{'Access-Token':token}});
    if(!response.ok||payload.code!==0)throw new Error(payload.message||`TikTok API ${response.status}`);
    all.push(...(payload.data?.list||[]));
    const totalPages=Math.max(1,asNumber(payload.data?.page_info?.total_page)||1);
    if(totalPages>maxPages)throw new Error(`TikTok Ads raporu ${maxPages} sayfa limitini aştı; eksik veri kaydedilmedi.`);
    if(page>=totalPages)break;
    page+=1;
  }
  return all.map(r=>({
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

async function persist(projectId:string,metrics:NormalizedMetric[],provider:string){
  const client=await pool.connect();
  try{
    await client.query('begin');
    await assertProjectStillActive(projectId,client);
    for(const m of metrics){
      await client.query(`insert into campaign_metrics(project_id,provider,external_campaign_id,campaign_name,metric_date,spend,impressions,clicks,conversions,attributed_revenue,metadata)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        on conflict(project_id,provider,external_campaign_id,metric_date) do update set campaign_name=excluded.campaign_name,spend=excluded.spend,impressions=excluded.impressions,clicks=excluded.clicks,conversions=excluded.conversions,attributed_revenue=excluded.attributed_revenue,metadata=excluded.metadata`,
        [projectId,m.provider,m.campaignId,m.campaignName,m.date,m.spend,m.impressions,m.clicks,m.conversions,m.revenue,m.metadata||{}]);
    }
    await client.query("update integrations set last_sync_at=now() where project_id=$1 and provider=$2",[projectId,provider==='google_ads'?'google_oauth':provider]);
    await client.query('commit');
  }catch(error){await client.query('rollback');throw error}finally{client.release()}
}

function aggregateCampaigns(metrics:NormalizedMetric[]){
  const map=new Map<string,CampaignAggregate>();
  for(const metric of metrics){
    const key=`${metric.provider}:${metric.campaignId}`;
    const current=map.get(key)||{
      provider:metric.provider,
      campaignId:metric.campaignId,
      campaignName:metric.campaignName,
      spend:0,
      impressions:0,
      clicks:0,
      conversions:0,
      revenue:0
    };
    current.spend+=metric.spend;
    current.impressions+=metric.impressions;
    current.clicks+=metric.clicks;
    current.conversions+=metric.conversions;
    current.revenue+=metric.revenue;
    map.set(key,current);
  }
  return [...map.values()];
}

function providerLabel(provider:string){
  if(provider==='google_ads')return 'Google Ads';
  if(provider==='meta_ads')return 'Meta Ads';
  if(provider==='tiktok_ads')return 'TikTok Ads';
  return provider;
}

async function refreshAdsIntelligence(projectId:string,metrics:NormalizedMetric[]){
  const {rows}=await pool.query('select target_roas,target_cpa,break_even_roas from business_targets where project_id=$1',[projectId]);
  const targets=(rows[0]||{}) as BusinessTargets;
  const targetRoas=asNumber(targets.target_roas);
  const targetCpa=asNumber(targets.target_cpa);
  const breakEvenRoas=asNumber(targets.break_even_roas);
  const campaigns=aggregateCampaigns(metrics);
  const alerts:Array<{severity:'high'|'medium';title:string;message:string;payload:Record<string,unknown>}>=[];
  const recommendations:Array<{priority:'high'|'medium';title:string;rationale:string;proposedAction:Record<string,unknown>}>=[];

  for(const campaign of campaigns){
    if(campaign.spend<=0)continue;
    const roas=campaign.revenue>0?campaign.revenue/campaign.spend:0;
    const cpa=campaign.conversions>0?campaign.spend/campaign.conversions:null;
    const context={provider:campaign.provider,campaignId:campaign.campaignId,campaignName:campaign.campaignName,spend:campaign.spend,revenue:campaign.revenue,roas,cpa,conversions:campaign.conversions};

    if(targetCpa>0&&campaign.conversions===0&&campaign.spend>=targetCpa){
      alerts.push({
        severity:'high',
        title:`${providerLabel(campaign.provider)} · dönüşümsüz harcama`,
        message:`${campaign.campaignName} kampanyası hedef CPA seviyesine ulaşan harcama yaptı ancak dönüşüm üretmedi.`,
        payload:{...context,targetCpa}
      });
      recommendations.push({
        priority:'high',
        title:`${campaign.campaignName} kampanyasını incele`,
        rationale:`Harcama ${campaign.spend.toFixed(2)} seviyesine ulaştı ve dönüşüm yok. Hedef CPA ${targetCpa.toFixed(2)}.`,
        proposedAction:{type:'review_campaign',provider:campaign.provider,campaignId:campaign.campaignId,readOnly:true,recommendation:'Kampanyayı durdurmadan önce hedefleme, kreatif ve dönüşüm takibini kontrol et.'}
      });
      continue;
    }

    if(targetCpa>0&&cpa!==null&&cpa>targetCpa*1.25){
      alerts.push({
        severity:'high',
        title:`${providerLabel(campaign.provider)} · CPA hedefin üzerinde`,
        message:`${campaign.campaignName} kampanyasının CPA değeri ${cpa.toFixed(2)}; hedef ${targetCpa.toFixed(2)}.`,
        payload:{...context,targetCpa}
      });
    }

    if(targetRoas>0&&campaign.revenue>0&&roas<targetRoas*0.7){
      alerts.push({
        severity:breakEvenRoas>0&&roas<breakEvenRoas?'high':'medium',
        title:`${providerLabel(campaign.provider)} · ROAS hedefin altında`,
        message:`${campaign.campaignName} kampanyasının ROAS değeri ${roas.toFixed(2)}; hedef ${targetRoas.toFixed(2)}.`,
        payload:{...context,targetRoas,breakEvenRoas:breakEvenRoas||null}
      });
    }

    if(targetRoas>0&&campaign.revenue>0&&roas>=targetRoas*1.2){
      recommendations.push({
        priority:'medium',
        title:`${campaign.campaignName} ölçekleme adayı`,
        rationale:`ROAS ${roas.toFixed(2)} ile hedef ${targetRoas.toFixed(2)} seviyesinin üzerinde.`,
        proposedAction:{type:'consider_scale',provider:campaign.provider,campaignId:campaign.campaignId,readOnly:true,recommendation:'Bütçe artırmadan önce son 7 gün trendini, marjı ve stok durumunu doğrula.'}
      });
    }
  }

  const client=await pool.connect();
  try{
    await client.query('begin');
    await assertProjectStillActive(projectId,client);
    await client.query("update alerts set status='resolved',resolved_at=now() where project_id=$1 and source='ads_intelligence' and status='open'",[projectId]);
    await client.query("update recommendations set status='superseded',decided_at=now() where project_id=$1 and source='ads_intelligence' and status='proposed'",[projectId]);
    for(const alert of alerts){
      await client.query(`insert into alerts(project_id,source,severity,title,message,status,payload) values($1,'ads_intelligence',$2,$3,$4,'open',$5)`,[projectId,alert.severity,alert.title,alert.message,alert.payload]);
    }
    for(const rec of recommendations){
      await client.query(`insert into recommendations(project_id,source,priority,title,rationale,proposed_action,status) values($1,'ads_intelligence',$2,$3,$4,$5,'proposed')`,[projectId,rec.priority,rec.title,rec.rationale,rec.proposedAction]);
    }
    await client.query('commit');
  }catch(error){await client.query('rollback');throw error}finally{client.release()}

  return {
    evaluatedCampaigns:campaigns.length,
    alerts:alerts.length,
    recommendations:recommendations.length,
    targetsConfigured:{targetRoas:targetRoas>0,targetCpa:targetCpa>0,breakEvenRoas:breakEvenRoas>0}
  };
}

function summarize(metrics:NormalizedMetric[]){
  const byProvider:Record<string,{spend:number;revenue:number;clicks:number;impressions:number;conversions:number;rows:number}>={};
  for(const metric of metrics){
    const current=byProvider[metric.provider]||{spend:0,revenue:0,clicks:0,impressions:0,conversions:0,rows:0};
    current.spend+=metric.spend;
    current.revenue+=metric.revenue;
    current.clicks+=metric.clicks;
    current.impressions+=metric.impressions;
    current.conversions+=metric.conversions;
    current.rows+=1;
    byProvider[metric.provider]=current;
  }
  return byProvider;
}

type SyncProgress={results:Array<{provider:string;ok:boolean;rows:number;error?:string}>;metrics:number;alerts:number;recommendations:number;intelligenceError?:string};

async function syncActiveAdsProject(projectId:string,days:number,progress:SyncProgress){
  await assertProjectStillActive(projectId);
  const providers=await pool.query("select provider from integrations where project_id=$1 and status='connected' and provider in ('google_oauth','meta_ads','tiktok_ads')",[projectId]);
  const active=new Set(providers.rows.map(r=>r.provider as string));
  const results=progress.results;
  const jobs:Array<[string,()=>Promise<NormalizedMetric[]>]>=[];
  const allMetrics:NormalizedMetric[]=[];
  if(active.has('google_oauth'))jobs.push(['google_ads',()=>googleMetrics(projectId,days)]);
  if(active.has('meta_ads'))jobs.push(['meta_ads',()=>metaMetrics(projectId,days)]);
  if(active.has('tiktok_ads'))jobs.push(['tiktok_ads',()=>tiktokMetrics(projectId,days)]);
  for(const [provider,job] of jobs){
    try{
      await assertProjectStillActive(projectId);
      const metrics=await job();
      await persist(projectId,metrics,provider);
      progress.metrics+=metrics.length;
      allMetrics.push(...metrics);
      results.push({provider,ok:true,rows:metrics.length});
    }catch(error){
      if(error instanceof AdsSyncAbortedError)throw error;
      await assertProjectStillActive(projectId);
      results.push({provider,ok:false,rows:0,error:error instanceof Error?error.message:'Senkronizasyon başarısız.'});
    }
  }
  await assertProjectStillActive(projectId);
  const intelligence=allMetrics.length?await refreshAdsIntelligence(projectId,allMetrics):{evaluatedCampaigns:0,alerts:0,recommendations:0,targetsConfigured:{targetRoas:false,targetCpa:false,breakEvenRoas:false}};
  progress.alerts+=intelligence.alerts;
  progress.recommendations+=intelligence.recommendations;
  let crossSourceIntelligence:unknown=null;
  try{
    await assertProjectStillActive(projectId);
    const growth=await refreshGrowthIntelligence(projectId,client=>assertProjectStillActive(projectId,client));
    progress.alerts+=growth.counts.alerts;
    progress.recommendations+=growth.counts.recommendations;
    crossSourceIntelligence=growth;
  }catch(error){
    if(error instanceof AdsSyncAbortedError)throw error;
    await assertProjectStillActive(projectId);
    progress.intelligenceError=error instanceof Error?error.message:'Growth Intelligence yenilenemedi.';
    crossSourceIntelligence={error:progress.intelligenceError};
  }
  return {readOnly:true,externalExecution:false,days,results,summary:summarize(allMetrics),intelligence,crossSourceIntelligence};
}

export async function syncAdsProject(projectId:string,days=30){
  const lockClient=await pool.connect();
  let lockHeld=false;
  try{
    const lock=await lockClient.query<{acquired:boolean}>(
      'select pg_try_advisory_lock(hashtextextended($1::text,0::bigint)) as acquired',
      [projectId]
    );
    if(!lock.rows[0]?.acquired)throw new Error('Bu proje için reklam senkronizasyonu zaten çalışıyor.');
    lockHeld=true;

    const client=await pool.connect();
    let runId:string;
    try{
      await client.query('begin');
      await assertProjectStillActive(projectId,client);
      const {rows}=await client.query("insert into ads_sync_runs(project_id,requested_days) values($1,$2) returning id",[projectId,days]);
      runId=rows[0].id;
      await client.query('commit');
    }catch(error){await client.query('rollback');throw error}finally{client.release()}

    const progress:SyncProgress={results:[],metrics:0,alerts:0,recommendations:0};
    try{
      const result=await syncActiveAdsProject(projectId,days,progress);
      const finalizer=await pool.connect();
      try{
        await finalizer.query('begin');
        await assertProjectStillActive(projectId,finalizer);
        const providerErrors=progress.results.filter(r=>!r.ok).map(r=>`${r.provider}: ${r.error}`);
        const errorMessage=[...providerErrors,...(progress.intelligenceError?[`growth_intelligence: ${progress.intelligenceError}`]:[])].join('; ')||null;
        const status=progress.results.length===0?'skipped':errorMessage?'failed':'success';
        const updated=await finalizer.query(`update ads_sync_runs set status=$2,finished_at=now(),error_message=$3,
          provider_results=$4,metrics_written=$5,alerts_created=$6,recommendations_created=$7
          where id=$1 and status='running'`,
          [runId,status,errorMessage,JSON.stringify(progress.results),progress.metrics,progress.alerts,progress.recommendations]);
        if(updated.rowCount!==1)throw new Error('Reklam senkronizasyonu zaten sonlandırılmış.');
        await finalizer.query('commit');
      }catch(error){await finalizer.query('rollback');throw error}finally{finalizer.release()}
      return result;
    }catch(error){
      // Prefer the archive abort even when a provider fails while the project is being archived.
      try{await assertProjectStillActive(projectId)}catch(stateError){if(stateError instanceof AdsSyncAbortedError)error=stateError}
      await pool.query(`update ads_sync_runs set status='failed',finished_at=now(),error_message=$2,
        provider_results=$3,metrics_written=$4,alerts_created=$5,recommendations_created=$6
        where id=$1 and status='running'`,
        [runId,error instanceof Error?error.message:'Reklam senkronizasyonu başarısız.',JSON.stringify(progress.results),progress.metrics,progress.alerts,progress.recommendations]);
      throw error;
    }
  }finally{
    if(lockHeld){
      try{await lockClient.query('select pg_advisory_unlock(hashtextextended($1::text,0::bigint))',[projectId])}catch(error){console.error('Ads sync advisory lock release failed',error)}
    }
    lockClient.release();
  }
}
