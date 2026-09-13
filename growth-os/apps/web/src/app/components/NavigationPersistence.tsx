'use client';

import { useEffect } from 'react';

const STORAGE_KEY='growth-os:last-section';
const SECTION_ORDER=['overview','projects','audit','final','ads','analytics','seo','commerce','crm','profit','alerts','recommendations'] as const;
type SectionKey=typeof SECTION_ORDER[number];
const isSectionKey=(value:string|null):value is SectionKey=>Boolean(value&&SECTION_ORDER.includes(value as SectionKey));

export default function NavigationPersistence(){
  useEffect(()=>{
    if(window.location.pathname!=='/')return;

    let applying=true;
    const savedRaw=window.sessionStorage.getItem(STORAGE_KEY);
    const saved=savedRaw==='Genel Bakış'?'overview':isSectionKey(savedRaw)?savedRaw:null;

    const tagButtons=()=>{
      const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('aside.side nav button'));
      buttons.forEach((button,index)=>{
        const section=SECTION_ORDER[index];
        if(section)button.dataset.growthSection=section;
      });
      return buttons;
    };

    const restore=()=>{
      if(!saved){applying=false;return true;}
      const buttons=tagButtons();
      const target=buttons.find(button=>button.dataset.growthSection===saved);
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
    tagButtons();

    const routeProjects=(event:Event)=>{
      const element=event.target instanceof Element?event.target:null;
      const button=element?.closest<HTMLButtonElement>('button');
      if(button?.dataset.growthSection!=='projects')return;
      event.preventDefault();
      event.stopPropagation();
      window.sessionStorage.setItem(STORAGE_KEY,'projects');
      window.location.assign('/projects');
    };

    const saveActive=()=>{
      if(applying)return;
      tagButtons();
      const active=nav.querySelector<HTMLButtonElement>('button.active');
      const section=active?.dataset.growthSection??null;
      if(isSectionKey(section))window.sessionStorage.setItem(STORAGE_KEY,section);
    };

    nav.addEventListener('click',routeProjects,true);
    saveActive();
    const observer=new MutationObserver(saveActive);
    observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});

    return()=>{
      window.clearInterval(timer);
      nav.removeEventListener('click',routeProjects,true);
      observer.disconnect();
    };
  },[]);

  return null;
}
