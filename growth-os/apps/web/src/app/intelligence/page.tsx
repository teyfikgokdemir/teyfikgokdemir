'use client';

import { useEffect, useState } from 'react';
import GrowthIntelligencePanel from '../components/GrowthIntelligencePanel';

type Project={id:string;name:string;domain:string};

export default function IntelligencePage(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  useEffect(()=>{fetch('/api/growth/projects',{cache:'no-store'}).then(r=>r.ok?r.json():[]).then((rows:Project[])=>{setProjects(rows);if(rows[0])setProjectId(rows[0].id)}).catch(()=>{})},[]);
  return <main className="shell" style={{display:'block',maxWidth:1500,margin:'0 auto'}}>
    <section className="content" style={{paddingLeft:0}}>
      <section className="moduleHero"><div><p className="eyebrow">Growth OS · Intelligence</p><h2>Çapraz kanal karar motoru</h2><p>Ads, GA4, Search Console ve Merchant sinyallerini tek kararda birleştirir.</p></div><select value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.domain}</option>)}</select></section>
      <GrowthIntelligencePanel projectId={projectId||null}/>
    </section>
  </main>;
}
