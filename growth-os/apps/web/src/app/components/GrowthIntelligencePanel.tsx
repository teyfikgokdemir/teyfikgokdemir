'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Metric={spend:string|number;clicks:string|number;conversions:string|number;attributed_revenue:string|number};
type Overview={targets?:{target_roas?:number|null;target_cpa?:number|null};metrics30d?:{spend?:number;revenue?:number;roas?:number|null}};
type GoogleResources={analyticsPerformance?:{matched?:boolean;summary?:{sessions?:number;keyEvents?:number;transactions?:number;totalRevenue?:number}};merchantCommerce?:{matched?:boolean;summary?:{totalProducts?:number;disapproved?:number;withIssues?:number;accountIssues?:number}};errors?:Record<string,string>};
type SearchData={summary?:{clicks?:number;impressions?:number;ctr?:number;position?:number}};
type QueueRecommendation={source?:string;status?:string};
type Signal={severity:'high'|'medium'|'good';title:string;detail:string;action?:string;source:string};

const api='/api/growth';
const n=(v:unknown)=>Number(v||0);
const severityRank:Record<Signal['severity'],number>={high:3,medium:2,good:1};

export default function GrowthIntelligencePanel({projectId}:{projectId:string|null}){
  const [metrics,setMetrics]=useState<Metric[]>([]);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [google,setGoogle]=useState<GoogleResources|null>(null);
  const [search,setSearch]=useState<SearchData|null>(null);
  const [queueCount,setQueueCount]=useState(0);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [updatedAt,setUpdatedAt]=useState<Date|null>(null);
  const loadGeneration=useRef(0);

  async function refresh(id:string,generation=loadGeneration.current){
    if(generation!==loadGeneration.current)return;
    setLoading(true);setError('');
    try{
      const [m,o,g,s,r]=await Promise.all([
        fetch(`${api}/projects/${id}/metrics`,{cache:'no-store'}),
        fetch(`${api}/projects/${id}/overview`,{cache:'no-store'}),
        fetch(`${api}/projects/${id}/integrations/google/resources`,{cache:'no-store'}),
        fetch(`${api}/projects/${id}/search-console/performance?days=28`,{cache:'no-store'}),
        fetch(`${api}/projects/${id}/recommendations`,{cache:'no-store'})
      ]);
      const [nextMetrics,nextOverview,nextGoogle,nextSearch,nextRecommendations]=await Promise.all([
        m.ok?m.json() as Promise<Metric[]>:Promise.resolve(null),
        o.ok?o.json() as Promise<Overview>:Promise.resolve(null),
        g.ok?g.json() as Promise<GoogleResources>:Promise.resolve(null),
        s.ok?s.json() as Promise<SearchData>:Promise.resolve(null),
        r.ok?r.json() as Promise<QueueRecommendation[]>:Promise.resolve(null)
      ]);
      if(generation!==loadGeneration.current)return;
      if(nextMetrics)setMetrics(nextMetrics);
      if(nextOverview)setOverview(nextOverview);
      if(nextGoogle)setGoogle(nextGoogle);
      if(nextSearch)setSearch(nextSearch);
      if(nextRecommendations)setQueueCount(nextRecommendations.filter(x=>x.source==='growth_intelligence'&&x.status==='proposed').length);
      setUpdatedAt(new Date());
    }catch(e){
      if(generation===loadGeneration.current)setError(e instanceof Error?e.message:'Growth Intelligence verileri okunamadı.');
    }finally{
      if(generation===loadGeneration.current)setLoading(false);
    }
  }

  function refreshCurrent(){
    if(!projectId||loading)return;
    const generation=++loadGeneration.current;
    void refresh(projectId,generation);
  }

  function openRecommendations(){
    const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('aside.side nav button'));
    const target=buttons.find(button=>button.querySelector('span')?.textContent?.trim()==='Recommendations');
    target?.click();
  }

  useEffect(()=>{
    const generation=++loadGeneration.current;
    setMetrics([]);setOverview(null);setGoogle(null);setSearch(null);setQueueCount(0);setUpdatedAt(null);setError('');
    if(!projectId){setLoading(false);return;}
    void refresh(projectId,generation);
  },[projectId]);

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
    return out.sort((a,b)=>severityRank[b.severity]-severityRank[a.severity]);
  },[metrics,overview,google,search]);

  if(!projectId)return <section className="moduleCard"><div className="empty">Growth Intelligence için proje seç.</div></section>;
  if(loading&&!updatedAt&&!error)return <section className="moduleCard"><div className="moduleLoading"><span/> Growth Intelligence kaynakları analiz ediliyor…</div></section>;

  const high=signals.filter(s=>s.severity==='high').length;
  const medium=signals.filter(s=>s.severity==='medium').length;
  const primary=signals[0];
  const statusTitle=high>0?'Müdahale gerekli':medium>0?'Büyüme fırsatı var':'Kontrol altında';
  const statusDetail=high>0
    ?`${high} kritik sinyal önce çözülmeli. En yüksek öncelik: ${primary.title}.`
    :medium>0
      ?`${medium} optimizasyon fırsatı bulundu. En yüksek potansiyel: ${primary.title}.`
      :'Bağlı kaynaklarda kritik veya orta öncelikli çapraz-kanal sorun görünmüyor.';

  return <section className="moduleCard">
    <div className="reportHead compact">
      <div><p className="eyebrow">Growth Intelligence · Executive Decision</p><h2>{statusTitle}</h2><p>{statusDetail}</p></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'flex-end'}}>
        <button onClick={openRecommendations}>Recommendations{queueCount>0?` · ${queueCount}`:''}</button>
        <button className="primaryAction" onClick={refreshCurrent} disabled={loading}>{loading?'Analiz ediliyor…':'Karar Motorunu Yenile'}</button>
      </div>
    </div>

    <div className="readinessChecklist">
      <div><span>Kritik</span><b>{high}</b></div>
      <div><span>Fırsat</span><b>{medium}</b></div>
      <div><span>Onay kuyruğu</span><b>{queueCount}</b></div>
      <div><span>Toplam karar</span><b>{signals.length}</b></div>
    </div>

    {error&&<div className="error">{error}</div>}

    <div className="recommendationList">
      {signals.map((s,i)=><article key={`${s.source}-${i}`}>
        <div className="recPriority">{s.severity==='high'?'KRİTİK':s.severity==='medium'?'FIRSAT':'SAĞLIKLI'}</div>
        <div>
          <strong>{i===0&&s.severity!=='good'?'Öncelik 1 · ':''}{s.title}</strong>
          <p>{s.detail}</p>
          <span>{s.source}{s.action?` · Önerilen aksiyon: ${s.action}`:''}</span>
        </div>
      </article>)}
    </div>

    <div className="moduleFoot">{updatedAt?`Son analiz: ${updatedAt.toLocaleString('tr-TR')}`:'Kaynaklar okunuyor…'} · Growth Intelligence önerileri senkronizasyon sonrası Recommendations onay kuyruğunda tutulur.</div>
  </section>;
}
