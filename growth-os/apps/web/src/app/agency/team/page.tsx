'use client';

import { FormEvent, useEffect, useState } from 'react';

type MePayload={actor:{workspaceId:string;role:string;email:string};workspace?:{name?:string}|null};
type Member={id:string;email:string;display_name?:string;role:string;status:string;created_at?:string};
type WorkspacePayload={members?:Member[]};

const api='/api/growth';

export default function AgencyTeamPage(){
  const [me,setMe]=useState<MePayload|null>(null);
  const [members,setMembers]=useState<Member[]>([]);
  const [email,setEmail]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [role,setRole]=useState<'admin'|'analyst'|'viewer'>('viewer');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  async function load(){
    setLoading(true);setError('');
    try{
      const meRes=await fetch(`${api}/workspaces/me`,{cache:'no-store'});
      const mePayload=await meRes.json();
      if(!meRes.ok)throw new Error(mePayload?.error||'Workspace okunamadı.');
      setMe(mePayload);
      const detailRes=await fetch(`${api}/workspaces/${mePayload.actor.workspaceId}`,{cache:'no-store'});
      const detail=(await detailRes.json()) as WorkspacePayload&{error?:string};
      if(!detailRes.ok)throw new Error(detail.error||'Ekip bilgileri okunamadı.');
      setMembers(detail.members||[]);
    }catch(err){setError(err instanceof Error?err.message:'Ekip yönetimi yüklenemedi.')}finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[]);

  async function submit(event:FormEvent){
    event.preventDefault();
    if(!me?.actor.workspaceId||!email||saving)return;
    setSaving(true);setError('');setNotice('');
    try{
      const response=await fetch(`${api}/workspaces/${me.actor.workspaceId}/members`,{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({email,displayName:displayName||undefined,role})
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Ekip üyesi eklenemedi.');
      setEmail('');setDisplayName('');setRole('viewer');setNotice('Ekip üyesi kaydedildi.');
      await load();
    }catch(err){setError(err instanceof Error?err.message:'Ekip üyesi eklenemedi.')}finally{setSaving(false)}
  }

  const canManage=me?.actor.role==='owner';

  return <main className="teamScreen">
    <div className="teamShell">
      <header className="teamHeader">
        <div><small>AGENCY WORKSPACE</small><h1>Ekip ve Yetkiler</h1><p>Ajans ekibini workspace bazında yönet. Her rol yalnızca ihtiyaç duyduğu seviyede erişim alır.</p></div>
        <div className="teamNav"><a href="/agency/clients">Müşteriler</a><a href="/agency/settings">White-label</a><a href="/">Growth OS</a></div>
      </header>

      {loading?<div className="state">Ekip bilgileri yükleniyor…</div>:null}
      {error?<div className="error">{error}</div>:null}
      {notice?<div className="notice">{notice}</div>:null}

      {!loading&&me?<>
        <section className="summary">
          <article><span>Workspace</span><strong>{me.workspace?.name||'Growth OS'}</strong><small>{me.actor.role}</small></article>
          <article><span>Aktif Ekip</span><strong>{members.filter(item=>item.status==='active').length}</strong><small>workspace üyesi</small></article>
          <article><span>Yönetim Yetkisi</span><strong>{canManage?'Açık':'Salt okunur'}</strong><small>{canManage?'owner hesabı':'owner gerekli'}</small></article>
        </section>

        <section className="grid">
          <section className="panel">
            <div className="panelHead"><div><small>TEAM DIRECTORY</small><h2>Workspace üyeleri</h2></div><span>{members.length}</span></div>
            <div className="memberList">{members.length===0?<div className="empty">Henüz ekip üyesi bulunmuyor.</div>:members.map(member=><article key={member.id}><div><strong>{member.display_name||member.email}</strong><span>{member.email}</span></div><div><b>{member.role}</b><small>{member.status}</small></div></article>)}</div>
          </section>

          <aside className="panel">
            <div className="panelHead"><div><small>ACCESS CONTROL</small><h2>Üye ekle / rol güncelle</h2></div></div>
            <div className="roleGrid">
              <div><b>admin</b><span>Workspace ayarları ve müşteri erişimlerini yönetir.</span></div>
              <div><b>analyst</b><span>Audit ve operasyonel çalışma yapabilir; yönetim ayarlarını değiştiremez.</span></div>
              <div><b>viewer</b><span>Verileri ve sonuçları görüntüler; değişiklik yapamaz.</span></div>
            </div>
            <form className="form" onSubmit={submit}>
              <label><span>E-posta</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ekip@ajans.com" required disabled={!canManage||saving}/></label>
              <label><span>Ad Soyad</span><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="İsteğe bağlı" disabled={!canManage||saving}/></label>
              <label><span>Rol</span><select value={role} onChange={e=>setRole(e.target.value as 'admin'|'analyst'|'viewer')} disabled={!canManage||saving}><option value="viewer">viewer</option><option value="analyst">analyst</option><option value="admin">admin</option></select></label>
              <button disabled={!canManage||saving}>{saving?'Kaydediliyor…':'Ekip Üyesini Kaydet'}</button>
            </form>
            {!canManage?<div className="hint">Ekip üyeliği ve rol değişiklikleri yalnızca workspace owner tarafından yapılabilir.</div>:null}
          </aside>
        </section>
      </>:null}
    </div>

    <style jsx>{`
      .teamScreen{min-height:100vh;background:radial-gradient(circle at 88% 0%,#26123a 0,transparent 28%),linear-gradient(180deg,#09070d,#100a17 55%,#08060b);color:#f5effa;padding:24px}.teamShell{max-width:1380px;margin:0 auto}.teamHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:12px 0 28px;border-bottom:1px solid rgba(255,255,255,.08)}.teamHeader small,.panelHead small{font-size:10px;letter-spacing:.14em;color:#9d8dac}.teamHeader h1{font-size:42px;letter-spacing:-.04em;margin:8px 0 10px}.teamHeader p{margin:0;color:#aa9eb8;line-height:1.65;max-width:720px}.teamNav{display:flex;gap:8px;flex-wrap:wrap}.teamNav a{color:#d9cbed;text-decoration:none;border:1px solid #3a2d49;border-radius:12px;padding:10px 12px;font-size:12px}.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:24px 0 14px}.summary article,.panel{border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#120d1a,#0c0911);border-radius:20px}.summary article{padding:17px}.summary span,.summary small{display:block;color:#8f829b;font-size:10px}.summary strong{display:block;font-size:22px;margin:7px 0}.grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(340px,.8fr);gap:14px}.panel{padding:20px}.panelHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.panelHead h2{font-size:22px;margin:5px 0 0}.panelHead>span{border:1px solid #3a2d49;border-radius:999px;padding:5px 8px;color:#9588a0;font-size:10px}.memberList{display:grid;gap:8px}.memberList article{display:flex;justify-content:space-between;gap:16px;align-items:center;border:1px solid #2d2238;background:#0d0913;border-radius:13px;padding:13px}.memberList article>div{display:grid;gap:3px}.memberList strong{font-size:13px}.memberList span,.memberList small{font-size:10px;color:#887c92}.memberList b{font-size:10px;color:#d7c5eb;text-transform:uppercase}.roleGrid{display:grid;gap:8px;margin-bottom:16px}.roleGrid div{border:1px solid #2d2238;background:#0d0913;border-radius:12px;padding:12px}.roleGrid b{display:block;font-size:11px;color:#d8c8e8;margin-bottom:4px}.roleGrid span{font-size:10px;color:#8f8399;line-height:1.5}.form{display:grid;gap:12px}.form label{display:grid;gap:6px}.form label>span{font-size:10px;color:#aa9eb7}.form input,.form select{box-sizing:border-box;width:100%;background:#0b0810;border:1px solid #342641;color:#f2ecf6;border-radius:11px;padding:11px 12px;font:inherit;font-size:12px}.form button{appearance:none;border:1px solid #7651a0;background:linear-gradient(135deg,#6d42a3,#3e275b);color:#fff;border-radius:11px;padding:12px 14px;font:inherit;font-weight:800;cursor:pointer}.form button:disabled,.form input:disabled,.form select:disabled{opacity:.45;cursor:not-allowed}.state,.error,.notice,.hint,.empty{border-radius:11px;padding:11px 13px;font-size:11px}.state,.empty,.hint{border:1px solid #342641;color:#94889d}.error{border:1px solid #603044;background:#1b0f16;color:#e6a3b2}.notice{border:1px solid #31523d;background:#0d1911;color:#9addaf}.state,.error,.notice{margin-top:18px}.hint{margin-top:12px}@media(max-width:900px){.teamScreen{padding:16px}.teamHeader{display:grid}.teamHeader h1{font-size:34px}.summary{grid-template-columns:1fr 1fr}.summary article:first-child{grid-column:1/-1}.grid{grid-template-columns:1fr}}@media(max-width:520px){.teamScreen{padding:12px}.teamHeader h1{font-size:30px}.teamNav a{flex:1;text-align:center}.summary{grid-template-columns:1fr}.summary article:first-child{grid-column:auto}.panel{padding:14px}.memberList article{align-items:flex-start}.memberList article>div:last-child{text-align:right}}
    `}</style>
  </main>;
}
