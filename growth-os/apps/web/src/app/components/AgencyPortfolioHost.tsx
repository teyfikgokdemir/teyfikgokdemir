'use client';

import { useEffect, useState } from 'react';
import AgencyPortfolioPanel from './AgencyPortfolioPanel';

export default function AgencyPortfolioHost(){
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    if(window.location.pathname!=='/')return;
    let alive=true;
    const resolve=()=>{if(alive)setVisible(Boolean(document.querySelector<HTMLElement>('.dashboardHome')))};
    resolve();
    const observer=new MutationObserver(resolve);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    const timer=window.setInterval(resolve,1000);
    return()=>{alive=false;observer.disconnect();window.clearInterval(timer)};
  },[]);

  if(!visible)return null;
  return <div className="externalModuleHost"><AgencyPortfolioPanel/></div>;
}
