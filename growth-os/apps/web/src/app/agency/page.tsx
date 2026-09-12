'use client';

import { useEffect, useState } from 'react';

type MePayload={
  actor:{workspaceId:string;role:string;email:string};
  workspace?:{name?:string;plan?:string}|null;
  branding?:{brand_name?:string}|null;
};
type DetailPayload={
  clients?:Array<{id:string;status?:string}>;
  members?:Array<{id:string;status?:string}>;
  projects?:Array<{id:string}>;
};

const api='/api/growth';

export default function AgencyHomePage(){
  const [me,setMe]=useState<MePayload|null>(null);
  const [detail,setDetail]=useState<DetailPayload|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const meRes=await fetch(`${api}/workspaces/me`,{cache:'no-store'});
        const mePayload=await meRes.json();
        if(!meRes.ok)throw new Error(mePayload?.error||'Workspace bilgisi okunamadı.');
        const detailRes=await fetch(`${api}/workspaces/${mePayload.actor.workspaceId}`,{cache:'no-store'});
        const detailPayload=await detailRes.json();
        if(!detailRes.ok)throw new Error(detailPayload?.error||'Ajans workspace bilgileri okunamadı.');
        if(!active)return;
        setMe(mePayload);setDetail(detailPayload);
      }catch(err){if(active)setError(err instanceof Error?err.message:'Ajans merkezi yüklenemedi.')}finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[]);

  const brand=me?.branding?.brand_name||me?.workspace?.name||'Growth OS';
  const activeClients=detail?.clients?.filter(item=>item.status!=='inactive').length||0;
  const activeMembers=detail?.members?.filter(item=>item.status==='active').length||0;
  const projects=detail?.projects?.length||0;

  return <main className="agencyScreen">
    <div className="agencyShell">
      <header className="agencyHeader">
        <div><small>AGENCY WORKSPACE</small><h1>{brand}</h1><p>Müşteri yönetimi, ekip erişimleri ve white-label ayarları için merkezi kontrol alanı.</p></div>
        <a href="/">Growth OS’a dön</a>
      </header>

      {loading?<div className="state">Workspace yükleniyor…</div>:null}
      {error?<div className="error">{error}</div>:null}

      {!loading&&!error&&me?<>
        <section className="summary">
          <article><span>Workspace Rolü</span><strong>{me.actor.role}</strong><small>{me.actor.email}</small></article>
          <article><span>Aktif Müşteri</span><strong>{activeClients}</strong><small>workspace içinde</small></article>
          <article><span>Projeler</span><strong>{projects}</strong><small>bağlı proje</small></article>
          <article><span>Aktif Ekip</span><strong>{activeMembers}</strong><small>workspace üyesi</small></article>
        </section>

        <section className="cards">
          <a href="/agency/clients"><small>CLIENT OPERATIONS</small><h2>Müşteri Yönetimi</h2><p>Müşterileri, portal kullanıcılarını ve güvenli davet bağlantılarını yönet.</p><span>Yönetimi aç →</span></a>
          <a href="/agency/team"><small>ACCESS CONTROL</small><h2>Ekip ve Yetkiler</h2><p>Owner, admin, analyst ve viewer erişimlerini workspace seviyesinde kontrol et.</p><span>Ekibi aç →</span></a>
          <a href="/agency/settings"><small>WHITE-LABEL</small><h2>Marka Ayarları</h2><p>Müşteri portalı için ajans adı, logo, renk, özel domain ve rapor imzasını yönet.</p><span>Ayarları aç →</span></a>
        </section>

        <section className="guardrail">
          <div><small>OPERATING MODEL</small><h3>Ajans katmanı güvenli sınırlar içinde çalışıyor.</h3></div>
          <p>Workspace izolasyonu, rol bazlı erişim ve müşteri portalı ayrımı aktif. Harici reklam veya ticaret sistemlerinde otomatik yazma kapalı kalmaya devam eder.</p>
        </section>
      </>:null}
    </div>

    <style jsx>{`
      .agencyScreen{min-height:100vh;background:radial-gradient(circle at 88% 0%,#28133d 0,transparent 30%),linear-gradient(180deg,#09070d,#100a17 55%,#08060b);color:#f5effa;padding:24px}.agencyShell{max-width:1380px;margin:0 auto}.agencyHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:12px 0 28px;border-bottom:1px solid rgba(255,255,255,.08)}.agencyHeader small,.cards small,.guardrail small{font-size:10px;letter-spacing:.14em;color:#9d8dac}.agencyHeader h1{font-size:44px;letter-spacing:-.045em;margin:8px 0 10px}.agencyHeader p{margin:0;color:#aa9eb8;line-height:1.65;max-width:720px}.agencyHeader>a{color:#d9cbed;text-decoration:none;border:1px solid #3a2d49;border-radius:12px;padding:10px 12px;font-size:12px}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:24px 0 14px}.summary article,.cards a,.guardrail{border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#120d1a,#0c0911);border-radius:20px}.summary article{padding:17px}.summary span,.summary small{display:block;color:#8f829b;font-size:10px}.summary strong{display:block;font-size:22px;margin:7px 0}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.cards a{display:block;color:#f5effa;text-decoration:none;padding:22px;transition:transform .18s ease,border-color .18s ease}.cards a:hover{transform:translateY(-2px);border-color:#68498a}.cards h2{font-size:23px;margin:9px 0 8px}.cards p{color:#9e91aa;font-size:12px;line-height:1.65;min-height:58px}.cards span{display:block;margin-top:18px;color:#d8c8e8;font-size:11px;font-weight:800}.guardrail{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:20px;align-items:center;margin-top:14px;padding:20px}.guardrail h3{font-size:21px;margin:7px 0 0}.guardrail p{margin:0;color:#9d90a9;font-size:12px;line-height:1.65}.state,.error{margin-top:18px;border-radius:11px;padding:12px 14px;font-size:11px}.state{border:1px solid #342641;color:#94889d}.error{border:1px solid #603044;background:#1b0f16;color:#e6a3b2}@media(max-width:900px){.agencyScreen{padding:16px}.agencyHeader{display:grid}.agencyHeader h1{font-size:35px}.summary{grid-template-columns:1fr 1fr}.cards{grid-template-columns:1fr}.cards p{min-height:0}.guardrail{grid-template-columns:1fr}}@media(max-width:520px){.agencyScreen{padding:12px}.agencyHeader h1{font-size:30px}.agencyHeader>a{text-align:center}.summary{grid-template-columns:1fr}.cards a,.guardrail{padding:16px}}
    `}</style>
  </main>;
}
