'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import styles from './portal.module.css';

type PortalData={
  client:{name?:string;domain?:string};
  user:{display_name?:string;email?:string;role?:string};
  branding?:{brand_name?:string;logo_url?:string;primary_color?:string;accent_color?:string;report_footer?:string}|null;
  projects:Array<{id:string;name:string;domain:string}>;
  summary?:{projectCount?:number;latestAudits?:Array<{overall_score?:number}>;pendingRecommendations?:number;verifiedResults?:number;metrics30d?:{spend?:number;revenue?:number;grossProfit?:number;conversions?:number;roas?:number|null}};
  recommendations:Array<{id:string;project_name?:string;priority?:string;title:string;rationale:string;status:string;proposed_action?:{decision?:{score?:number;label?:string};businessImpact?:{monthlyLow?:number;monthlyHigh?:number;confidence?:string}}}>;
  results:Array<{id:string;project_name?:string;verification_type?:string;score_delta?:number;verdict?:string}>;
  decisions:Array<{recommendation_id:string;decision:string}>;
};

const money=(value:unknown)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(value||0));
const num=(value:unknown,digits=1)=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:digits}).format(Number(value||0));

export default function ClientPortalPage(){
  const params=useParams<{workspaceId:string;clientId:string}>();
  const workspaceId=String(params?.workspaceId||'');
  const clientId=String(params?.clientId||'');
  const [data,setData]=useState<PortalData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<string|null>(null);

  const load=async()=>{
    if(!workspaceId||!clientId)return;
    setLoading(true);setError('');
    try{
      const response=await fetch(`/api/growth/workspaces/${workspaceId}/clients/${clientId}/portal`,{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Portal verisi okunamadı.');
      setData(payload);
    }catch(err){setError(err instanceof Error?err.message:'Portal verisi okunamadı.')}finally{setLoading(false)}
  };

  useEffect(()=>{void load()},[workspaceId,clientId]);

  const decisions=useMemo(()=>new Map((data?.decisions||[]).map(item=>[item.recommendation_id,item.decision])),[data?.decisions]);
  const auditAverage=useMemo(()=>{
    const rows=data?.summary?.latestAudits||[];
    return rows.length?Math.round(rows.reduce((sum,row)=>sum+Number(row.overall_score||0),0)/rows.length):null;
  },[data?.summary?.latestAudits]);

  const decide=async(recommendationId:string,decision:'approved'|'rejected')=>{
    setBusy(recommendationId);setError('');
    try{
      const response=await fetch(`/api/growth/workspaces/${workspaceId}/clients/${clientId}/portal/recommendations/${recommendationId}/decision`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({decision})});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Karar kaydedilemedi.');
      await load();
    }catch(err){setError(err instanceof Error?err.message:'Karar kaydedilemedi.')}finally{setBusy(null)}
  };

  if(loading)return <main className={styles.screen}><div className={styles.loading}><span/>Müşteri paneli hazırlanıyor…</div></main>;
  if(!data)return <main className={styles.screen}><div className={styles.access}><small>GROWTH OS CLIENT PORTAL</small><h1>Portal erişimi doğrulanamadı</h1><p>{error||'Bu bağlantı için erişim bulunamadı.'}</p></div></main>;

  const metrics=data.summary?.metrics30d||{};
  const brand=data.branding?.brand_name||'Growth OS';
  const canDecide=data.user?.role==='client_admin';
  const cssVars={'--portal-primary':data.branding?.primary_color||'#8b5cf6','--portal-accent':data.branding?.accent_color||'#c4b5fd'} as CSSProperties;

  return <main className={styles.screen} style={cssVars}>
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.brand}>
          {data.branding?.logo_url?<img src={data.branding.logo_url} alt={brand}/>:<div className={styles.mark}>{brand.slice(0,1).toUpperCase()}</div>}
          <div><small>Müşteri Portalı</small><strong>{brand}</strong></div>
        </div>
        <div className={styles.identity}><span>{data.user?.display_name||data.user?.email||'Müşteri'}</span><b>{data.client?.name||data.client?.domain}</b></div>
      </header>

      {error?<div className={styles.error}>{error}</div>:null}

      <section className={styles.hero}>
        <div><small>PERFORMANS MERKEZİ</small><h1>{data.client?.name||'Markanız'} için net büyüme görünümü.</h1><p>Performans, açık aksiyonlar ve doğrulanmış sonuçlar tek yerde. Teknik detay yerine iş etkisini görün.</p></div>
        <div className={styles.score}><span>Genel Audit</span><strong>{auditAverage??'—'}</strong><small>{auditAverage===null?'Henüz veri yok':'100 üzerinden'}</small></div>
      </section>

      <section className={styles.stats}>
        <article><span>30 Günlük Gelir</span><strong>{money(metrics.revenue)}</strong><small>ölçümlenen gelir</small></article>
        <article><span>Reklam Harcaması</span><strong>{money(metrics.spend)}</strong><small>son 30 gün</small></article>
        <article><span>ROAS</span><strong>{metrics.roas==null?'—':`${num(metrics.roas,2)}x`}</strong><small>ölçümlenen dönüş</small></article>
        <article><span>Açık Kararlar</span><strong>{Number(data.summary?.pendingRecommendations||0)}</strong><small>inceleme bekliyor</small></article>
        <article><span>Doğrulanmış Sonuç</span><strong>{Number(data.summary?.verifiedResults||0)}</strong><small>kanıtlandı</small></article>
      </section>

      <section className={styles.columns}>
        <div className={styles.panel}>
          <div className={styles.panelHead}><div><small>ONAY MERKEZİ</small><h2>Önerilen aksiyonlar</h2></div><span>{data.recommendations.length} kayıt</span></div>
          <div className={styles.list}>
            {data.recommendations.length===0?<div className={styles.empty}>Bekleyen öneri bulunmuyor.</div>:data.recommendations.map(rec=>{
              const decision=decisions.get(rec.id);
              const impact=rec.proposed_action?.businessImpact;
              return <article className={styles.rec} key={rec.id}>
                <div className={styles.recTop}><span>{rec.priority||'medium'}</span><small>{rec.project_name||'Proje'}</small></div>
                <h3>{rec.title}</h3><p>{rec.rationale}</p>
                <div className={styles.meta}>
                  <span>Decision Score <b>{rec.proposed_action?.decision?.score??'—'}</b></span>
                  <span>Aylık Fırsat <b>{impact?`${money(impact.monthlyLow)} – ${money(impact.monthlyHigh)}`:'—'}</b></span>
                  <span>Güven <b>{impact?.confidence||rec.proposed_action?.decision?.label||'—'}</b></span>
                </div>
                {decision?<div className={`${styles.state} ${decision==='approved'?styles.ok:styles.no}`}>{decision==='approved'?'Müşteri onayladı':'Müşteri reddetti'}</div>:canDecide?<div className={styles.actions}><button disabled={busy===rec.id} onClick={()=>void decide(rec.id,'approved')}>Onayla</button><button disabled={busy===rec.id} onClick={()=>void decide(rec.id,'rejected')}>Reddet</button></div>:<div className={styles.viewer}>Görüntüleme yetkisi · Karar vermek için client_admin rolü gerekir.</div>}
              </article>
            })}
          </div>
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelHead}><div><small>KANIT KATMANI</small><h2>Doğrulanmış sonuçlar</h2></div></div>
          <div className={styles.results}>{data.results.length===0?<div className={styles.empty}>Henüz doğrulanmış sonuç yok.</div>:data.results.map(result=><article key={result.id}><span>{result.project_name||result.verification_type||'Sonuç'}</span><strong>{result.verdict||'Doğrulama tamamlandı'}</strong><small>{result.score_delta==null?'Kanıtlandı':`Skor değişimi ${Number(result.score_delta)>0?'+':''}${num(result.score_delta)}`}</small></article>)}</div>
        </aside>
      </section>

      <footer className={styles.footer}>{data.branding?.report_footer||`${brand} · Growth OS tarafından desteklenir`}</footer>
    </div>
  </main>;
}
