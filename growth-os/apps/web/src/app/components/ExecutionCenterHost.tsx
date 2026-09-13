'use client';

import { useEffect, useState } from 'react';
import ApprovalDeskPanel from './ApprovalDeskPanel';
import ExecutionCenterPanel from './ExecutionCenterPanel';

type Project={id:string;name?:string;domain:string};

function normalizeDomain(value:string){
  return value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
}

export default function ExecutionCenterHost(){
  const [projectId,setProjectId]=useState<string|null>(null);
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    if(window.location.pathname!=='/')return;
    let alive=true;
    let projects:Project[]=[];
    let hiddenModule:HTMLElement|null=null;

    const restoreLegacy=()=>{
      if(hiddenModule){hiddenModule.style.display='';hiddenModule=null;}
    };

    const resolve=()=>{
      if(!alive)return;
      const activeButton=document.querySelector<HTMLButtonElement>('aside.side nav button.active');
      const activeLabel=activeButton?.querySelector('span')?.textContent?.trim()||'';
      const isRecommendations=activeButton?.dataset.growthSection==='recommendations'||activeLabel==='Recommendations';
      setVisible(isRecommendations);

      if(!isRecommendations){
        restoreLegacy();
        setProjectId(null);
        return;
      }

      const legacy=document.querySelector<HTMLElement>('section.content > .moduleStack');
      if(legacy&&legacy!==hiddenModule){
        restoreLegacy();
        hiddenModule=legacy;
        hiddenModule.style.display='none';
      }

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
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','data-growth-section']});
    const timer=window.setInterval(resolve,1000);
    resolve();

    return()=>{
      alive=false;
      restoreLegacy();
      observer.disconnect();
      window.clearInterval(timer);
    };
  },[]);

  if(!visible||!projectId)return null;
  return <div className="moduleStack externalModuleHost">
    <ApprovalDeskPanel projectId={projectId}/>
    <ExecutionCenterPanel projectId={projectId}/>
  </div>;
}
