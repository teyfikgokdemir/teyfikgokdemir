'use client';

import { useEffect,useState } from 'react';
import AnalyticsPanel from '../components/AnalyticsPanel';

type Project={id:string;name:string;domain:string};
const api='/api/growth';

export default function AnalyticsGa4Page(){
  const[projects,setProjects]=useState<Project[]>([]);
  const[projectId,setProjectId]=useState('');
  useEffect(()=>{fetch(`${api}/projects`,{cache:'no-store'}).then(async r=>{if(!r.ok)return;const rows=await r.json() as Project[];setProjects(rows);if(rows[0])setProjectId(rows[0].id)}).catch(()=>{})},[]);
  return <main style={{minHeight:'100vh',padding:'40px',background:'#0b0712',color:'#f6f0ff'}}><div style={{maxWidth:1500,margin:'0 auto',display:'grid',gap:24}}><section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Growth OS · Analytics</p><h2>GA4 canlı veri doğrulama</h2></div><select value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.domain}</option>)}</select></div></section><AnalyticsPanel projectId={projectId||null}/></div></main>;
}
