'use client';

import { useEffect, useState } from 'react';
import GrowthIntelligencePanel from './GrowthIntelligencePanel';

type Project={id:string;name?:string;domain:string};

function normalizeDomain(value:string){
  return value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
}

export default function OverviewIntelligenceHost(){
  const [projectId,setProjectId]=useState<string|null>(null);
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    if(window.location.pathname!=='/')return;
    let alive=true;
    let projects:Project[]=[];

    const resolve=()=>{
      if(!alive)return;
      const dashboard=document.querySelector<HTMLElement>('.dashboardHome');
      setVisible(Boolean(dashboard));
      if(!dashboard){setProjectId(null);return;}

      const displayedDomain=normalizeDomain(document.querySelector<HTMLElement>('.projectBar > div:first-child small')?.textContent||'');
      const displayedName=document.querySelector<HTMLElement>('.projectBar > div:first-child strong')?.textContent?.trim().toLowerCase()||'';
      const project=projects.find(p=>normalizeDomain(p.domain)===displayedDomain)
        ||projects.find(p=>(p.name||'').trim().toLowerCase()===displayedName)
        ||null;
      setProjectId(project?.id||null);
    };

    fetch('/api/growth/projects',{cache:'no-store'})
      .then(r=>r.ok?r.json():[])
      .then((rows:Project[])=>{projects=rows;resolve()})
      .catch(()=>resolve());

    const observer=new MutationObserver(resolve);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    const timer=window.setInterval(resolve,1000);
    resolve();

    return()=>{
      alive=false;
      observer.disconnect();
      window.clearInterval(timer);
    };
  },[]);

  if(!visible||!projectId)return null;
  return <div style={{marginLeft:'242px',padding:'0 34px 34px',maxWidth:'1600px'}}><GrowthIntelligencePanel projectId={projectId}/></div>;
}
