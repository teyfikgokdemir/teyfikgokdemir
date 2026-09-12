'use client';

import { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import GrowthIntelligencePanel from './GrowthIntelligencePanel';

type Project={id:string;name?:string;domain:string};

function normalizeDomain(value:string){
  return value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
}

export default function OverviewIntelligenceMount(){
  useEffect(()=>{
    if(window.location.pathname!=='/')return;

    let alive=true;
    let projects:Project[]=[];
    let root:Root|null=null;
    let mount:HTMLElement|null=null;
    let currentProjectId:string|null=null;

    const cleanupMount=()=>{
      if(root){root.unmount();root=null;}
      if(mount?.parentElement)mount.remove();
      mount=null;
      currentProjectId=null;
    };

    const resolve=()=>{
      if(!alive)return;
      const dashboard=document.querySelector<HTMLElement>('.dashboardHome');
      if(!dashboard){
        cleanupMount();
        return;
      }

      const displayedDomain=normalizeDomain(document.querySelector<HTMLElement>('.projectBar > div:first-child small')?.textContent||'');
      const displayedName=document.querySelector<HTMLElement>('.projectBar > div:first-child strong')?.textContent?.trim().toLowerCase()||'';
      const project=projects.find(p=>normalizeDomain(p.domain)===displayedDomain)
        ||projects.find(p=>(p.name||'').trim().toLowerCase()===displayedName)
        ||null;
      if(!project)return;

      if(!mount||!mount.isConnected){
        mount=document.createElement('div');
        mount.id='overview-growth-intelligence';
        mount.className='moduleStack';
        const grid=dashboard.querySelector<HTMLElement>('.dashboardGrid');
        if(grid?.parentElement===dashboard)grid.insertAdjacentElement('afterend',mount);
        else dashboard.appendChild(mount);
        root=createRoot(mount);
        currentProjectId=null;
      }

      if(currentProjectId!==project.id){
        currentProjectId=project.id;
        root?.render(<GrowthIntelligencePanel projectId={project.id}/>);
      }
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
      cleanupMount();
    };
  },[]);

  return null;
}
