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
const api='/api/growth';

function riskFor(rec:Recommendation):Risk{
  const type=(rec.proposed_action?.type||'').toLowerCase();
  const source=rec.source.toLowerCase();
  if(type.includes('budget')||type.includes('campaign')||type.includes('publish')||['google_ads','meta_ads','tiktok_ads'].includes(source))return 'CRITICAL';
  if(type.includes('merchant')||type.includes('feed')||source.includes('commerce'))return 'HIGH';
  if(type==='site_fix'||type==='code_change'||source==='audit_engine'||source==='github')return 'MEDIUM';
  return 'LOW';
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

  const proposed=useMemo(()=>recommendations.filter(r=>r.status==='proposed').sort((a,b)=>{
    const w:Record<Risk,number>={CRITICAL:4,HIGH:3,MEDIUM:2,LOW:1};
    return w[riskFor(b)]-w[riskFor(a)];
  }),[recommendations]);
  const approved=recommendations.filter(r=>r.status==='approved').length;
  const executed=recommendations.filter(r=>r.status==='executed').length;
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
      <div><p className="eyebrow">Approval Desk · Decision Gate</p><h2>{proposed.length?`${proposed.length} karar onay bekliyor`:'Onay kuyruğu temiz'}</h2><p>Risk, önerilen aksiyon, kaynak ve execution durumunu tek noktadan yönet.</p></div>
      <div className="finalStats"><div><strong>{proposed.length}</strong><span>Bekliyor</span></div><div><strong>{approved}</strong><span>Onaylandı</span></div><div><strong>{executed}</strong><span>Doğrulandı</span></div></div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Decision Queue</p><h2>Recommendations</h2></div><button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Yenile'}</button></div>
      {error&&<div className="error">{error}</div>}
      {proposed.length===0?<div className="empty"><b>Onay bekleyen öneri yok.</b> Yeni audit ve Growth Intelligence sinyalleri burada karar kartına dönüşür.</div>:<div className="recommendationList">
        {proposed.map(rec=>{
          const risk=riskFor(rec);const job=jobByRec.get(rec.id);
          return <article key={rec.id}>
            <div className="recPriority">{risk}</div>
            <div>
              <strong>{rec.title}</strong>
              <p>{rec.proposed_action?.recommendation||rec.rationale}</p>
              <span>{rec.source} · {rec.proposed_action?.type||'manual_review'}{rec.created_at?` · ${new Date(rec.created_at).toLocaleString('tr-TR')}`:''}</span>
              <span>Execution: {job?.status||'onay sonrası oluşturulacak'} · External write: {center?.externalExecution?'açık':'kapalı'}</span>
            </div>
            <button onClick={()=>approve(rec.id)} disabled={approving===rec.id}>{approving===rec.id?'Onaylanıyor…':'Onayla'}</button>
          </article>
        })}
      </div>}
      <div className="moduleFoot">Onay, dış sistemde değişiklik yapmak anlamına gelmez. Onaylanan öneri execution job olarak kuyruğa alınır; provider write gate ayrıca kontrol edilir.</div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Approval & Execution History</p><h2>Karar geçmişi</h2></div><span>{actions.length} kayıt</span></div>
      {actions.length===0?<div className="mutedEmpty">Henüz onaylanmış aksiyon yok.</div>:<div className="actionLog">{actions.slice(0,25).map(action=>{const job=action.recommendation_id?jobByRec.get(action.recommendation_id):undefined;return <article key={action.id}><span>{action.action_type}</span><strong>{job?.status||action.status}</strong><small>{action.provider||'system'} · {action.approved_by||'—'}{action.created_at?` · ${new Date(action.created_at).toLocaleString('tr-TR')}`:''}</small></article>})}</div>}
    </section>
  </div>;
}
