'use client';

import { useEffect, useMemo, useState } from 'react';

type ActionRow={id:string;recommendation_id?:string;provider?:string;action_type:string;status:string;approved_by?:string;executed_at?:string;created_at?:string};
type Recommendation={id:string;title:string;priority:string;status:string;source:string;proposed_action?:{recommendation?:string}};

const api='/api/growth';
const labels:Record<string,string>={queued:'KUYRUKTA',in_progress:'UYGULANIYOR',verification_pending:'DOĞRULAMA',verified:'DOĞRULANDI',failed:'BAŞARISIZ',approved:'ONAYLANDI'};

export default function ExecutionCenterPanel({projectId}:{projectId:string|null}){
  const [actions,setActions]=useState<ActionRow[]>([]);
  const [recommendations,setRecommendations]=useState<Recommendation[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function load(){
    if(!projectId)return;
    setLoading(true);setError('');
    try{
      const [a,r]=await Promise.all([
        fetch(`${api}/projects/${projectId}/actions`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/recommendations`,{cache:'no-store'})
      ]);
      if(!a.ok)throw new Error('Execution kayıtları okunamadı.');
      setActions(await a.json());
      if(r.ok)setRecommendations(await r.json());
    }catch(e){setError(e instanceof Error?e.message:'Execution Center yüklenemedi.');}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    if(!projectId)return;
    void load();
    const timer=window.setInterval(()=>void load(),5000);
    return()=>window.clearInterval(timer);
  },[projectId]);

  const recById=useMemo(()=>new Map(recommendations.map(r=>[r.id,r])),[recommendations]);
  const counts=useMemo(()=>({
    queued:actions.filter(a=>a.status==='queued').length,
    running:actions.filter(a=>a.status==='in_progress').length,
    verify:actions.filter(a=>a.status==='verification_pending').length,
    verified:actions.filter(a=>a.status==='verified').length,
    failed:actions.filter(a=>a.status==='failed').length
  }),[actions]);

  if(!projectId)return null;

  return <section className="moduleCard">
    <div className="reportHead compact">
      <div><p className="eyebrow">Execution Center</p><h2>Onaydan doğrulamaya aksiyon akışı</h2><p>Approved → Queued → In Progress → Verification → Verified</p></div>
      <button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Akışı Yenile'}</button>
    </div>

    <div className="readinessChecklist">
      <div><span>Kuyrukta</span><b>{counts.queued}</b></div>
      <div><span>Uygulanıyor</span><b>{counts.running}</b></div>
      <div><span>Doğrulama</span><b>{counts.verify}</b></div>
      <div><span>Doğrulandı</span><b>{counts.verified}</b></div>
      <div><span>Başarısız</span><b>{counts.failed}</b></div>
    </div>

    {error&&<div className="error">{error}</div>}

    {actions.length===0?<div className="empty"><b>Henüz execution job yok.</b> Recommendations ekranından bir öneri onaylandığında otomatik olarak kuyruğa alınacak.</div>:<div className="recommendationList">
      {actions.slice(0,30).map(action=>{const rec=action.recommendation_id?recById.get(action.recommendation_id):undefined;return <article key={action.id}>
        <div className="recPriority">{labels[action.status]||action.status.toUpperCase()}</div>
        <div>
          <strong>{rec?.title||action.action_type}</strong>
          <p>{rec?.proposed_action?.recommendation||`Aksiyon tipi: ${action.action_type}`}</p>
          <span>{action.provider||'system'} · {action.approved_by||'system'}{action.created_at?` · ${new Date(action.created_at).toLocaleString('tr-TR')}`:''}</span>
        </div>
      </article>})}
    </div>}

    <div className="moduleFoot">Dış sistemde otomatik değişiklik hâlâ kapalıdır. Execution Center şu anda onay, kuyruk ve doğrulama yaşam döngüsünü güvenli şekilde izler.</div>
  </section>;
}
