'use client';

import { useEffect,useState } from 'react';
import SearchConsolePanel from '../components/SearchConsolePanel';

type Project={id:string;name:string;domain:string};
const api='/api/growth';

export default function SeoPage(){
  const[projects,setProjects]=useState<Project[]>([]);
  const[projectId,setProjectId]=useState('');
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    fetch(`${api}/projects`,{cache:'no-store'})
      .then(async r=>{if(!r.ok)throw new Error('Projeler okunamadı.');const rows=await r.json() as Project[];if(!alive)return;setProjects(rows);if(rows[0])setProjectId(rows[0].id)})
      .catch(()=>{})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[]);

  return <main style={{minHeight:'100vh',padding:'40px',background:'#0b0712',color:'#f6f0ff'}}>
    <div style={{maxWidth:1500,margin:'0 auto',display:'grid',gap:24}}>
      <section className="moduleCard">
        <div className="reportHead compact">
          <div><p className="eyebrow">Growth OS · SEO</p><h2>Search Performance</h2></div>
          <select value={projectId} onChange={e=>setProjectId(e.target.value)} style={{minWidth:280,padding:'12px 14px',borderRadius:14}}>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.domain}</option>)}
          </select>
        </div>
        <div className="moduleFoot">Search Console verisi aktif projeye göre yüklenir. Proje değiştirince aynı SEO ekranında kalır.</div>
      </section>
      {loading?<div className="moduleLoading"><span/> Projeler yükleniyor…</div>:<SearchConsolePanel projectId={projectId||null}/>} 
    </div>
  </main>;
}
