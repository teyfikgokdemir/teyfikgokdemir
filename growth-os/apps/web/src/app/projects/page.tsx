'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './projects.module.css';

type Actor={email:string;workspaceId:string;role:'owner'|'admin'|'analyst'|'viewer'};
type WorkspaceMe={actor:Actor;workspace?:{id:string;name:string}|null};
type Project={
  id:string;
  name:string;
  domain:string;
  status:'active'|'archived'|string;
  archived_at?:string|null;
  archived_by?:string|null;
  created_at?:string;
  client_name?:string|null;
};

type Tab='active'|'archived';

const api='/api/growth';

export default function ProjectsPage(){
  const [actor,setActor]=useState<Actor|null>(null);
  const [projects,setProjects]=useState<Project[]>([]);
  const [tab,setTab]=useState<Tab>('active');
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [deleteProject,setDeleteProject]=useState<Project|null>(null);
  const [confirmName,setConfirmName]=useState('');

  const canManage=actor?.role==='owner'||actor?.role==='admin';
  const isOwner=actor?.role==='owner';

  async function load(){
    setLoading(true);
    setError('');
    try{
      const meRes=await fetch(`${api}/workspaces/me`,{cache:'no-store'});
      const me=await meRes.json() as WorkspaceMe&{error?:string};
      if(!meRes.ok||!me.actor)throw new Error(me.error||'Workspace bilgisi alınamadı.');
      setActor(me.actor);
      const listRes=await fetch(`${api}/workspaces/${me.actor.workspaceId}/project-lifecycle?includeArchived=true`,{cache:'no-store'});
      const list=await listRes.json() as {projects?:Project[];error?:string};
      if(!listRes.ok)throw new Error(list.error||'Projeler alınamadı.');
      setProjects(list.projects||[]);
    }catch(e){
      setError(e instanceof Error?e.message:'Projeler yüklenemedi.');
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);
  useEffect(()=>{setSelected(new Set())},[tab]);

  const activeCount=projects.filter(p=>p.status!=='archived').length;
  const archivedCount=projects.filter(p=>p.status==='archived').length;
  const visible=useMemo(()=>{
    const q=search.trim().toLocaleLowerCase('tr-TR');
    return projects.filter(p=>(tab==='archived'?p.status==='archived':p.status!=='archived')&&(!q||`${p.name} ${p.domain} ${p.client_name||''}`.toLocaleLowerCase('tr-TR').includes(q)));
  },[projects,tab,search]);

  const allVisibleSelected=visible.length>0&&visible.every(p=>selected.has(p.id));

  function toggle(id:string){
    setSelected(prev=>{
      const next=new Set(prev);
      if(next.has(id))next.delete(id);else next.add(id);
      return next;
    });
  }

  function toggleAll(){
    setSelected(prev=>{
      const next=new Set(prev);
      if(allVisibleSelected)visible.forEach(p=>next.delete(p.id));
      else visible.forEach(p=>next.add(p.id));
      return next;
    });
  }

  async function bulk(action:'archive'|'restore'){
    if(!actor||selected.size===0||saving)return;
    setSaving(true);setError('');setNotice('');
    try{
      const ids=[...selected];
      const res=await fetch(`${api}/workspaces/${actor.workspaceId}/project-lifecycle/bulk/${action}`,{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectIds:ids})
      });
      const data=await res.json() as {changed?:number;error?:string};
      if(!res.ok)throw new Error(data.error||'Toplu işlem tamamlanamadı.');
      setNotice(action==='archive'?`${data.changed??ids.length} proje arşivlendi.`:`${data.changed??ids.length} proje aktif listeye geri alındı.`);
      setSelected(new Set());
      await load();
    }catch(e){setError(e instanceof Error?e.message:'Toplu işlem tamamlanamadı.')}finally{setSaving(false)}
  }

  async function restoreOne(project:Project){
    if(!actor||saving)return;
    setSaving(true);setError('');setNotice('');
    try{
      const res=await fetch(`${api}/workspaces/${actor.workspaceId}/project-lifecycle/${project.id}/restore`,{method:'POST'});
      const data=await res.json() as {error?:string};
      if(!res.ok)throw new Error(data.error||'Proje geri alınamadı.');
      setNotice(`${project.name} aktif projelere geri alındı.`);
      setSelected(new Set());
      await load();
    }catch(e){setError(e instanceof Error?e.message:'Proje geri alınamadı.')}finally{setSaving(false)}
  }

  async function permanentDelete(){
    if(!actor||!deleteProject||!isOwner||saving)return;
    setSaving(true);setError('');setNotice('');
    try{
      const res=await fetch(`${api}/workspaces/${actor.workspaceId}/project-lifecycle/${deleteProject.id}`,{
        method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({confirmName})
      });
      const data=await res.json() as {error?:string};
      if(!res.ok)throw new Error(data.error||'Proje kalıcı olarak silinemedi.');
      setNotice(`${deleteProject.name} kalıcı olarak silindi.`);
      setDeleteProject(null);setConfirmName('');
      await load();
    }catch(e){setError(e instanceof Error?e.message:'Proje silinemedi.')}finally{setSaving(false)}
  }

  function openProject(project:Project){
    window.sessionStorage.setItem('growth-os:last-section','Genel Bakış');
    window.location.assign(`/?project=${encodeURIComponent(project.id)}`);
  }

  return <main className={styles.page}>
    <aside className={styles.side}>
      <a className={styles.brand} href="/" onClick={()=>window.sessionStorage.setItem('growth-os:last-section','Genel Bakış')}><span>G</span><div><strong>Growth OS</strong><small>Private Control Center</small></div></a>
      <nav>
        <a href="/" onClick={()=>window.sessionStorage.setItem('growth-os:last-section','Genel Bakış')}>Genel Bakış</a>
        <a className={styles.active} href="/projects">Projeler</a>
        <a href="/agency">Ajans Merkezi</a>
      </nav>
      <div className={styles.sideFoot}>Core online · Project Lifecycle</div>
    </aside>

    <section className={styles.content}>
      <header className={styles.header}>
        <div><p>PROJECT OPERATIONS</p><h1>Projeler</h1><span>Aktif portföyü temiz tut; biten işleri arşivle, gerektiğinde geri al.</span></div>
        <a href="/" onClick={()=>window.sessionStorage.setItem('growth-os:last-section','Genel Bakış')}>Kontrol Merkezine Dön</a>
      </header>

      <section className={styles.stats}>
        <article><span>Aktif</span><strong>{activeCount}</strong><small>çalışan proje</small></article>
        <article><span>Arşiv</span><strong>{archivedCount}</strong><small>geçmiş proje</small></article>
        <article><span>Toplam</span><strong>{projects.length}</strong><small>workspace kaydı</small></article>
        <article><span>Yetki</span><strong>{actor?.role||'—'}</strong><small>{canManage?'arşiv yönetebilir':'salt okunur'}</small></article>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbarTop}>
          <div className={styles.tabs}>
            <button className={tab==='active'?styles.tabActive:''} onClick={()=>setTab('active')}>Aktif Projeler <b>{activeCount}</b></button>
            <button className={tab==='archived'?styles.tabActive:''} onClick={()=>setTab('archived')}>Arşiv <b>{archivedCount}</b></button>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Proje, domain veya müşteri ara…" />
        </div>

        {error&&<div className={styles.error}>{error}<button onClick={()=>setError('')}>×</button></div>}
        {notice&&<div className={styles.notice}>{notice}<button onClick={()=>setNotice('')}>×</button></div>}

        {canManage&&visible.length>0&&<div className={styles.bulkbar}>
          <label><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll}/><span>{allVisibleSelected?'Tüm seçimleri kaldır':'Görünenlerin tümünü seç'}</span></label>
          <strong>{selected.size} seçili</strong>
          <div>
            {tab==='active'?<button disabled={selected.size===0||saving} onClick={()=>bulk('archive')}>{saving?'İşleniyor…':'Seçilenleri Arşivle'}</button>:<button disabled={selected.size===0||saving} onClick={()=>bulk('restore')}>{saving?'İşleniyor…':'Seçilenleri Geri Al'}</button>}
          </div>
        </div>}

        {loading?<div className={styles.empty}>Projeler yükleniyor…</div>:visible.length===0?<div className={styles.empty}>{tab==='active'?'Aktif proje bulunamadı.':'Arşivde proje yok.'}</div>:<div className={styles.list}>
          <div className={styles.listHead}><span>Seç</span><span>Proje</span><span>Müşteri</span><span>Durum</span><span>Tarih</span><span>İşlem</span></div>
          {visible.map(project=><article key={project.id} className={styles.row}>
            <div className={styles.check}>{canManage&&<input type="checkbox" checked={selected.has(project.id)} onChange={()=>toggle(project.id)}/>}</div>
            <div className={styles.project}><div>{project.domain.slice(0,1).toUpperCase()}</div><span><strong>{project.name}</strong><small>{project.domain}</small></span></div>
            <div className={styles.client}>{project.client_name||'—'}</div>
            <div><span className={project.status==='archived'?styles.archived:styles.live}>{project.status==='archived'?'ARŞİV':'AKTİF'}</span></div>
            <div className={styles.date}>{project.status==='archived'&&project.archived_at?new Date(project.archived_at).toLocaleDateString('tr-TR'):project.created_at?new Date(project.created_at).toLocaleDateString('tr-TR'):'—'}</div>
            <div className={styles.actions}>
              {project.status!=='archived'&&<button onClick={()=>openProject(project)}>Aç</button>}
              {project.status==='archived'&&canManage&&<button disabled={saving} onClick={()=>restoreOne(project)}>Geri Al</button>}
              {project.status==='archived'&&isOwner&&<button className={styles.danger} onClick={()=>{setDeleteProject(project);setConfirmName('')}}>Kalıcı Sil</button>}
            </div>
          </article>)}
        </div>}
      </section>

      <section className={styles.info}><strong>Arşiv varsayılan işlemdir.</strong><span>Arşivlenen projeler aktif portföyden çıkar; geçmiş audit, rapor ve kanıt verileri korunur. Kalıcı silme yalnızca owner rolüyle ve proje adı doğrulamasıyla yapılabilir.</span></section>
    </section>

    {deleteProject&&<div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <span className={styles.dangerTag}>DANGER ZONE</span>
        <h2>{deleteProject.name} kalıcı olarak silinsin mi?</h2>
        <p>Bu işlem geri alınamaz. Projeye bağlı audit, entegrasyon, öneri ve execution geçmişi veritabanından kaldırılır.</p>
        <label>Onaylamak için proje adını aynen yaz<input autoFocus value={confirmName} onChange={e=>setConfirmName(e.target.value)} placeholder={deleteProject.name}/></label>
        <div><button onClick={()=>{setDeleteProject(null);setConfirmName('')}}>Vazgeç</button><button className={styles.confirmDelete} disabled={confirmName.trim()!==deleteProject.name.trim()||saving} onClick={permanentDelete}>{saving?'Siliniyor…':'Kalıcı Olarak Sil'}</button></div>
      </div>
    </div>}
  </main>;
}
