import { pool } from './db.js';
import { discoverGoogleResources } from './google.js';

type Severity='high'|'medium';
type Priority='high'|'medium';
type AlertDraft={severity:Severity;title:string;message:string;payload:Record<string,unknown>};
type RecommendationDraft={priority:Priority;title:string;rationale:string;action:Record<string,unknown>};

type AnalyticsPerformance={
  matched?:boolean;
  summary?:{activeUsers?:number;sessions?:number;views?:number;keyEvents?:number;transactions?:number;totalRevenue?:number};
  traffic?:Array<{channel?:string;sessions?:number;activeUsers?:number;keyEvents?:number;totalRevenue?:number}>;
  landingPages?:Array<{page?:string;sessions?:number;activeUsers?:number;keyEvents?:number;totalRevenue?:number}>;
};
type SearchConsolePerformance={
  summary?:{clicks?:number;impressions?:number;ctr?:number;position?:number};
  pages?:Array<{keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number}>;
};
type MerchantCommerce={
  matched?:boolean;
  summary?:{totalProducts?:number;approved?:number;pending?:number;disapproved?:number;withIssues?:number;accountIssues?:number;criticalIssues?:number;errorIssues?:number};
};

function n(v:unknown){const x=Number(v??0);return Number.isFinite(x)?x:0}

export async function getGrowthIntelligence(projectId:string){
  const [alerts,recommendations]=await Promise.all([
    pool.query("select id,title,message,severity,status,payload,created_at from alerts where project_id=$1 and source='growth_intelligence' and status='open' order by created_at desc limit 20",[projectId]),
    pool.query("select id,title,rationale,priority,status,proposed_action,created_at from recommendations where project_id=$1 and source='growth_intelligence' and status='proposed' order by created_at desc limit 20",[projectId])
  ]);
  return {alerts:alerts.rows,recommendations:recommendations.rows,counts:{alerts:alerts.rows.length,recommendations:recommendations.rows.length}};
}

export async function refreshGrowthIntelligence(projectId:string){
  const project=await pool.query('select id,domain from projects where id=$1',[projectId]);
  if(!project.rows[0])throw new Error('Proje bulunamadı.');

  const [google,ads,targets]=await Promise.all([
    discoverGoogleResources(projectId),
    pool.query("select coalesce(sum(spend),0)::numeric spend,coalesce(sum(clicks),0)::numeric clicks,coalesce(sum(conversions),0)::numeric conversions,coalesce(sum(attributed_revenue),0)::numeric revenue from campaign_metrics where project_id=$1 and metric_date>=current_date-interval '30 days'",[projectId]),
    pool.query('select target_roas,target_cpa,break_even_roas from business_targets where project_id=$1',[projectId])
  ]);

  const analytics=(google.analyticsPerformance||{}) as AnalyticsPerformance;
  const search=(google.searchConsole||{}) as SearchConsolePerformance;
  const merchant=(google.merchantCommerce||{}) as MerchantCommerce;
  const ad=ads.rows[0]||{};
  const target=targets.rows[0]||{};
  const spend=n(ad.spend), clicks=n(ad.clicks), conversions=n(ad.conversions), revenue=n(ad.revenue);
  const roas=spend>0?revenue/spend:null;
  const targetRoas=n(target.target_roas);
  const targetCpa=n(target.target_cpa);

  const alerts:AlertDraft[]=[];
  const recommendations:RecommendationDraft[]=[];
  const ga=analytics.summary||{};

  if(analytics.matched&&n(ga.sessions)>0&&n(ga.keyEvents)===0){
    alerts.push({severity:'high',title:'GA4 dönüşüm sinyali yok',message:`Son 28 günde ${n(ga.sessions)} oturum var ancak key event görünmüyor. Karar motoru dönüşüm kalitesini güvenilir ölçemez.`,payload:{source:'ga4',sessions:n(ga.sessions),keyEvents:n(ga.keyEvents)}});
    recommendations.push({priority:'high',title:'GA4 key event kurulumunu tamamla',rationale:'Trafik var fakat dönüşüm sinyali yok. Form, WhatsApp, telefon ve teklif aksiyonları key event olarak tanımlanmalı.',action:{type:'measurement_fix',source:'ga4',readOnly:true,recommendation:'Öncelikli dönüşüm eventlerini tanımla ve doğrula.'}});
  }

  if(spend>0&&clicks>0&&analytics.matched&&n(ga.sessions)===0){
    alerts.push({severity:'high',title:'Ads trafiği ile GA4 arasında ölçüm kopukluğu',message:`Reklam tarafında ${clicks} tıklama ve harcama var, GA4 oturumu görünmüyor. Landing page veya tagging zincirini kontrol et.`,payload:{source:'cross_channel',spend,clicks,ga4Sessions:n(ga.sessions)}});
  }

  if(targetRoas>0&&roas!==null&&roas<targetRoas*0.7){
    alerts.push({severity:'high',title:'30 günlük ROAS hedefin altında',message:`Gerçekleşen ROAS ${roas.toFixed(2)}, hedef ${targetRoas.toFixed(2)}.`,payload:{source:'ads',spend,revenue,roas,targetRoas}});
    recommendations.push({priority:'high',title:'Düşük ROAS kaynaklarını daralt',rationale:'Bütçe hedefin belirgin altında geri dönüş üretiyor. Kampanya, landing page ve ürün marjı birlikte incelenmeli.',action:{type:'review_low_roas',source:'cross_channel',readOnly:true,recommendation:'Kampanya bazlı ROAS, GA4 landing page ve stok/marj verisini birlikte kontrol et.'}});
  }

  if(targetCpa>0&&conversions>0){
    const cpa=spend/conversions;
    if(cpa>targetCpa*1.25)alerts.push({severity:'high',title:'Toplam CPA hedefin üzerinde',message:`30 günlük CPA ${cpa.toFixed(2)}, hedef ${targetCpa.toFixed(2)}.`,payload:{source:'ads',cpa,targetCpa,spend,conversions}});
  }

  const sc=(search.summary||{});
  if(n(sc.impressions)>=100&&n(sc.ctr)<0.015){
    alerts.push({severity:'medium',title:'Organik görünürlük var, CTR zayıf',message:`Search Console ${n(sc.impressions)} gösterim ve %${(n(sc.ctr)*100).toFixed(2)} CTR gösteriyor. Başlık ve açıklama fırsatı var.`,payload:{source:'search_console',impressions:n(sc.impressions),clicks:n(sc.clicks),ctr:n(sc.ctr),position:n(sc.position)}});
    recommendations.push({priority:'medium',title:'Yüksek gösterimli düşük CTR sayfalarını optimize et',rationale:'Arama görünürlüğü tıklamaya yeterince dönüşmüyor.',action:{type:'seo_ctr_optimization',source:'search_console',readOnly:true,recommendation:'İlk olarak yüksek gösterim alan sorgu ve landing page başlıklarını iyileştir.'}});
  }

  const ms=merchant.summary||{};
  if(merchant.matched&&n(ms.disapproved)>0){
    alerts.push({severity:'high',title:'Merchant Center reddedilen ürünler var',message:`${n(ms.disapproved)} ürün reddedilmiş durumda. Shopping görünürlüğü ve kampanya kapsamı etkilenebilir.`,payload:{source:'merchant',disapproved:n(ms.disapproved),totalProducts:n(ms.totalProducts),withIssues:n(ms.withIssues)}});
    recommendations.push({priority:'high',title:'Merchant reddedilen ürünleri temizle',rationale:'Reddedilen ürünler reklam envanterini doğrudan daraltır.',action:{type:'merchant_fix',source:'merchant',readOnly:true,recommendation:'Ürün veri sorunlarını önem sırasına göre düzelt ve yeniden doğrula.'}});
  }else if(merchant.matched&&n(ms.withIssues)>0){
    recommendations.push({priority:'medium',title:'Merchant ürün sorunlarını azalt',rationale:`${n(ms.withIssues)} üründe veri sorunu bulunuyor.`,action:{type:'merchant_quality',source:'merchant',readOnly:true,recommendation:'Feed kalite sorunlarını fiyat, stok, GTIN ve görsel alanlarına göre sırala.'}});
  }

  const client=await pool.connect();
  try{
    await client.query('begin');
    await client.query("update alerts set status='resolved',resolved_at=now() where project_id=$1 and source='growth_intelligence' and status='open'",[projectId]);
    await client.query("update recommendations set status='superseded',decided_at=now() where project_id=$1 and source='growth_intelligence' and status='proposed'",[projectId]);
    for(const alert of alerts){
      await client.query("insert into alerts(project_id,source,severity,title,message,status,payload) values($1,'growth_intelligence',$2,$3,$4,'open',$5)",[projectId,alert.severity,alert.title,alert.message,alert.payload]);
    }
    for(const rec of recommendations){
      await client.query("insert into recommendations(project_id,source,priority,title,rationale,proposed_action,status) values($1,'growth_intelligence',$2,$3,$4,$5,'proposed')",[projectId,rec.priority,rec.title,rec.rationale,rec.action]);
    }
    await client.query('commit');
  }catch(error){await client.query('rollback');throw error}finally{client.release()}

  return {
    generatedAt:new Date().toISOString(),
    domain:project.rows[0].domain,
    counts:{alerts:alerts.length,recommendations:recommendations.length},
    signals:{ads:{spend,revenue,clicks,conversions,roas},ga4:ga,searchConsole:sc,merchant:ms},
    errors:google.errors||{},
    alerts,
    recommendations
  };
}
