'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './activity.module.css';

type Activity={id:string;actorEmail:string;action:string;entityType:string;entityId:string|null;entityName:string|null;metadata:Record<string,unknown>;createdAt:string};
type WorkspaceMe={actor?:{workspaceId:string;email:string};workspace?:{name:string}|null;error?:string};
type ActivityPage={items:Activity[];nextCursor:string|null;error?:string};
const actions:Record<string,{label:string;chip:string;icon:string;kind:string}>={
  'project.archived':{label:'Proje arşivlendi',chip:'Arşiv',icon:'↓',kind:'archive'},
  'project.restored':{label:'Proje geri alındı',chip:'Geri alma',icon:'↗',kind:'restore'},
  'project.deleted':{label:'Proje kalıcı silindi',chip:'Kalıcı silme',icon:'×',kind:'delete'}
};
const dateFormat=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'});
const timeFormat=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'});

export default function ActivityPage(){
  const [items,setItems]=useState<Activity[]>([]);
  const [nextCursor,setNextCursor]=useState<string|null>(null);
  const [workspaceName,setWorkspaceName]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const request=useRef<AbortController|null>(null);
  const scope=useRef('');

  async function load(cursor?:string){
    if(request.current)return;
    const controller=new AbortController();
    request.current=controller;
    setLoading(true);setError('');
    try{
      const options={cache:'no-store' as const,credentials:'same-origin' as const,signal:controller.signal};
      const meResponse=await fetch('/api/growth/workspaces/me',options);
      const me=await meResponse.json() as WorkspaceMe;
      if(controller.signal.aborted)return;
      if(!meResponse.ok||!me.actor?.workspaceId)throw new Error('Çalışma alanı bilgisi alınamadı. Lütfen tekrar deneyin.');
      const identity=`${me.actor.workspaceId}:${me.actor.email}`;
      const append=Boolean(cursor)&&scope.current===identity;
      if(!append){setItems([]);setNextCursor(null)}
      scope.current=identity;
      setWorkspaceName(me.workspace?.name||'Çalışma alanı');
      const query=new URLSearchParams({limit:'50'});
      if(append&&cursor)query.set('cursor',cursor);
      const response=await fetch(`/api/growth/workspaces/${encodeURIComponent(me.actor.workspaceId)}/activity?${query}`,options);
      const data=await response.json() as ActivityPage;
      if(!response.ok||!Array.isArray(data.items))throw new Error('Aktivite geçmişi yüklenemedi. Lütfen tekrar deneyin.');
      if(controller.signal.aborted)return;
      setItems(previous=>Array.from(new Map([...(append?previous:[]),...data.items].map(item=>[item.id,item])).values()));
      setNextCursor(data.nextCursor||null);
    }catch(e){
      if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Aktivite geçmişi yüklenemedi.');
    }finally{
      if(request.current===controller){request.current=null;setLoading(false)}
    }
  }

  useEffect(()=>{
    void load();
    return()=>{request.current?.abort();request.current=null};
  },[]);

  return <main className={styles.page}>
    <aside className={styles.side}>
      <a href="/" className={styles.brand}><span>G</span><div><strong>Growth OS</strong><small>Private Control Center</small></div></a>
      <nav aria-label="Ana gezinme">
        <a href="/" onClick={()=>window.sessionStorage.setItem('growth-os:last-section','Genel Bakış')}>Genel Bakış</a>
        <a href="/projects">Projeler</a>
        <a href="/activity" aria-current="page">Aktivite Geçmişi</a>
        <a href="/agency">Ajans Merkezi</a>
      </nav>
      <p className={styles.sideNote}>Çalışma alanınızın<br/>işlem hafızası.</p>
    </aside>
    <section className={styles.content}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ÇALIŞMA ALANI / GEÇMİŞ</p>
        <h1>Aktivite Geçmişi<span>.</span></h1>
        <p>Ne değişti, kim yaptı, ne zaman?<br/>Projelerinizin geçmişini tek bir yerden takip edin.</p>
      </header>
      <section className={styles.panel} aria-labelledby="activity-heading" aria-busy={loading}>
        <div className={styles.panelHead}>
          <div><p className={styles.eyebrow}>{workspaceName||'Çalışma alanı'}</p><h2 id="activity-heading">Son hareketler</h2></div>
          <span>Yeniden eskiye</span>
        </div>
        {error&&<div className={styles.error} role="alert"><div><strong>Geçmişe şu an ulaşılamıyor</strong><p>{error}</p></div><button disabled={loading} onClick={()=>void load(nextCursor||undefined)}>Tekrar dene</button></div>}
        {loading&&items.length===0&&<div className={styles.loading} role="status"><p>Aktivite geçmişi yükleniyor…</p>{[0,1,2].map(i=><div key={i} className={styles.skeleton} aria-hidden="true"><span/><div><i/><i/></div></div>)}</div>}
        {!loading&&!error&&items.length===0&&<div className={styles.empty}><span aria-hidden="true">↳</span><h3>Henüz bir hareket yok</h3><p>Projeler arşivlendiğinde, geri alındığında veya silindiğinde işlem geçmişi burada görünecek.</p><a href="/projects">Projelere git <span aria-hidden="true">↗</span></a></div>}
        {items.length>0&&<ol className={styles.timeline} aria-label="Aktivite kayıtları">{items.map(item=>{
          const action=actions[item.action]||{label:item.action,chip:'İşlem',icon:'·',kind:'other'};
          const date=new Date(item.createdAt);
          const validDate=!Number.isNaN(date.getTime());
          const domain=typeof item.metadata?.domain==='string'?item.metadata.domain:'';
          return <li key={item.id} className={styles.event} data-kind={action.kind}>
            <div className={styles.marker} aria-hidden="true">{action.icon}</div>
            <div className={styles.details}>
              <div className={styles.eventTop}><span className={styles.chip}>{action.chip}</span><time dateTime={validDate?item.createdAt:undefined}>{validDate?<>{dateFormat.format(date)}<span> · {timeFormat.format(date)}</span></>:'Tarih bilgisi yok'}</time></div>
              <h3>{item.entityName?.trim()||(item.entityType==='project'?'İsimsiz proje':'İsimsiz kayıt')}</h3>
              {domain&&<p className={styles.domain}>{domain}</p>}
              <p className={styles.action}>{action.label}</p>
              <p className={styles.actor}><span>İşlemi yapan</span> {item.actorEmail||'Kullanıcı bilgisi yok'}</p>
            </div>
          </li>;
        })}</ol>}
        {items.length>0&&<footer className={styles.footer}>
          <span role="status">{items.length} kayıt gösteriliyor{!nextCursor&&!loading?' · Geçmişin sonundasınız.':''}</span>
          {nextCursor&&<button disabled={loading} onClick={()=>void load(nextCursor)}>{loading?'Yükleniyor…':'Daha fazla yükle'}</button>}
        </footer>}
      </section>
      <p className={styles.footnote}>Bir proje silinse de işlem geçmişindeki adı ve bilgileri korunur.</p>
    </section>
  </main>;
}
