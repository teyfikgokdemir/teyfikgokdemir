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
    let loadingProjects=false;

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

    const loadProjects=async()=>{
      if(!alive||loadingProjects)return;
      loadingProjects=true;
      try{
        const response=await fetch('/api/growth/projects',{cache:'no-store'});
        if(response.ok){
          const rows=await response.json() as Project[];
          if(alive)projects=rows;
        }
      }catch{
        // Keep the last known project list and retry on the next refresh cycle.
      }finally{
        loadingProjects=false;
        resolve();
      }
    };

    void loadProjects();

    const observer=new MutationObserver(resolve);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    const timer=window.setInterval(resolve,1000);
    const projectsTimer=window.setInterval(()=>void loadProjects(),15000);
    resolve();

    return()=>{
      alive=false;
      observer.disconnect();
      window.clearInterval(timer);
      window.clearInterval(projectsTimer);
    };
  },[]);

  if(!visible||!projectId)return null;
  return <div className="externalModuleHost"><GrowthIntelligencePanel projectId={projectId}/></div>;
}
