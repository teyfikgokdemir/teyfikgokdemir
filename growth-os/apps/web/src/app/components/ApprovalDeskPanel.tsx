'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Risk='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
type Impact='LOW'|'MEDIUM'|'HIGH';
type Effort='LOW'|'MEDIUM'|'HIGH';
type Confidence='LOW'|'MEDIUM'|'HIGH';
type Triage={risk:Risk;impact:Impact;effort:Effort;confidence:Confidence;score:number;label:string;modelVersion?:string};
type BusinessImpact={monthlyLow:number;monthlyHigh:number;currency:'TRY';confidence:Confidence;basis:string;modelVersion?:string};
type Recommendation={
  id:string;
  title:string;
  rationale:string;
  priority:string;
  status:string;
  source:string;
  proposed_action?:{recommendation?:string;type?:string;issueKey?:string;decision?:Triage;businessImpact?:BusinessImpact};
  created_at?:string;
};
type Action={id:string;recommendation_id?:string|null;action_type:string;status:string;provider?:string;approved_by?:string;created_at?:string};
type Job={id:string;recommendation_id?:string|null;status:string;provider:string;action_type:string;recommendation_title?:string|null;recommendation_priority?:string|null;created_at?:string;error_message?:string|null};
type Center={jobs:Job[];externalExecution?:boolean};

const api='/api/growth';
const money=(value:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value||0);

function riskFor(rec:Recommendation):Risk{
  const type=(rec.proposed_action?.type||'').toLowerCase();
  const source=rec.source.toLowerCase();
  if(type.includes('budget')||type.includes('campaign')||type.includes('publish')||['google_ads','meta_ads','tiktok_ads'].includes(source))return 'CRITICAL';
  if(type.includes('merchant')||type.includes('feed')||source.includes('commerce'))return 'HIGH';
  if(type==='site_fix'||type==='code_change'||source==='audit_engine'||source==='github')return 'MEDIUM';
  return 'LOW';
}

function triageFor(rec:Recommendation):Triage{
  if(rec.proposed_action?.decision?.modelVersion==='decision-v1')return rec.proposed_action.decision;

  const risk=riskFor(rec);
  const type=(rec.proposed_action?.type||'manual_review').toLowerCase();
  const text=`${rec.title} ${rec.rationale} ${rec.proposed_action?.recommendation||''}`.toLowerCase();
  const priority=(rec.priority||'').toLowerCase();

  let impact:Impact='MEDIUM';
  if(priority==='critical'||priority==='high'||text.includes('conversion')||text.includes('dönüşüm')||text.includes('revenue')||text.includes('ciro')||text.includes('tracking')||text.includes('ölçüm')||text.includes('index')||text.includes('merchant'))impact='HIGH';
  else if(priority==='low'||text.includes('cosmetic')||text.includes('minor'))impact='LOW';

  let effort:Effort='MEDIUM';
  if(type==='site_fix'||type==='code_change'||type.includes('tracking')||type.includes('schema')||type.includes('measurement'))effort='LOW';
  if(type.includes('feed')||type.includes('merchant')||type.includes('campaign')||type.includes('budget'))effort='HIGH';

  let confidence:Confidence='MEDIUM';
  if(rec.source==='audit_engine'||rec.source==='growth_intelligence'||rec.proposed_action?.issueKey)confidence='HIGH';
  if(rec.source==='manual'||type==='manual_review')confidence='LOW';

  const impactWeight:Record<Impact,number>={LOW:1,MEDIUM:2,HIGH:3};
  const effortWeight:Record<Effort,number>={LOW:3,MEDIUM:2,HIGH:1};
  const confidenceWeight:Record<Confidence,number>={LOW:1,MEDIUM:2,HIGH:3};
  const riskWeight:Record<Risk,number>={LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4};
  const raw=impactWeight[impact]*35+effortWeight[effort]*20+confidenceWeight[confidence]*25+riskWeight[risk]*5;
  const score=Math.max(1,Math.min(100,Math.round(raw/2.8)));
  const label=score>=80?'HEMEN':score>=65?'YÜKSEK':score>=45?'ORTA':'BEKLEYEBİLİR';
  return {risk,impact,effort,confidence,score,label,modelVersion:'ui-fallback'};
}

export default function ApprovalDeskPanel({projectId,onApproved}:{projectId:string|null;onApproved?:()=>void}){
  const [recommendations,setRecommendations]=useState<Recommendation[]>([]);
  const [actions,setActions]=useState<Action[]>([]);
  const [center,setCenter]=useState<Center|null>(null);
  const [loading,setLoading]=useState(false);
  const [approving,setApproving]=useState<string|null>(null);
  const [error,setError]=useState('');
  const loadGeneration=useRef(0);

  async function load(id:string|null=projectId,generation=loadGeneration.current){
    if(!id||generation!==loadGeneration.current)return;
    setLoading(true);setError('');
    try{
      const [r,a,e]=await Promise.all([
        fetch(`${api}/projects/${id}/recommendations`,{cache:'no-store'}),
        fetch(`${api}/projects/${id}/actions`,{cache:'no-store'}),
        fetch(`${api}/projects/${id}/execution-center`,{cache:'no-store'})
      ]);
      if(generation!==loadGeneration.current)return;
      if(!r.ok)throw new Error('Recommendation kuyruğu okunamadı.');
      const nextRecommendations=await r.json() as Recommendation[];
      const nextActions=a.ok?await a.json() as Action[]:[];
      const nextCenter=e.ok?await e.json() as Center:null;
      if(generation!==loadGeneration.current)return;
      setRecommendations(nextRecommendations);
      setActions(nextActions);
      setCenter(nextCenter);
    }catch(err){
      if(generation===loadGeneration.current)setError(err instanceof Error?err.message:'Approval Desk yüklenemedi.');
    }finally{
      if(generation===loadGeneration.current)setLoading(false);
    }
  }

  useEffect(()=>{
    const generation=++loadGeneration.current;
    setRecommendations([]);setActions([]);setCenter(null);setApproving(null);setError('');
    if(!projectId){setLoading(false);return;}
    void load(projectId,generation);
  },[projectId]);

  const proposed=useMemo(()=>recommendations.filter(r=>r.status==='proposed').sort((a,b)=>{
    const scoreDelta=triageFor(b).score-triageFor(a).score;
    if(scoreDelta!==0)return scoreDelta;
    return (b.proposed_action?.businessImpact?.monthlyHigh||0)-(a.proposed_action?.businessImpact?.monthlyHigh||0);
  }),[recommendations]);
  const approved=recommendations.filter(r=>r.status==='approved').length;
  const executed=recommendations.filter(r=>r.status==='executed').length;
  const urgent=proposed.filter(r=>triageFor(r).score>=80).length;
  const backendScored=proposed.filter(r=>r.proposed_action?.decision?.modelVersion==='decision-v1').length;
  const impactScored=proposed.filter(r=>r.proposed_action?.businessImpact?.modelVersion==='impact-v1').length;
  const potentialHigh=proposed.reduce((sum,r)=>sum+(r.proposed_action?.businessImpact?.monthlyHigh||0),0);
  const jobByRec=useMemo(()=>new Map((center?.jobs||[]).filter(j=>j.recommendation_id).map(j=>[j.recommendation_id as string,j])),[center]);

  async function approve(id:string){
    if(!projectId||approving)return;
    const targetProjectId=projectId;
    const generation=loadGeneration.current;
    setApproving(id);setError('');
    try{
      const res=await fetch(`${api}/recommendations/${id}/approve`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({})});
      const payload=await res.json();
      if(generation!==loadGeneration.current)return;
      if(!res.ok)throw new Error(payload?.error||'Öneri onaylanamadı.');
      await load(targetProjectId,generation);
      if(generation===loadGeneration.current)onApproved?.();
    }catch(err){
      if(generation===loadGeneration.current)setError(err instanceof Error?err.message:'Öneri onaylanamadı.');
    }finally{
      if(generation===loadGeneration.current)setApproving(null);
    }
  }

  if(!projectId)return <div className="empty">Approval Desk için aktif proje seç.</div>;

  return <div className="moduleStack">
    <section className="moduleHero">
      <div><p className="eyebrow">Approval Desk · Decision Gate</p><h2>{proposed.length?`${proposed.length} karar ticari etkiye göre sıralandı`:'Onay kuyruğu temiz'}</h2><p>Decision Score artık gerçek reklam, gelir, GA4, Search Console ve Merchant sinyallerinden türetilen aylık fırsat bandıyla birlikte okunur.</p></div>
      <div className="finalStats"><div><strong>{urgent}</strong><span>Hemen</span></div><div><strong>{proposed.length}</strong><span>Bekliyor</span></div><div><strong>{backendScored}</strong><span>Decision-v1</span></div><div><strong>{impactScored}</strong><span>Impact-v1</span></div><div><strong>{potentialHigh>0?money(potentialHigh):'—'}</strong><span>Üst Fırsat Bandı</span></div></div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Prioritized Decision Queue</p><h2>Recommendations</h2></div><button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Yenile'}</button></div>
      {error&&<div className="error">{error}</div>}
      {proposed.length===0?<div className="empty"><b>Onay bekleyen öneri yok.</b> Yeni audit ve Growth Intelligence sinyalleri burada karar kartına dönüşür.</div>:<div className="recommendationList">
        {proposed.map(rec=>{
          const triage=triageFor(rec);const job=jobByRec.get(rec.id);const impact=rec.proposed_action?.businessImpact;
          return <article key={rec.id}>
            <div className="recPriority">{triage.label} · {triage.score}</div>
            <div>
              <strong>{rec.title}</strong>
              <p>{rec.proposed_action?.recommendation||rec.rationale}</p>
              <span>Impact: {triage.impact} · Effort: {triage.effort} · Confidence: {triage.confidence} · Risk: {triage.risk}</span>
              {impact&&<span>Tahmini aylık fırsat: {money(impact.monthlyLow)} – {money(impact.monthlyHigh)} · Güven: {impact.confidence} · {impact.modelVersion||'impact'}</span>}
              {impact?.basis&&<span>Dayanak: {impact.basis}</span>}
              <span>Scoring: {triage.modelVersion==='decision-v1'?'backend · decision-v1':'UI fallback · eski kayıt'}</span>
              <span>{rec.source} · {rec.proposed_action?.type||'manual_review'}{rec.created_at?` · ${new Date(rec.created_at).toLocaleString('tr-TR')}`:''}</span>
              <span>Execution: {job?.status||'onay sonrası oluşturulacak'} · External write: {center?.externalExecution?'açık':'kapalı'}</span>
            </div>
            <button onClick={()=>approve(rec.id)} disabled={approving===rec.id}>{approving===rec.id?'Onaylanıyor…':'Onayla'}</button>
          </article>
        })}
      </div>}
      <div className="moduleFoot">Impact-v1 bir tahmin modelidir; fırsatı tek sayı yerine aralık ve güven seviyesiyle gösterir. Bu değer gerçekleşmiş gelir değildir. Decision-v1 öncelik, impact-v1 ise ticari bağlam sağlar.</div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Approval & Execution History</p><h2>Karar geçmişi</h2></div><span>{actions.length} kayıt</span></div>
      {actions.length===0?<div className="mutedEmpty">Henüz onaylanmış aksiyon yok.</div>:<div className="actionLog">{actions.slice(0,25).map(action=>{const job=action.recommendation_id?jobByRec.get(action.recommendation_id):undefined;return <article key={action.id}><span>{action.action_type}</span><strong>{job?.status||action.status}</strong><small>{action.provider||'system'} · {action.approved_by||'—'}{action.created_at?` · ${new Date(action.created_at).toLocaleString('tr-TR')}`:''}</small></article>})}</div>}
    </section>
  </div>;
}
