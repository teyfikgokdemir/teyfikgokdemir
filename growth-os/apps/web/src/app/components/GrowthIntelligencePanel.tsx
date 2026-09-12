'use client';

import { useEffect, useMemo, useState } from 'react';

type Metric={spend:string|number;clicks:string|number;conversions:string|number;attributed_revenue:string|number};
type Overview={targets?:{target_roas?:number|null;target_cpa?:number|null};metrics30d?:{spend?:number;revenue?:number;roas?:number|null}};
type GoogleResources={analyticsPerformance?:{matched?:boolean;summary?:{sessions?:number;keyEvents?:number;transactions?:number;totalRevenue?:number}};merchantCommerce?:{matched?:boolean;summary?:{totalProducts?:number;disapproved?:number;withIssues?:number;accountIssues?:number}};errors?:Record<string,string>};
type SearchData={summary?:{clicks?:number;impressions?:number;ctr?:number;position?:number}};
type Signal={severity:'high'|'medium'|'good';title:string;detail:string;action?:string;source:string};

const api='/api/growth';
const n=(v:unknown)=>Number(v||0);

export default function GrowthIntelligencePanel({projectId}:{projectId:string|null}){
  const [metrics,setMetrics]=useState<Metric[]>([]);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [google,setGoogle]=useState<GoogleResources|null>(null);
  const [search,setSearch]=useState<SearchData|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [updatedAt,setUpdatedAt]=useState<Date|null>(null);

  async function refresh(){
    if(!projectId)return;
    setLoading(true);setError('');
    try{
      const [m,o,g,s]=await Promise.all([
        fetch(`${api}/projects/${projectId}/metrics`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/overview`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/integrations/google/resources`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/search-console/performance?days=28`,{cache:'no-store'})
      ]);
      if(m.ok)setMetrics(await m.json());
      if(o.ok)setOverview(await o.json());
      if(g.ok)setGoogle(await g.json());
      if(s.ok)setSearch(await s.json());
      setUpdatedAt(new Date());
    }catch(e){setError(e instanceof Error?e.message:'Growth Intelligence verileri okunamadı.');}
    finally{setLoading(false)}
  }

  useEffect(()=>{setMetrics([]);setOverview(null);setGoogle(null);setSearch(null);void refresh()},[projectId]);

  const signals=useMemo<Signal[]>(()=>{
    const out:Signal[]=[];
    const spend=metrics.reduce((a,m)=>a+n(m.spend),0);
    const revenue=metrics.reduce((a,m)=>a+n(m.attributed_revenue),0);
    const clicks=metrics.reduce((a,m)=>a+n(m.clicks),0);
    const conversions=metrics.reduce((a,m)=>a+n(m.conversions),0);
    const roas=spend>0?revenue/spend:null;
    const targetRoas=n(overview?.targets?.target_roas);
    const targetCpa=n(overview?.targets?.target_cpa);
    const ga=google?.analyticsPerformance?.summary;
    const merchant=google?.merchantCommerce?.summary;
    const sc=search?.summary;

    if(google?.analyticsPerformance?.matched&&n(ga?.sessions)>0&&n(ga?.keyEvents)===0)out.push({severity:'high',source:'GA4',title:'Dönüşüm sinyali yok',detail:`${n(ga?.sessions)} oturum var ancak key event görünmüyor.`,action:'Form, WhatsApp, telefon ve teklif aksiyonlarını key event olarak doğrula.'});
    if(spend>0&&targetRoas>0&&roas!==null&&roas<targetRoas*.7)out.push({severity:'high',source:'Ads',title:'ROAS hedefin belirgin altında',detail:`30 günlük ROAS ${roas.toFixed(2)}, hedef ${targetRoas.toFixed(2)}.`,action:'Kampanya, landing page ve marjı birlikte incele.'});
    if(spend>0&&targetCpa>0&&conversions>0&&spend/conversions>targetCpa*1.25)out.push({severity:'high',source:'Ads',title:'CPA hedefin üzerinde',detail:`CPA ${(spend/conversions).toFixed(2)}, hedef ${targetCpa.toFixed(2)}.`,action:'Düşük kaliteli kampanya ve trafik kaynaklarını daralt.'});
    if(clicks>0&&google?.analyticsPerformance?.matched&&n(ga?.sessions)===0)out.push({severity:'high',source:'Ads + GA4',title:'Ölçüm zincirinde kopukluk',detail:`Reklam tarafında ${clicks} tıklama var fakat GA4 oturumu görünmüyor.`,action:'UTM, consent, tag ve landing page ölçümünü kontrol et.'});
    if(n(sc?.impressions)>=100&&n(sc?.ctr)<.015)out.push({severity:'medium',source:'Search Console',title:'Organik görünürlük tıklamaya dönüşmüyor',detail:`${n(sc?.impressions)} gösterim, %${(n(sc?.ctr)*100).toFixed(2)} CTR.`,action:'Yüksek gösterimli sorgu ve sayfalarda title/meta optimizasyonu yap.'});
    if(google?.merchantCommerce?.matched&&n(merchant?.disapproved)>0)out.push({severity:'high',source:'Merchant',title:'Reddedilen ürünler var',detail:`${n(merchant?.disapproved)} ürün reddedilmiş durumda.`,action:'Feed sorunlarını düzelt; Shopping envanterini geri kazan.'});
    else if(google?.merchantCommerce?.matched&&n(merchant?.withIssues)>0)out.push({severity:'medium',source:'Merchant',title:'Ürün feed kalitesi iyileştirilebilir',detail:`${n(merchant?.withIssues)} üründe veri sorunu var.`,action:'Fiyat, stok, GTIN ve görsel sorunlarını önem sırasına göre temizle.'});
    if(out.length===0)out.push({severity:'good',source:'Growth OS',title:'Kritik çapraz-kanal sinyal yok',detail:'Bağlı kaynaklarda mevcut eşiklere göre kritik bir çakışma görünmüyor.',action:'Verileri düzenli senkronize etmeye devam et.'});
    return out;
  },[metrics,overview,google,search]);

  if(!projectId)return <section className="moduleCard"><div className="empty">Growth Intelligence için proje seç.</div></section>;
  const high=signals.filter(s=>s.severity==='high').length;
  const medium=signals.filter(s=>s.severity==='medium').length;
  return <section className="moduleCard">
    <div className="reportHead compact"><div><p className="eyebrow">Cross-source Growth Intelligence</p><h2>Ne kaybediyoruz, neyi düzeltmeliyiz?</h2></div><button className="primaryAction" onClick={refresh} disabled={loading}>{loading?'Analiz ediliyor…':'Karar Motorunu Yenile'}</button></div>
    <div className="readinessChecklist"><div><span>Kritik sinyal</span><b>{high}</b></div><div><span>Orta öncelik</span><b>{medium}</b></div><div><span>Toplam karar</span><b>{signals.length}</b></div></div>
    {error&&<div className="error">{error}</div>}
    <div className="recommendationList">{signals.map((s,i)=><article key={`${s.source}-${i}`}><div className="recPriority">{s.severity==='good'?'OK':s.severity.toUpperCase()}</div><div><strong>{s.title}</strong><p>{s.detail}</p><span>{s.source}{s.action?` · ${s.action}`:''}</span></div></article>)}</div>
    <div className="moduleFoot">{updatedAt?`Son analiz: ${updatedAt.toLocaleString('tr-TR')}`:'Kaynaklar okunuyor…'} · Ads + GA4 + Search Console + Merchant birlikte değerlendirilir.</div>
  </section>;
}
