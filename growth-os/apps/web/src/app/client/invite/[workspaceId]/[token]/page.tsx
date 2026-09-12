'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './invite.module.css';

type InvitePayload={
  invite:{
    client_id:string;
    email:string;
    display_name?:string;
    role:string;
    expires_at:string;
    client_name?:string;
    client_domain?:string;
    brand_name?:string;
    logo_url?:string;
    primary_color?:string;
    accent_color?:string;
  };
  authenticatedEmail:string;
};

export default function ClientInvitePage(){
  const params=useParams<{workspaceId:string;token:string}>();
  const router=useRouter();
  const workspaceId=String(params?.workspaceId||'');
  const token=String(params?.token||'');
  const [data,setData]=useState<InvitePayload|null>(null);
  const [loading,setLoading]=useState(true);
  const [accepting,setAccepting]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    if(!workspaceId||!token)return;
    let active=true;
    (async()=>{
      setLoading(true);setError('');
      try{
        const response=await fetch(`/api/growth/workspaces/${workspaceId}/invites/${token}`,{cache:'no-store'});
        const payload=await response.json();
        if(!response.ok)throw new Error(payload?.error||'Davet doğrulanamadı.');
        if(active)setData(payload);
      }catch(err){if(active)setError(err instanceof Error?err.message:'Davet doğrulanamadı.')}finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[workspaceId,token]);

  async function accept(){
    if(!data)return;
    setAccepting(true);setError('');
    try{
      const response=await fetch(`/api/growth/workspaces/${workspaceId}/invites/${token}/accept`,{method:'POST'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Davet kabul edilemedi.');
      router.replace(`/client/${payload.workspaceId}/${payload.clientId}`);
    }catch(err){setError(err instanceof Error?err.message:'Davet kabul edilemedi.');setAccepting(false)}
  }

  const brand=data?.invite.brand_name||'Growth OS';
  const cssVars={'--invite-primary':data?.invite.primary_color||'#8b5cf6','--invite-accent':data?.invite.accent_color||'#c4b5fd'} as CSSProperties;

  return <main className={styles.screen} style={cssVars}>
    <section className={styles.card}>
      {loading?<div className={styles.loading}>Davet doğrulanıyor…</div>:null}
      {!loading&&error&&!data?<><p className={styles.eyebrow}>CLIENT PORTAL INVITE</p><h1>Davet açılamadı</h1><p className={styles.copy}>{error}</p></>:null}
      {!loading&&data?<>
        <div className={styles.brand}>
          {data.invite.logo_url?<img src={data.invite.logo_url} alt={brand}/>:<div className={styles.mark}>{brand.slice(0,1).toUpperCase()}</div>}
          <div><span>Müşteri Portalı</span><strong>{brand}</strong></div>
        </div>
        <p className={styles.eyebrow}>GÜVENLİ PORTAL DAVETİ</p>
        <h1>{data.invite.client_name||'Müşteri'} portalına davet edildiniz.</h1>
        <p className={styles.copy}>Bu erişim yalnızca <b>{data.authenticatedEmail}</b> hesabı için geçerlidir. Kabul ettikten sonra yalnızca size atanmış müşteri verilerini görebilirsiniz.</p>
        <div className={styles.meta}>
          <div><span>Rol</span><b>{data.invite.role}</b></div>
          <div><span>Müşteri</span><b>{data.invite.client_name||data.invite.client_domain||'—'}</b></div>
          <div><span>Geçerlilik</span><b>{new Date(data.invite.expires_at).toLocaleDateString('tr-TR')}</b></div>
        </div>
        {error?<div className={styles.error}>{error}</div>:null}
        <button className={styles.accept} onClick={()=>void accept()} disabled={accepting}>{accepting?'Erişim hazırlanıyor…':'Daveti Kabul Et'}</button>
        <small className={styles.note}>Davet tek kullanımlıktır. Kabul işlemi herhangi bir reklam, bütçe veya harici hesap değişikliği başlatmaz.</small>
      </>:null}
    </section>
  </main>;
}
