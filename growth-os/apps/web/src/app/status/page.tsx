'use client';

import { useEffect, useRef, useState } from 'react';

type Ready={ok?:boolean;ready?:boolean;database?:string;service?:string;time?:string;error?:string};
type Capabilities={mode?:string;externalExecution?:boolean;adPublishing?:boolean;budgetMutation?:boolean;creativeMutation?:boolean;metricsSync?:boolean;error?:string};

export default function StatusPage(){
  const [ready,setReady]=useState<Ready|null>(null);
  const [capabilities,setCapabilities]=useState<Capabilities|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const loadSequence=useRef(0);

  async function load(){
    const sequence=++loadSequence.current;
    setLoading(true);setError('');
    try{
      const [readyRes,capRes]=await Promise.all([
        fetch('/api/growth/health/ready',{cache:'no-store'}),
        fetch('/api/growth/capabilities',{cache:'no-store'})
      ]);
      const readyBody=await readyRes.json() as Ready;
      const capBody=await capRes.json() as Capabilities;
      if(sequence!==loadSequence.current)return;
      if(!readyRes.ok)throw new Error(readyBody.error||'API readiness kontrolü başarısız.');
      if(!capRes.ok)throw new Error(capBody.error||'Capability bilgisi alınamadı.');
      setReady(readyBody);setCapabilities(capBody);
    }catch(e){
      if(sequence!==loadSequence.current)return;
      setReady(null);setCapabilities(null);
      setError(e instanceof Error?e.message:'Sistem durumu okunamadı.');
    }finally{
      if(sequence===loadSequence.current)setLoading(false);
    }
  }

  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),30000);return()=>{loadSequence.current++;window.clearInterval(timer)}},[]);

  const apiOk=Boolean(ready?.ok&&ready?.ready);
  const dbOk=ready?.database==='reachable';
  const writesClosed=capabilities?.externalExecution===false&&capabilities?.adPublishing===false&&capabilities?.budgetMutation===false&&capabilities?.creativeMutation===false;

  return <main className="statusScreen"><section className="statusShell">
    <header><div><p>SYSTEM OBSERVABILITY</p><h1>Growth OS Sistem Durumu</h1><span>Production readiness, veri katmanı ve execution guardrail’leri.</span></div><a href="/">Kontrol Merkezine Dön</a></header>
    {error&&<div className="error">{error}<button onClick={()=>void load()}>Tekrar dene</button></div>}
    <section className="statusGrid" aria-busy={loading}>
      <article className={apiOk?'ok':'warn'}><span>API Readiness</span><strong>{loading?'KONTROL…':apiOk?'HAZIR':'SORUN'}</strong><small>{ready?.service||'growth-os-api'}</small></article>
      <article className={dbOk?'ok':'warn'}><span>Database</span><strong>{loading?'KONTROL…':dbOk?'ERİŞİLEBİLİR':'ERİŞİLEMİYOR'}</strong><small>{ready?.database||'—'}</small></article>
      <article className={writesClosed?'ok':'warn'}><span>External Write Guard</span><strong>{loading?'KONTROL…':writesClosed?'KAPALI / GÜVENLİ':'KONTROL ET'}</strong><small>Ads · budget · creative · execution</small></article>
      <article className={capabilities?.metricsSync?'ok':'warn'}><span>Metrics Sync</span><strong>{loading?'KONTROL…':capabilities?.metricsSync?'AKTİF':'KAPALI'}</strong><small>read-only veri senkronizasyonu</small></article>
    </section>
    <section className="detail"><div><span>Çalışma modu</span><b>{capabilities?.mode||'—'}</b></div><div><span>Son readiness zamanı</span><b>{ready?.time?new Date(ready.time).toLocaleString('tr-TR'):'—'}</b></div><div><span>Otomatik yenileme</span><b>30 saniye</b></div><button onClick={()=>void load()} disabled={loading}>{loading?'Yenileniyor…':'Şimdi Yenile'}</button></section>
    <section className="guard"><strong>Production guardrail</strong><p>Bu ekran salt okunurdur. Dış sistemlerde reklam yayınlama, bütçe değiştirme, creative mutation ve external execution kapalı kalır.</p></section>
  </section><style jsx>{`
    .statusScreen{min-height:100vh;background:radial-gradient(circle at 85% 0%,#2a1318 0,transparent 30%),linear-gradient(180deg,#090708,#120a0c 55%,#080607);color:#fff7f3;padding:28px}.statusShell{max-width:1220px;margin:0 auto}header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:24px;border-bottom:1px solid #332024}header p{margin:0;color:#ff8f80;font-size:11px;letter-spacing:.16em}header h1{font-size:42px;margin:8px 0 8px;letter-spacing:-.04em}header span{color:#b7a3a0}header a{color:#f6dfda;text-decoration:none;border:1px solid #553038;border-radius:12px;padding:10px 14px}.statusGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:24px}.statusGrid article{padding:20px;border:1px solid #37252a;border-radius:18px;background:#100b0d}.statusGrid span,.statusGrid small{display:block;color:#99898b;font-size:11px}.statusGrid strong{display:block;font-size:20px;margin:10px 0}.statusGrid .ok{border-color:#274a3a}.statusGrid .ok strong{color:#86e3b7}.statusGrid .warn{border-color:#60343b}.statusGrid .warn strong{color:#ff9b8d}.detail,.guard,.error{margin-top:14px;border:1px solid #332126;border-radius:18px;background:#0f0a0c}.detail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:12px;align-items:center;padding:18px}.detail span{display:block;color:#8f7f82;font-size:10px}.detail b{display:block;margin-top:5px}.detail button,.error button{border:1px solid #6b3b43;background:#2a1519;color:#ffeae5;border-radius:10px;padding:10px 12px}.guard{padding:18px}.guard strong{color:#ff9b8d}.guard p{margin:7px 0 0;color:#aa9799;line-height:1.6}.error{padding:14px;color:#ffb4a9;display:flex;justify-content:space-between;gap:12px;align-items:center}@media(max-width:900px){.statusGrid{grid-template-columns:1fr 1fr}.detail{grid-template-columns:1fr 1fr}header{display:grid}}@media(max-width:560px){.statusScreen{padding:14px}.statusGrid,.detail{grid-template-columns:1fr}header h1{font-size:32px}}
  `}</style></main>;
}
