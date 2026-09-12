'use client';

import { useEffect } from 'react';

const STORAGE_KEY='growth-os:last-section';

export default function NavigationPersistence(){
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

  return null;
}
