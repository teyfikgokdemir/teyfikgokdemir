'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './clients.module.css';

type WorkspaceMe={actor:{email:string;workspaceId:string;role:string};workspace?:{id:string;name:string;plan?:string}|null};
type Client={id:string;name:string;domain?:string;status?:string};
type WorkspaceDetail={clients:Client[];actor:{role:string}};
type PortalUser={id:string;email:string;display_name?:string;role:string;status:string};
type ClientInvite={id:string;email:string;display_name?:string;role:string;status:string;expires_at:string;accepted_at?:string;created_at:string;invited_by:string};

const api='/api/growth';
const inviteStatus:Record<string,string>={pending:'Bekliyor',accepted:'Kabul edildi',expired:'Süresi doldu',revoked:'İptal edildi'};

export default function AgencyClientsPage(){
  const [me,setMe]=useState<WorkspaceMe|null>(null);
  const [clients,setClients]=useState<Client[]>([]);
  const [selected,setSelected]=useState('');
  const [users,setUsers]=useState<PortalUser[]>([]);
  const [invites,setInvites]=useState<ClientInvite[]>([]);
  const [email,setEmail]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [role,setRole]=useState<'client_admin'|'client_viewer'>('client_viewer');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [inviting,setInviting]=useState(false);
  const [revokingId,setRevokingId]=useState('');
  const [inviteUrl,setInviteUrl]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const workspaceId=me?.actor.workspaceId||'';
  const selectedClient=useMemo(()=>clients.find(c=>c.id===selected)||null,[clients,selected]);
  const portalPath=selectedClient?`/client/${workspaceId}/${selectedClient.id}`:'';
  const pendingInvites=invites.filter(item=>item.status==='pending').length;

  async function loadBase(){
    setLoading(true);setError('');
    try{
      const meRes=await fetch(`${api}/workspaces/me`,{cache:'no-store'});
      const mePayload=await meRes.json();
      if(!meRes.ok)throw new Error(mePayload?.error||'Workspace okunamadı.');
      setMe(mePayload);
      const detailRes=await fetch(`${api}/workspaces/${mePayload.actor.workspaceId}`,{cache:'no-store'});
      const detail=(await detailRes.json()) as WorkspaceDetail&{error?:string};
      if(!detailRes.ok)throw new Error(detail.error||'Müşteri listesi okunamadı.');
      setClients(detail.clients||[]);
      setSelected(current=>current&&detail.clients.some(c=>c.id===current)?current:(detail.clients[0]?.id||''));
    }catch(err){setError(err instanceof Error?err.message:'Müşteri yönetimi yüklenemedi.')}finally{setLoading(false)}
  }

  async function loadAccess(clientId:string){
    if(!workspaceId||!clientId){setUsers([]);setInvites([]);return}
    try{
      const [usersRes,invitesRes]=await Promise.all([
        fetch(`${api}/workspaces/${workspaceId}/clients/${clientId}/portal-users`,{cache:'no-store'}),
        fetch(`${api}/workspaces/${workspaceId}/invites/client/${clientId}`,{cache:'no-store'})
      ]);
      const usersPayload=await usersRes.json();
      const invitesPayload=await invitesRes.json();
      if(!usersRes.ok)throw new Error(usersPayload?.error||'Portal kullanıcıları okunamadı.');
      if(!invitesRes.ok)throw new Error(invitesPayload?.error||'Davetler okunamadı.');
      setUsers(usersPayload);
      setInvites(invitesPayload);
    }catch(err){setUsers([]);setInvites([]);setError(err instanceof Error?err.message:'Müşteri erişimleri okunamadı.')}
  }

  useEffect(()=>{void loadBase()},[]);
  useEffect(()=>{setInviteUrl('');if(selected&&workspaceId)void loadAccess(selected)},[selected,workspaceId]);

  async function submit(event:FormEvent){
    event.preventDefault();
    if(!selectedClient||!email)return;
    setSaving(true);setError('');setNotice('');
    try{
      const response=await fetch(`${api}/workspaces/${workspaceId}/clients/${selectedClient.id}/portal-users`,{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,displayName:displayName||undefined,role})
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Portal kullanıcısı eklenemedi.');
      setEmail('');setDisplayName('');setNotice('Portal kullanıcısı doğrudan aktifleştirildi.');
      await loadAccess(selectedClient.id);
    }catch(err){setError(err instanceof Error?err.message:'Portal kullanıcısı eklenemedi.')}finally{setSaving(false)}
  }

  async function createInviteFor(targetEmail:string,targetName:string,targetRole:'client_admin'|'client_viewer'){
    if(!selectedClient||!targetEmail)return;
    setInviting(true);setError('');setNotice('');setInviteUrl('');
    try{
      const response=await fetch(`${api}/workspaces/${workspaceId}/invites/client/${selectedClient.id}`,{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:targetEmail,displayName:targetName||undefined,role:targetRole,expiresInDays:7})
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Davet oluşturulamadı.');
      const url=`${window.location.origin}/client/invite/${workspaceId}/${payload.token}`;
      setInviteUrl(url);
      try{await navigator.clipboard.writeText(url);setNotice('Güvenli davet bağlantısı oluşturuldu ve panoya kopyalandı.')}catch{setNotice('Güvenli davet bağlantısı oluşturuldu.')}
      await loadAccess(selectedClient.id);
    }catch(err){setError(err instanceof Error?err.message:'Davet oluşturulamadı.')}finally{setInviting(false)}
  }

  async function createInvite(){
    await createInviteFor(email,displayName,role);
  }

  async function revokeInvite(inviteId:string){
    if(!selectedClient)return;
    setRevokingId(inviteId);setError('');setNotice('');
    try{
      const response=await fetch(`${api}/workspaces/${workspaceId}/invites/client/${selectedClient.id}/${inviteId}/revoke`,{method:'POST'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Davet iptal edilemedi.');
      setNotice('Bekleyen davet iptal edildi.');
      await loadAccess(selectedClient.id);
    }catch(err){setError(err instanceof Error?err.message:'Davet iptal edilemedi.')}finally{setRevokingId('')}
  }

  async function reissueInvite(invite:ClientInvite){
    setEmail(invite.email);setDisplayName(invite.display_name||'');setRole(invite.role==='client_admin'?'client_admin':'client_viewer');
    await createInviteFor(invite.email,invite.display_name||'',invite.role==='client_admin'?'client_admin':'client_viewer');
  }

  async function copyPortal(){
    if(!portalPath)return;
    const url=`${window.location.origin}${portalPath}`;
    try{await navigator.clipboard.writeText(url);setNotice('Portal bağlantısı panoya kopyalandı.')}catch{setNotice(url)}
  }

  return <main className={styles.screen}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>AGENCY WORKSPACE</p><h1>Müşteri Yönetimi</h1><p>Müşteri portal erişimleri, güvenli davetler, roller ve paylaşılabilir bağlantılar tek merkezde.</p></div>
        <a className={styles.back} href="/">Growth OS’a dön</a>
      </header>

      {loading?<div className={styles.state}>Müşteri workspace’i yükleniyor…</div>:null}
      {error?<div className={styles.error}>{error}</div>:null}
      {notice?<div className={styles.notice}>{notice}</div>:null}

      {!loading&&me?<>
        <section className={styles.summary}>
          <article><span>Workspace</span><strong>{me.workspace?.name||'Growth OS'}</strong><small>{me.actor.role}</small></article>
          <article><span>Müşteri</span><strong>{clients.length}</strong><small>aktif kayıt</small></article>
          <article><span>Portal Kullanıcısı</span><strong>{users.length}</strong><small>{pendingInvites} bekleyen davet</small></article>
        </section>

        <section className={styles.grid}>
          <aside className={styles.panel}>
            <div className={styles.panelHead}><div><p className={styles.eyebrow}>MÜŞTERİLER</p><h2>Portföy</h2></div><span>{clients.length}</span></div>
            <div className={styles.clientList}>{clients.length===0?<div className={styles.empty}>Henüz müşteri bulunmuyor.</div>:clients.map(client=><button key={client.id} className={`${styles.client} ${selected===client.id?styles.active:''}`} onClick={()=>setSelected(client.id)}><strong>{client.name}</strong><span>{client.domain||'Domain tanımlı değil'}</span></button>)}</div>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelHead}><div><p className={styles.eyebrow}>CLIENT ACCESS</p><h2>{selectedClient?.name||'Müşteri seç'}</h2></div>{selectedClient?<button className={styles.copy} onClick={()=>void copyPortal()}>Portal Linkini Kopyala</button>:null}</div>

            {selectedClient?<>
              <div className={styles.portalBox}><span>Portal adresi</span><code>{portalPath}</code><small>Müşteri yalnızca kendisine atanmış projeleri, kararları ve doğrulanmış sonuçları görür.</small></div>

              <form className={styles.form} onSubmit={submit}>
                <div><label>E-posta</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="musteri@firma.com" required/></div>
                <div><label>Ad Soyad</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="İsteğe bağlı"/></div>
                <div><label>Rol</label><select value={role} onChange={e=>setRole(e.target.value as 'client_admin'|'client_viewer')}><option value="client_viewer">client_viewer · sadece görüntüleme</option><option value="client_admin">client_admin · karar verebilir</option></select></div>
                <button className={styles.primary} disabled={saving||inviting}>{saving?'Hazırlanıyor…':'Doğrudan Kullanıcı Oluştur'}</button>
                <button type="button" className={styles.copy} disabled={saving||inviting||!email} onClick={()=>void createInvite()}>{inviting?'Davet hazırlanıyor…':'7 Günlük Güvenli Davet Oluştur'}</button>
              </form>

              {inviteUrl?<div className={styles.portalBox}><span>Tek kullanımlık davet</span><code>{inviteUrl}</code><small>Davet yalnızca tanımlanan e-posta hesabıyla ve 7 gün içinde kabul edilebilir. Yeni davet oluşturulursa önceki bekleyen davet iptal edilir.</small></div>:null}

              <div className={styles.users}>
                <div className={styles.usersHead}><h3>Davet Geçmişi</h3><span>{invites.length}</span></div>
                {invites.length===0?<div className={styles.empty}>Bu müşteri için henüz davet oluşturulmadı.</div>:invites.map(invite=><article key={invite.id}><div><strong>{invite.display_name||invite.email}</strong><span>{invite.email} · {invite.role}</span><span>{inviteStatus[invite.status]||invite.status} · {new Date(invite.expires_at).toLocaleString('tr-TR')}</span></div><div><b>{inviteStatus[invite.status]||invite.status}</b><small>{invite.status==='accepted'&&invite.accepted_at?`Kabul: ${new Date(invite.accepted_at).toLocaleDateString('tr-TR')}`:`Oluşturma: ${new Date(invite.created_at).toLocaleDateString('tr-TR')}`}</small><div style={{display:'flex',gap:6,justifyContent:'flex-end',marginTop:7,flexWrap:'wrap'}}>{invite.status==='pending'?<button type="button" className={styles.copy} disabled={revokingId===invite.id||inviting} onClick={()=>void revokeInvite(invite.id)}>{revokingId===invite.id?'İptal ediliyor…':'İptal Et'}</button>:null}{invite.status!=='accepted'?<button type="button" className={styles.copy} disabled={inviting||Boolean(revokingId)} onClick={()=>void reissueInvite(invite)}>Yeniden Davet</button>:null}</div></div></article>)}
              </div>

              <div className={styles.users}>
                <div className={styles.usersHead}><h3>Portal Kullanıcıları</h3><span>{users.length}</span></div>
                {users.length===0?<div className={styles.empty}>Bu müşteri için portal kullanıcısı yok.</div>:users.map(user=><article key={user.id}><div><strong>{user.display_name||user.email}</strong><span>{user.email}</span></div><div><b>{user.role}</b><small>{user.status}</small></div></article>)}
              </div>
            </>:<div className={styles.empty}>Portal yönetmek için müşteri seç.</div>}
          </section>
        </section>
      </>:null}
    </div>
  </main>;
}
