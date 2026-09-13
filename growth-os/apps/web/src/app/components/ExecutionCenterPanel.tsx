'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
type ExecutionPlan={executor?:string;risk?:string;requiresApproval?:boolean;externalWrite?:boolean;verificationRequired?:boolean;blockers?:string[];steps?:string[]};
type JobPlanResponse={plan?:ExecutionPlan;job?:{id:string;status:string;provider:string;actionType:string};recommendation?:{id:string;title:string;status:string;source:string}};
type ActionResult={ready?:boolean;status?:string;reason?:string;blockers?:string[];plan?:ExecutionPlan;preview?:{message?:string};verified?:boolean;verdict?:string};

const api='/api/growth';
const labels:Record<string,string>={queued:'KUYRUKTA',in_progress:'UYGULANIYOR',verification_pending:'DOĞRULAMA',verified:'DOĞRULANDI',failed:'BAŞARISIZ',executed:'UYGULANDI'};

export default function ExecutionCenterPanel({projectId}:{projectId:string|null}){
  const [data,setData]=useState<CenterResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [busyJob,setBusyJob]=useState<string|null>(null);
  const [planByJob,setPlanByJob]=useState<Record<string,JobPlanResponse>>({});
  const [resultByJob,setResultByJob]=useState<Record<string,ActionResult>>({});
  const projectGeneration=useRef(0);
  const loadSequence=useRef(0);

  async function load(id:string,generation=projectGeneration.current){
    const sequence=++loadSequence.current;
    if(generation!==projectGeneration.current)return;
    setLoading(true);setError('');
    try{
      const response=await fetch(`${api}/projects/${id}/execution-center`,{cache:'no-store'});
      const payload=await response.json();
      if(generation!==projectGeneration.current||sequence!==loadSequence.current)return;
      if(!response.ok)throw new Error(payload?.error||'Execution Center kayıtları okunamadı.');
      setData(payload);
    }catch(e){
      if(generation!==projectGeneration.current||sequence!==loadSequence.current)return;
      setError(e instanceof Error?e.message:'Execution Center yüklenemedi.');
    }finally{
      if(generation===projectGeneration.current&&sequence===loadSequence.current)setLoading(false);
    }
  }

  async function requestJob(jobId:string,action:'plan'|'prepare'|'verify'){
    if(!projectId||busyJob)return;
    const id=projectId;
    const generation=projectGeneration.current;
    setBusyJob(jobId);setError('');
    try{
      const url=action==='plan'?`${api}/execution-jobs/${jobId}/plan`:`${api}/execution-jobs/${jobId}/${action}`;
      const response=await fetch(url,{method:action==='plan'?'GET':'POST',headers:{'content-type':'application/json'},cache:'no-store'});
      const payload=await response.json();
      if(generation!==projectGeneration.current)return;
      if(!response.ok)throw new Error(payload?.error||'Execution işlemi tamamlanamadı.');
      if(action==='plan')setPlanByJob(current=>({...current,[jobId]:payload as JobPlanResponse}));
      else setResultByJob(current=>({...current,[jobId]:payload as ActionResult}));
      await load(id,generation);
    }catch(e){
      if(generation===projectGeneration.current)setError(e instanceof Error?e.message:'Execution işlemi tamamlanamadı.');
    }finally{
      if(generation===projectGeneration.current)setBusyJob(null);
    }
  }

  useEffect(()=>{
    const generation=++projectGeneration.current;
    ++loadSequence.current;
    setData(null);setPlanByJob({});setResultByJob({});setBusyJob(null);setError('');
    if(!projectId){setLoading(false);return;}
    void load(projectId,generation);
    const timer=window.setInterval(()=>void load(projectId,generation),5000);
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
      <button className="primaryAction" onClick={()=>void load(projectId)} disabled={loading}>{loading?'Yenileniyor…':'Akışı Yenile'}</button>
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
          <p>{blocked?'Dış sistem write işlemleri kapalı. Job planlama, prepare ve doğrulama çalışır; provider değişikliği otomatik uygulanmaz.':'External execution açık. Yine de approval ve provider policy kontrolleri zorunlu.'}</p>
          <span>{Object.entries(data?.executorCapabilities||{}).map(([name,cap])=>`${name}: ${cap.writeEnabled?'write açık':'write kapalı'}`).join(' · ')||'Executor capability verisi bekleniyor.'}</span>
        </div>
      </article>
    </div>

    {error&&<div className="error">{error}</div>}

    {jobs.length===0?<div className="empty"><b>Henüz execution job yok.</b> Bir Recommendation onaylandığında DB trigger otomatik job oluşturacak.</div>:<div className="recommendationList">
      {jobs.slice(0,30).map(job=>{const check=verificationByJob.get(job.id);const plan=planByJob[job.id]?.plan;const result=resultByJob[job.id];return <article key={job.id}>
        <div className="recPriority">{labels[job.status]||job.status.toUpperCase()}</div>
        <div style={{flex:1}}>
          <strong>{job.recommendation_title||job.action_type}</strong>
          <p>{check?.verdict||result?.verdict||result?.reason||job.error_message||`Executor: ${job.provider} · Aksiyon: ${job.action_type}`}</p>
          <span>
            {job.provider} · {job.execution_mode||'manual_approval'}
            {job.recommendation_priority?` · Öncelik: ${job.recommendation_priority}`:''}
            {check?` · Verification: ${check.status}`:''}
            {job.created_at?` · ${new Date(job.created_at).toLocaleString('tr-TR')}`:''}
          </span>
          {check&&(check.score_before!=null||check.score_after!=null)&&<span>Skor: {check.score_before??'—'} → {check.score_after??'—'}{check.score_delta!=null?` · Δ ${check.score_delta}`:''}</span>}
          {plan&&<div style={{marginTop:10}}>
            <span>Executor: {plan.executor||'—'} · Risk: {plan.risk||'—'} · Approval: {plan.requiresApproval?'zorunlu':'değil'} · Verification: {plan.verificationRequired?'zorunlu':'değil'}</span>
            {Boolean(plan.blockers?.length)&&<p style={{marginTop:6}}>Blokerler: {plan.blockers?.join(' · ')}</p>}
          </div>}
          {result?.blockers?.length?<p style={{marginTop:6}}>Prepare blokerleri: {result.blockers.join(' · ')}</p>:null}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          {job.status==='queued'&&<button onClick={()=>void requestJob(job.id,'plan')} disabled={busyJob!==null}>{busyJob===job.id?'…':'Planı İncele'}</button>}
          {job.status==='queued'&&<button className="primaryAction" onClick={()=>void requestJob(job.id,'prepare')} disabled={busyJob!==null}>{busyJob===job.id?'…':'Hazırla'}</button>}
          {job.status==='verification_pending'&&<button className="primaryAction" onClick={()=>void requestJob(job.id,'verify')} disabled={busyJob!==null}>{busyJob===job.id?'…':'Doğrula'}</button>}
        </div>
      </article>})}
    </div>}

    <div className="moduleFoot">Planı İncele ve Hazırla işlemleri dış sistemde değişiklik yapmaz. External write gate kapalıyken Run aksiyonu arayüzde sunulmaz. Başarılı verification olmadan job tamamlanmış sayılmaz.</div>
  </section>;
}
