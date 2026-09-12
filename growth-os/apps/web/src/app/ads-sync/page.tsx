'use client';

import { useEffect, useState } from 'react';
import AdsSyncPanel from '../components/AdsSyncPanel';

type Project={id:string;name:string;domain:string};
const api='/api/growth';

export default function AdsSyncPage(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');

  useEffect(()=>{fetch(`${api}/projects`,{cache:'no-store'}).then(async r=>{if(!r.ok)return;const data=await r.json();setProjects(data);if(data[0])setProjectId(data[0].id);}).catch(()=>{});},[]);

  return <main style={{maxWidth:1500,margin:'0 auto',padding:'32px'}}>
    <div className="projectBar" style={{marginBottom:24}}><div><span>Ads Sync Test</span><strong>Read-only Campaign Data</strong><small>Bu ekran reklam yayınlamaz veya bütçe değiştirmez.</small></div><select value={projectId} onChange={e=>setProjectId(e.target.value)} style={{minWidth:260}}><option value="">Proje seç</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.domain}</option>)}</select></div>
    <AdsSyncPanel projectId={projectId||null}/>
  </main>;
}
