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

export async function syncAdsProject(projectId:string,days=30){
  const providers=await pool.query("select provider from integrations where project_id=$1 and status='connected' and provider in ('google_oauth','meta_ads','tiktok_ads')",[projectId]);
  const active=new Set(providers.rows.map(r=>r.provider as string));
  const results:Array<{provider:string;ok:boolean;rows:number;error?:string}>=[];
  const jobs:Array<[string,()=>Promise<NormalizedMetric[]>]>=[];
  const allMetrics:NormalizedMetric[]=[];
  if(active.has('google_oauth'))jobs.push(['google_ads',()=>googleMetrics(projectId,days)]);
  if(active.has('meta_ads'))jobs.push(['meta_ads',()=>metaMetrics(projectId,days)]);
  if(active.has('tiktok_ads'))jobs.push(['tiktok_ads',()=>tiktokMetrics(projectId,days)]);
  for(const [provider,job] of jobs){
    try{
      const metrics=await job();
      allMetrics.push(...metrics);
      await persist(projectId,metrics);
      await pool.query("update integrations set last_sync_at=now() where project_id=$1 and provider=$2",[projectId,provider==='google_ads'?'google_oauth':provider]);
      results.push({provider,ok:true,rows:metrics.length});
    }catch(error){results.push({provider,ok:false,rows:0,error:error instanceof Error?error.message:'Senkronizasyon başarısız.'})}
  }
  const intelligence=allMetrics.length?await refreshAdsIntelligence(projectId,allMetrics):{evaluatedCampaigns:0,alerts:0,recommendations:0,targetsConfigured:{targetRoas:false,targetCpa:false,breakEvenRoas:false}};
  return {readOnly:true,externalExecution:false,days,results,summary:summarize(allMetrics),intelligence};
}
