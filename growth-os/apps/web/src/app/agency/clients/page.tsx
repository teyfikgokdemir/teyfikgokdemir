'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './clients.module.css';

type WorkspaceMe={actor:{email:string;workspaceId:string;role:string};workspace?:{id:string;name:string;plan?:string}|null};
type Client={id:string;name:string;domain?:string;status?:string};
type WorkspaceDetail={clients:Client[];actor:{role:string}};
type PortalUser={id:string;email:string;display_name?:string;role:string;status:string};

const api='/api/growth';

export default function AgencyClientsPage(){
  const [me,setMe]=useState<WorkspaceMe|null>(null);
  const [clients,setClients]=useState<Client[]>([]);
  const [selected,setSelected]=useState('');
  const [users,setUsers]=useState<PortalUser[]>([]);
  const [email,setEmail]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [role,setRole]=useState<'client_admin'|'client_viewer'>('client_viewer');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [inviting,setInviting]=useState(false);
  const [inviteUrl,setInviteUrl]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const workspaceId=me?.actor.workspaceId||'';
  const selectedClient=useMemo(()=>clients.find(c=>c.id===selected)||null,[clients,selected]);
  const portalPath=selectedClient?`/client/${workspaceId}/${selectedClient.id}`:'';

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

  async function loadUsers(clientId:string){
    if(!workspaceId||!clientId){setUsers([]);return}
    try{
      const response=await fetch(`${api}/workspaces/${workspaceId}/clients/${clientId}/portal-users`,{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Portal kullanıcıları okunamadı.');
      setUsers(payload);
    }catch(err){setUsers([]);setError(err instanceof Error?err.message:'Portal kullanıcıları okunamadı.')}
  }

  useEffect(()=>{void loadBase()},[]);
  useEffect(()=>{setInviteUrl('');if(selected&&workspaceId)void loadUsers(selected)},[selected,workspaceId]);

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
      await loadUsers(selectedClient.id);
    }catch(err){setError(err instanceof Error?err.message:'Portal kullanıcısı eklenemedi.')}finally{setSaving(false)}
  }

  async function createInvite(){
    if(!selectedClient||!email)return;
    setInviting(true);setError('');setNotice('');setInviteUrl('');
    try{
      const response=await fetch(`${api}/workspaces/${workspaceId}/invites/client/${selectedClient.id}`,{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,displayName:displayName||undefined,role,expiresInDays:7})
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Davet oluşturulamadı.');
      const url=`${window.location.origin}/client/invite/${workspaceId}/${payload.token}`;
      setInviteUrl(url);
      try{await navigator.clipboard.writeText(url);setNotice('Güvenli davet bağlantısı oluşturuldu ve panoya kopyalandı.')}catch{setNotice('Güvenli davet bağlantısı oluşturuldu.')}
    }catch(err){setError(err instanceof Error?err.message:'Davet oluşturulamadı.')}finally{setInviting(false)}
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
          <article><span>Portal Kullanıcısı</span><strong>{users.length}</strong><small>seçili müşteri</small></article>
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
