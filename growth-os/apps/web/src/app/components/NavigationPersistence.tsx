'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import GrowthIntelligencePanel from './GrowthIntelligencePanel';

const STORAGE_KEY='growth-os:last-section';
type Project={id:string;name?:string;domain:string};

function normalizeDomain(value:string){
  return value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
}

export default function NavigationPersistence(){
  const [portalTarget,setPortalTarget]=useState<HTMLElement|null>(null);
  const [projectId,setProjectId]=useState<string|null>(null);

  useEffect(()=>{
    if(window.location.pathname!=='/')return;

    let applying=true;
    const saved=window.sessionStorage.getItem(STORAGE_KEY);

    const restore=()=>{
      if(!saved){applying=false;return true;}
      const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('aside.side nav button'));
      const target=buttons.find(button=>button.querySelector('span')?.textContent?.trim()===saved);
      if(!target)return false;
      if(!target.classList.contains('active'))target.click();
      applying=false;
      return true;
    };

    let attempts=0;
    const timer=window.setInterval(()=>{
      attempts+=1;
      if(restore()||attempts>=20)window.clearInterval(timer);
    },50);

    const nav=document.querySelector('aside.side nav');
    if(!nav)return()=>window.clearInterval(timer);

    const saveActive=()=>{
      if(applying)return;
      const active=nav.querySelector<HTMLButtonElement>('button.active');
      const label=active?.querySelector('span')?.textContent?.trim();
      if(label)window.sessionStorage.setItem(STORAGE_KEY,label);
    };

    saveActive();
    const observer=new MutationObserver(saveActive);
    observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});

    return()=>{
      window.clearInterval(timer);
      observer.disconnect();
    };
  },[]);

  useEffect(()=>{
    if(window.location.pathname!=='/')return;
    let alive=true;
    let projects:Project[]=[];

    const resolve=()=>{
      if(!alive)return;
      const dashboard=document.querySelector<HTMLElement>('.dashboardHome');
      if(!dashboard){
        setPortalTarget(null);
        setProjectId(null);
        return;
      }

      let mount=dashboard.querySelector<HTMLElement>('#overview-growth-intelligence');
      if(!mount){
        mount=document.createElement('div');
        mount.id='overview-growth-intelligence';
        mount.className='moduleStack';
        const grid=dashboard.querySelector<HTMLElement>('.dashboardGrid');
        if(grid?.parentElement===dashboard)grid.insertAdjacentElement('afterend',mount);
        else dashboard.appendChild(mount);
      }
      setPortalTarget(current=>current===mount?current:mount);

      const displayedDomain=normalizeDomain(document.querySelector<HTMLElement>('.projectBar > div:first-child small')?.textContent||'');
      const displayedName=document.querySelector<HTMLElement>('.projectBar > div:first-child strong')?.textContent?.trim().toLowerCase()||'';
      const project=projects.find(p=>normalizeDomain(p.domain)===displayedDomain)
        ||projects.find(p=>(p.name||'').trim().toLowerCase()===displayedName)
        ||null;
      setProjectId(current=>current===(project?.id||null)?current:(project?.id||null));
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

  if(!portalTarget||!projectId)return null;
  return createPortal(<GrowthIntelligencePanel projectId={projectId}/>,portalTarget);
}
