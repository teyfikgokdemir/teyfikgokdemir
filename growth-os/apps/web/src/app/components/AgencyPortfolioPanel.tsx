'use client';

import { useEffect, useMemo, useState } from 'react';

type Project={id:string;name:string;domain:string};
type Overview={latestAudit?:{overall_score?:number}|null;openAlerts?:number;pendingRecommendations?:number;metrics30d?:{spend?:number;revenue?:number;grossProfit?:number;roas?:number|null}};
type Recommendation={status:string;priority?:string;proposed_action?:{decision?:{score?:number;label?:string};businessImpact?:{monthlyLow?:number;monthlyHigh?:number;currency?:string;confidence?:string}}};
type ExecutionCenter={counts?:{queued?:number;in_progress?:number;verification_pending?:number;verified?:number;failed?:number}};
type PortfolioRow={project:Project;overview:Overview;recommendations:Recommendation[];execution:ExecutionCenter};

const api='/api/growth';
const money=(value:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value||0);
const n=(value:unknown)=>{const parsed=Number(value??0);return Number.isFinite(parsed)?parsed:0};

export default function AgencyPortfolioPanel(){
  const [rows,setRows]=useState<PortfolioRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function load(){
    setLoading(true);setError('');
    try{
      const projectsResponse=await fetch(`${api}/projects`,{cache:'no-store'});
      if(!projectsResponse.ok)throw new Error('Ajans portföyü okunamadı.');
      const projects=(await projectsResponse.json()) as Project[];
      const result=await Promise.all(projects.slice(0,50).map(async project=>{
        const [overviewRes,recommendationsRes,executionRes]=await Promise.all([
          fetch(`${api}/projects/${project.id}/overview`,{cache:'no-store'}),
          fetch(`${api}/projects/${project.id}/recommendations`,{cache:'no-store'}),
          fetch(`${api}/projects/${project.id}/execution-center`,{cache:'no-store'})
        ]);
        return {
          project,
          overview:overviewRes.ok?await overviewRes.json():{},
          recommendations:recommendationsRes.ok?await recommendationsRes.json():[],
          execution:executionRes.ok?await executionRes.json():{}
        } as PortfolioRow;
      }));
      setRows(result);
    }catch(err){setError(err instanceof Error?err.message:'Ajans portföyü yüklenemedi.');}
    finally{setLoading(false)}
  }

  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),30000);return()=>window.clearInterval(timer)},[]);

  const ranked=useMemo(()=>rows.map(row=>{
    const proposed=row.recommendations.filter(r=>r.status==='proposed');
    const opportunityLow=proposed.reduce((sum,r)=>sum+n(r.proposed_action?.businessImpact?.monthlyLow),0);
    const opportunityHigh=proposed.reduce((sum,r)=>sum+n(r.proposed_action?.businessImpact?.monthlyHigh),0);
    const topDecision=Math.max(0,...proposed.map(r=>n(r.proposed_action?.decision?.score)));
    const critical=proposed.filter(r=>String(r.priority||'').toLowerCase()==='critical'||String(r.priority||'').toLowerCase()==='high').length;
    const executionWaiting=n(row.execution.counts?.queued)+n(row.execution.counts?.in_progress)+n(row.execution.counts?.verification_pending);
    const audit=n(row.overview.latestAudit?.overall_score);
    const attentionScore=Math.min(100,Math.round(topDecision*0.5+critical*12+Math.min(25,opportunityHigh/10000)+Math.max(0,80-audit)*0.25));
    return {...row,proposed,opportunityLow,opportunityHigh,topDecision,critical,executionWaiting,audit,attentionScore};
  }).sort((a,b)=>b.attentionScore-a.attentionScore),[rows]);

  const totals=useMemo(()=>({
    projects:ranked.length,
    opportunityLow:ranked.reduce((s,r)=>s+r.opportunityLow,0),
    opportunityHigh:ranked.reduce((s,r)=>s+r.opportunityHigh,0),
    pending:ranked.reduce((s,r)=>s+r.proposed.length,0),
    critical:ranked.reduce((s,r)=>s+r.critical,0),
    executionWaiting:ranked.reduce((s,r)=>s+r.executionWaiting,0)
  }),[ranked]);

  return <section className="moduleCard">
    <div className="reportHead compact">
      <div><p className="eyebrow">Agency Portfolio Intelligence</p><h2>Bugün hangi müşteriye müdahale etmeliyiz?</h2><p>Tüm projeler; risk, fırsat, karar skoru ve execution yüküne göre tek portföy görünümünde sıralanır.</p></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <a className="primaryAction" href="/agency/clients" style={{textDecoration:'none',display:'inline-flex',alignItems:'center'}}>Müşteri Yönetimi</a>
        <button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Güncelleniyor…':'Portföyü Yenile'}</button>
      </div>
    </div>

    <div className="readinessChecklist">
      <div><span>Proje</span><b>{totals.projects}</b></div>
      <div><span>Bekleyen Karar</span><b>{totals.pending}</b></div>
      <div><span>Kritik/Yüksek</span><b>{totals.critical}</b></div>
      <div><span>Execution Hattı</span><b>{totals.executionWaiting}</b></div>
      <div><span>Aylık Fırsat Alt</span><b>{money(totals.opportunityLow)}</b></div>
      <div><span>Aylık Fırsat Üst</span><b>{money(totals.opportunityHigh)}</b></div>
    </div>

    {error&&<div className="error">{error}</div>}
    {ranked.length===0&&!loading?<div className="empty">Henüz portföy verisi yok.</div>:<div className="recommendationList">
      {ranked.map((row,index)=><article key={row.project.id}>
        <div className="recPriority">#{index+1} · {row.attentionScore}</div>
        <div>
          <strong>{row.project.name}</strong>
          <p>{row.project.domain} · Audit {row.audit||'—'} · ROAS {row.overview.metrics30d?.roas==null?'—':Number(row.overview.metrics30d.roas).toFixed(2)}</p>
          <span>Bekleyen karar: {row.proposed.length} · Kritik/Yüksek: {row.critical} · Execution: {row.executionWaiting} · En yüksek karar skoru: {row.topDecision||'—'}</span>
          <span>Tahmini aylık fırsat: {money(row.opportunityLow)} – {money(row.opportunityHigh)}</span>
        </div>
      </article>)}
    </div>}

    <div className="moduleFoot">Attention Score müşteri önceliğini; karar skoru, açık yüksek öncelikli işler, audit açığı ve tahmini ticari fırsatı birlikte kullanarak sıralar. Bu görünüm ajans operasyon planlaması içindir.</div>
  </section>;
}
