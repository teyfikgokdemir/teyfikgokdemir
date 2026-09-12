'use client';

import { useEffect, useMemo, useState } from 'react';

type Recommendation={
  id:string;
  title:string;
  rationale:string;
  priority:string;
  status:string;
  source:string;
  proposed_action?:{recommendation?:string;type?:string;issueKey?:string};
  created_at?:string;
};
type Action={id:string;recommendation_id?:string|null;action_type:string;status:string;provider?:string;approved_by?:string;created_at?:string};
type Job={id:string;recommendation_id?:string|null;status:string;provider:string;action_type:string;recommendation_title?:string|null;recommendation_priority?:string|null;created_at?:string;error_message?:string|null};
type Center={jobs:Job[];externalExecution?:boolean};

type Risk='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
type Impact='LOW'|'MEDIUM'|'HIGH';
type Effort='LOW'|'MEDIUM'|'HIGH';
type Confidence='LOW'|'MEDIUM'|'HIGH';
type Triage={risk:Risk;impact:Impact;effort:Effort;confidence:Confidence;score:number;label:string};
const api='/api/growth';

function riskFor(rec:Recommendation):Risk{
  const type=(rec.proposed_action?.type||'').toLowerCase();
  const source=rec.source.toLowerCase();
  if(type.includes('budget')||type.includes('campaign')||type.includes('publish')||['google_ads','meta_ads','tiktok_ads'].includes(source))return 'CRITICAL';
  if(type.includes('merchant')||type.includes('feed')||source.includes('commerce'))return 'HIGH';
  if(type==='site_fix'||type==='code_change'||source==='audit_engine'||source==='github')return 'MEDIUM';
  return 'LOW';
}

function triageFor(rec:Recommendation):Triage{
  const risk=riskFor(rec);
  const type=(rec.proposed_action?.type||'manual_review').toLowerCase();
  const text=`${rec.title} ${rec.rationale} ${rec.proposed_action?.recommendation||''}`.toLowerCase();
  const priority=(rec.priority||'').toLowerCase();

  let impact:Impact='MEDIUM';
  if(priority==='critical'||priority==='high'||text.includes('conversion')||text.includes('revenue')||text.includes('ciro')||text.includes('tracking')||text.includes('index')||text.includes('merchant'))impact='HIGH';
  else if(priority==='low'||text.includes('cosmetic')||text.includes('minor'))impact='LOW';

  let effort:Effort='MEDIUM';
  if(type==='site_fix'||type==='code_change'||type.includes('tracking')||type.includes('schema'))effort='LOW';
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
  return {risk,impact,effort,confidence,score,label};
}

export default function ApprovalDeskPanel({projectId,onApproved}:{projectId:string|null;onApproved?:()=>void}){
  const [recommendations,setRecommendations]=useState<Recommendation[]>([]);
  const [actions,setActions]=useState<Action[]>([]);
  const [center,setCenter]=useState<Center|null>(null);
  const [loading,setLoading]=useState(false);
  const [approving,setApproving]=useState<string|null>(null);
  const [error,setError]=useState('');

  async function load(){
    if(!projectId)return;
    setLoading(true);setError('');
    try{
      const [r,a,e]=await Promise.all([
        fetch(`${api}/projects/${projectId}/recommendations`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/actions`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/execution-center`,{cache:'no-store'})
      ]);
      if(!r.ok)throw new Error('Recommendation kuyruğu okunamadı.');
      setRecommendations(await r.json());
      if(a.ok)setActions(await a.json());
      if(e.ok)setCenter(await e.json());
    }catch(err){setError(err instanceof Error?err.message:'Approval Desk yüklenemedi.');}
    finally{setLoading(false)}
  }

  useEffect(()=>{if(projectId)void load()},[projectId]);

  const proposed=useMemo(()=>recommendations.filter(r=>r.status==='proposed').sort((a,b)=>triageFor(b).score-triageFor(a).score),[recommendations]);
  const approved=recommendations.filter(r=>r.status==='approved').length;
  const executed=recommendations.filter(r=>r.status==='executed').length;
  const urgent=proposed.filter(r=>triageFor(r).score>=80).length;
  const jobByRec=useMemo(()=>new Map((center?.jobs||[]).filter(j=>j.recommendation_id).map(j=>[j.recommendation_id as string,j])),[center]);

  async function approve(id:string){
    if(approving)return;
    setApproving(id);setError('');
    try{
      const res=await fetch(`${api}/recommendations/${id}/approve`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({approvedBy:'teyfikgokdemir@outlook.com'})});
      const payload=await res.json();
      if(!res.ok)throw new Error(payload?.error||'Öneri onaylanamadı.');
      await load();
      onApproved?.();
    }catch(err){setError(err instanceof Error?err.message:'Öneri onaylanamadı.');}
    finally{setApproving(null)}
  }

  if(!projectId)return <div className="empty">Approval Desk için aktif proje seç.</div>;

  return <div className="moduleStack">
    <section className="moduleHero">
      <div><p className="eyebrow">Approval Desk · Decision Gate</p><h2>{proposed.length?`${proposed.length} karar önceliklendirildi`:'Onay kuyruğu temiz'}</h2><p>Revenue impact, effort, confidence ve execution risk birlikte puanlanır; en yüksek değerli işler üstte kalır.</p></div>
      <div className="finalStats"><div><strong>{urgent}</strong><span>Hemen</span></div><div><strong>{proposed.length}</strong><span>Bekliyor</span></div><div><strong>{approved}</strong><span>Onaylandı</span></div><div><strong>{executed}</strong><span>Doğrulandı</span></div></div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Prioritized Decision Queue</p><h2>Recommendations</h2></div><button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Yenile'}</button></div>
      {error&&<div className="error">{error}</div>}
      {proposed.length===0?<div className="empty"><b>Onay bekleyen öneri yok.</b> Yeni audit ve Growth Intelligence sinyalleri burada karar kartına dönüşür.</div>:<div className="recommendationList">
        {proposed.map(rec=>{
          const triage=triageFor(rec);const job=jobByRec.get(rec.id);
          return <article key={rec.id}>
            <div className="recPriority">{triage.label} · {triage.score}</div>
            <div>
              <strong>{rec.title}</strong>
              <p>{rec.proposed_action?.recommendation||rec.rationale}</p>
              <span>Impact: {triage.impact} · Effort: {triage.effort} · Confidence: {triage.confidence} · Risk: {triage.risk}</span>
              <span>{rec.source} · {rec.proposed_action?.type||'manual_review'}{rec.created_at?` · ${new Date(rec.created_at).toLocaleString('tr-TR')}`:''}</span>
              <span>Execution: {job?.status||'onay sonrası oluşturulacak'} · External write: {center?.externalExecution?'açık':'kapalı'}</span>
            </div>
            <button onClick={()=>approve(rec.id)} disabled={approving===rec.id}>{approving===rec.id?'Onaylanıyor…':'Onayla'}</button>
          </article>
        })}
      </div>}
      <div className="moduleFoot">Priority Score; tahmini iş etkisi, uygulama eforu, sinyal güveni ve execution riskinden türetilir. Onay dış sistemde değişiklik yapmak değildir; provider write gate ayrıca kontrol edilir.</div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Approval & Execution History</p><h2>Karar geçmişi</h2></div><span>{actions.length} kayıt</span></div>
      {actions.length===0?<div className="mutedEmpty">Henüz onaylanmış aksiyon yok.</div>:<div className="actionLog">{actions.slice(0,25).map(action=>{const job=action.recommendation_id?jobByRec.get(action.recommendation_id):undefined;return <article key={action.id}><span>{action.action_type}</span><strong>{job?.status||action.status}</strong><small>{action.provider||'system'} · {action.approved_by||'—'}{action.created_at?` · ${new Date(action.created_at).toLocaleString('tr-TR')}`:''}</small></article>})}</div>}
    </section>
  </div>;
}
