'use client';

import { useEffect, useState } from 'react';
import AgencyPortfolioPanel from './AgencyPortfolioPanel';

export default function AgencyPortfolioHost(){
  const [visible,setVisible]=useState(false);
  const [mobile,setMobile]=useState(false);

  useEffect(()=>{
    if(window.location.pathname!=='/')return;
    let alive=true;
    const media=window.matchMedia('(max-width: 900px)');
    const syncMedia=()=>{if(alive)setMobile(media.matches)};
    const resolve=()=>{if(alive)setVisible(Boolean(document.querySelector<HTMLElement>('.dashboardHome')))};
    syncMedia();resolve();
    media.addEventListener('change',syncMedia);
    const observer=new MutationObserver(resolve);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    const timer=window.setInterval(resolve,1000);
    return()=>{alive=false;media.removeEventListener('change',syncMedia);observer.disconnect();window.clearInterval(timer)};
  },[]);

  if(!visible)return null;
  return <div style={{marginLeft:mobile?'0':'242px',padding:mobile?'0 16px 24px':'0 34px 34px',maxWidth:'1600px'}}><AgencyPortfolioPanel/></div>;
}
