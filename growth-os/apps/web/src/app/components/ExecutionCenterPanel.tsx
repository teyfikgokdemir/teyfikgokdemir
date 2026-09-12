'use client';

import { useEffect, useMemo, useState } from 'react';

type ActionRow={id:string;recommendation_id?:string;provider?:string;action_type:string;status:string;approved_by?:string;executed_at?:string;created_at?:string};
type Recommendation={id:string;title:string;priority:string;status:string;source:string;proposed_action?:{recommendation?:string}};
type Capabilities={mode?:string;externalExecution?:boolean;adPublishing?:boolean;budgetMutation?:boolean;creativeMutation?:boolean;metricsSync?:boolean};

const api='/api/growth';
const labels:Record<string,string>={queued:'KUYRUKTA',in_progress:'UYGULANIYOR',verification_pending:'DOĞRULAMA',verified:'DOĞRULANDI',failed:'BAŞARISIZ',approved:'ONAYLANDI',executed:'UYGULANDI'};
const stages=[
  {key:'approved',label:'Onay'},
  {key:'queued',label:'Kuyruk'},
  {key:'in_progress',label:'Uygulama'},
  {key:'verification_pending',label:'Doğrulama'},
  {key:'verified',label:'Doğrulandı'}
];

export default function ExecutionCenterPanel({projectId}:{projectId:string|null}){
  const [actions,setActions]=useState<ActionRow[]>([]);
  const [recommendations,setRecommendations]=useState<Recommendation[]>([]);
  const [capabilities,setCapabilities]=useState<Capabilities|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function load(){
    if(!projectId)return;
    setLoading(true);setError('');
    try{
      const [a,r,c]=await Promise.all([
        fetch(`${api}/projects/${projectId}/actions`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/recommendations`,{cache:'no-store'}),
        fetch(`${api}/capabilities`,{cache:'no-store'})
      ]);
      if(!a.ok)throw new Error('Execution kayıtları okunamadı.');
      setActions(await a.json());
      if(r.ok)setRecommendations(await r.json());
      if(c.ok)setCapabilities(await c.json());
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
    approved:actions.filter(a=>a.status==='approved').length,
    queued:actions.filter(a=>a.status==='queued').length,
    running:actions.filter(a=>a.status==='in_progress').length,
    verify:actions.filter(a=>a.status==='verification_pending').length,
    verified:actions.filter(a=>a.status==='verified').length,
    failed:actions.filter(a=>a.status==='failed').length
  }),[actions]);
  const blocked=capabilities?.externalExecution===false;
  const waiting=counts.queued+counts.running+counts.verify;

  if(!projectId)return null;

  return <section className="moduleCard">
    <div className="reportHead compact">
      <div>
        <p className="eyebrow">Execution Center · Controlled Workflow</p>
        <h2>{waiting>0?`${waiting} aksiyon işlem hattında`:'Execution hattı hazır'}</h2>
        <p>Detected → Proposed → Approved → Queued → In Progress → Verification → Verified</p>
      </div>
      <button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Akışı Yenile'}</button>
    </div>

    <div className="readinessChecklist">
      <div><span>Onaylandı</span><b>{counts.approved}</b></div>
      <div><span>Kuyrukta</span><b>{counts.queued}</b></div>
      <div><span>Uygulanıyor</span><b>{counts.running}</b></div>
      <div><span>Doğrulama</span><b>{counts.verify}</b></div>
      <div><span>Doğrulandı</span><b>{counts.verified}</b></div>
      <div><span>Başarısız</span><b>{counts.failed}</b></div>
    </div>

    <div className="recommendationList">
      <article>
        <div className="recPriority">{blocked?'KİLİTLİ':'AKTİF'}</div>
        <div>
          <strong>External Execution Gate</strong>
          <p>{blocked?'Dış sistemlerde otomatik değişiklik kapalı. Onaylanan işler kuyruğa alınır fakat provider executor açılmadan yayınlanmaz.':'External execution açık; proje politikası ve provider allowlist ayrıca kontrol edilmelidir.'}</p>
          <span>Mode: {capabilities?.mode||'read_only'} · Ads publish: {capabilities?.adPublishing?'açık':'kapalı'} · Budget mutation: {capabilities?.budgetMutation?'açık':'kapalı'} · Creative mutation: {capabilities?.creativeMutation?'açık':'kapalı'}</span>
        </div>
      </article>
    </div>

    <div className="readinessChecklist">
      {stages.map(stage=><div key={stage.key}><span>{stage.label}</span><b>{stage.key==='approved'?counts.approved:stage.key==='queued'?counts.queued:stage.key==='in_progress'?counts.running:stage.key==='verification_pending'?counts.verify:counts.verified}</b></div>)}
    </div>

    {error&&<div className="error">{error}</div>}

    {actions.length===0?<div className="empty"><b>Henüz execution job yok.</b> Recommendations ekranından bir öneri onaylandığında otomatik olarak kuyruğa alınacak.</div>:<div className="recommendationList">
      {actions.slice(0,30).map(action=>{const rec=action.recommendation_id?recById.get(action.recommendation_id):undefined;return <article key={action.id}>
        <div className="recPriority">{labels[action.status]||action.status.toUpperCase()}</div>
        <div>
          <strong>{rec?.title||action.action_type}</strong>
          <p>{rec?.proposed_action?.recommendation||`Aksiyon tipi: ${action.action_type}`}</p>
          <span>{action.provider||'system'} · Onay: {action.approved_by||'system'}{action.created_at?` · ${new Date(action.created_at).toLocaleString('tr-TR')}`:''}</span>
        </div>
      </article>})}
    </div>}

    <div className="moduleFoot">Her iş Recommendation → Approval → Execution Job → Verification zincirinde izlenir. Başarılı doğrulama olmadan aksiyon tamamlanmış sayılmaz.</div>
  </section>;
}
