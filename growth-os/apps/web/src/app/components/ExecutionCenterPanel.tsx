'use client';

import { useEffect, useMemo, useState } from 'react';

type Job={
  id:string;
  recommendation_id?:string|null;
  provider:string;
  action_type:string;
  status:string;
  execution_mode?:string;
  error_message?:string|null;
  recommendation_title?:string|null;
  recommendation_priority?:string|null;
  recommendation_status?:string|null;
  created_at?:string;
  started_at?:string|null;
  finished_at?:string|null;
};
type Verification={
  id:string;
  execution_job_id?:string|null;
  recommendation_id?:string|null;
  status:string;
  verification_type:string;
  score_before?:string|number|null;
  score_after?:string|number|null;
  score_delta?:string|number|null;
  verdict?:string|null;
  recommendation_title?:string|null;
  created_at?:string;
  verified_at?:string|null;
};
type Counts={queued:number;in_progress:number;executed:number;verification_pending:number;verified:number;failed:number};
type ExecutorCapability={available:boolean;writeEnabled:boolean;requiresApproval:boolean};
type CenterResponse={
  jobs:Job[];
  verification:Verification[];
  counts:Counts;
  executorCapabilities?:Record<string,ExecutorCapability>;
  externalExecution?:boolean;
};

const api='/api/growth';
const labels:Record<string,string>={queued:'KUYRUKTA',in_progress:'UYGULANIYOR',verification_pending:'DOĞRULAMA',verified:'DOĞRULANDI',failed:'BAŞARISIZ',executed:'UYGULANDI'};

export default function ExecutionCenterPanel({projectId}:{projectId:string|null}){
  const [data,setData]=useState<CenterResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function load(){
    if(!projectId)return;
    setLoading(true);setError('');
    try{
      const response=await fetch(`${api}/projects/${projectId}/execution-center`,{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Execution Center kayıtları okunamadı.');
      setData(payload);
    }catch(e){setError(e instanceof Error?e.message:'Execution Center yüklenemedi.');}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    if(!projectId)return;
    void load();
    const timer=window.setInterval(()=>void load(),5000);
    return()=>window.clearInterval(timer);
  },[projectId]);

  const jobs=data?.jobs||[];
  const verification=data?.verification||[];
  const counts=data?.counts||{queued:0,in_progress:0,executed:0,verification_pending:0,verified:0,failed:0};
  const verificationByJob=useMemo(()=>{
    const map=new Map<string,Verification>();
    for(const item of verification){if(item.execution_job_id&&!map.has(item.execution_job_id))map.set(item.execution_job_id,item)}
    return map;
  },[verification]);
  const waiting=counts.queued+counts.in_progress+counts.verification_pending;
  const blocked=data?.externalExecution!==true;

  if(!projectId)return null;

  return <section className="moduleCard">
    <div className="reportHead compact">
      <div>
        <p className="eyebrow">Execution Center · Live Workflow</p>
        <h2>{waiting>0?`${waiting} gerçek job işlem hattında`:'Execution hattı hazır'}</h2>
        <p>Bu ekran doğrudan execution_jobs ve verification_results kayıtlarını okur.</p>
      </div>
      <button className="primaryAction" onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Akışı Yenile'}</button>
    </div>

    <div className="readinessChecklist">
      <div><span>Kuyrukta</span><b>{counts.queued}</b></div>
      <div><span>Uygulanıyor</span><b>{counts.in_progress}</b></div>
      <div><span>Doğrulama</span><b>{counts.verification_pending}</b></div>
      <div><span>Doğrulandı</span><b>{counts.verified}</b></div>
      <div><span>Başarısız</span><b>{counts.failed}</b></div>
    </div>

    <div className="recommendationList">
      <article>
        <div className="recPriority">{blocked?'KİLİTLİ':'AKTİF'}</div>
        <div>
          <strong>External Execution Gate</strong>
          <p>{blocked?'Dış sistem write işlemleri kapalı. Job ve doğrulama altyapısı çalışır; provider değişikliği otomatik uygulanmaz.':'External execution açık. Yine de approval ve provider policy kontrolleri zorunlu.'}</p>
          <span>{Object.entries(data?.executorCapabilities||{}).map(([name,cap])=>`${name}: ${cap.writeEnabled?'write açık':'write kapalı'}`).join(' · ')||'Executor capability verisi bekleniyor.'}</span>
        </div>
      </article>
    </div>

    {error&&<div className="error">{error}</div>}

    {jobs.length===0?<div className="empty"><b>Henüz execution job yok.</b> Bir Recommendation onaylandığında DB trigger otomatik job oluşturacak.</div>:<div className="recommendationList">
      {jobs.slice(0,30).map(job=>{const check=verificationByJob.get(job.id);return <article key={job.id}>
        <div className="recPriority">{labels[job.status]||job.status.toUpperCase()}</div>
        <div>
          <strong>{job.recommendation_title||job.action_type}</strong>
          <p>{check?.verdict||job.error_message||`Executor: ${job.provider} · Aksiyon: ${job.action_type}`}</p>
          <span>
            {job.provider} · {job.execution_mode||'manual_approval'}
            {job.recommendation_priority?` · Öncelik: ${job.recommendation_priority}`:''}
            {check?` · Verification: ${check.status}`:''}
            {job.created_at?` · ${new Date(job.created_at).toLocaleString('tr-TR')}`:''}
          </span>
          {check&&(check.score_before!=null||check.score_after!=null)&&<span>Skor: {check.score_before??'—'} → {check.score_after??'—'}{check.score_delta!=null?` · Δ ${check.score_delta}`:''}</span>}
        </div>
      </article>})}
    </div>}

    <div className="moduleFoot">Recommendation → Approval → Execution Job → Verification Result zinciri artık veritabanındaki gerçek kayıtlar üzerinden izleniyor. Başarılı verification olmadan job tamamlanmış sayılmaz.</div>
  </section>;
}
