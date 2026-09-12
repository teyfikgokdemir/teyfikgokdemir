'use client';

import { useEffect, useMemo, useState } from 'react';

type MePayload={actor:{workspaceId:string;role:string;email:string};workspace?:{name?:string;plan?:string}|null};
type DetailPayload={projects?:unknown[];clients?:unknown[];members?:Array<{status?:string}>;branding?:{custom_domain?:string}|null};

const api='/api/growth';

export default function AgencyPlanPage(){
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
        if(!meRes.ok)throw new Error(mePayload?.error||'Workspace okunamadı.');
        const detailRes=await fetch(`${api}/workspaces/${mePayload.actor.workspaceId}`,{cache:'no-store'});
        const detailPayload=await detailRes.json();
        if(!detailRes.ok)throw new Error(detailPayload?.error||'Kullanım bilgileri okunamadı.');
        if(!active)return;
        setMe(mePayload);setDetail(detailPayload);
      }catch(err){if(active)setError(err instanceof Error?err.message:'Plan bilgileri yüklenemedi.')}finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[]);

  const usage=useMemo(()=>({
    clients:Array.isArray(detail?.clients)?detail?.clients.length:0,
    projects:Array.isArray(detail?.projects)?detail?.projects.length:0,
    members:Array.isArray(detail?.members)?detail?.members.filter(item=>item.status!=='disabled').length:0,
    customDomain:Boolean(detail?.branding?.custom_domain)
  }),[detail]);

  const plan=me?.workspace?.plan||'internal';

  return <main className="planScreen"><div className="planShell">
    <header className="planHeader"><div><small>COMMERCIAL READINESS</small><h1>Plan ve Kullanım</h1><p>Workspace kapasitesini ve ürünleştirme için gerekli ticari sınırları tek ekranda izle.</p></div><nav><a href="/agency">Ajans Merkezi</a><a href="/agency/settings">White-label</a><a href="/agency/team">Ekip</a></nav></header>

    {loading?<div className="state">Kullanım bilgileri yükleniyor…</div>:null}
    {error?<div className="error">{error}</div>:null}

    {!loading&&me&&detail?<>
      <section className="hero"><div><span>AKTİF PLAN</span><strong>{plan.toUpperCase()}</strong><p>Bu workspace şu anda ticari faturalama olmadan çalışıyor. Aşağıdaki kullanım verileri gerçek workspace kayıtlarından hesaplanır.</p></div><div className="status">Billing <b>Kapalı</b><small>Henüz ücretlendirme entegrasyonu yok</small></div></section>

      <section className="usageGrid">
        <article><span>Müşteri</span><strong>{usage.clients}</strong><small>agency_clients</small></article>
        <article><span>Proje</span><strong>{usage.projects}</strong><small>workspace projeleri</small></article>
        <article><span>Ekip</span><strong>{usage.members}</strong><small>aktif workspace üyeleri</small></article>
        <article><span>Özel Domain</span><strong>{usage.customDomain?'Hazır':'Yok'}</strong><small>white-label kaydı</small></article>
      </section>

      <section className="grid">
        <section className="panel"><small>ENTITLEMENT MODEL</small><h2>Ticari pakete geçiş için hazır yapı</h2><div className="rows">
          <div><b>Müşteri limiti</b><span>Henüz zorunlu limit uygulanmıyor.</span></div>
          <div><b>Ekip koltuğu</b><span>Rol sistemi hazır; seat bazlı sınır henüz yok.</span></div>
          <div><b>White-label</b><span>Marka, renk ve özel domain kaydı mevcut.</span></div>
          <div><b>Client Portal</b><span>Müşteri bazlı erişim ve davet altyapısı mevcut.</span></div>
        </div></section>
        <section className="panel"><small>NEXT COMMERCIAL LAYER</small><h2>Henüz aktive edilmemiş alanlar</h2><div className="rows muted">
          <div><b>Plan limit enforcement</b><span>API seviyesinde müşteri / kullanıcı / kullanım kotası.</span></div>
          <div><b>Billing provider</b><span>Abonelik, tahsilat ve fatura yaşam döngüsü.</span></div>
          <div><b>Usage ledger</b><span>Audit, rapor, connector ve execution kullanım ölçümü.</span></div>
          <div><b>Upgrade / downgrade</b><span>Paket değişimlerinde güvenli entitlement senkronizasyonu.</span></div>
        </div></section>
      </section>

      <div className="note">Bu ekran bilgilendirme amaçlıdır; şu anda hiçbir ödeme alınmaz ve hiçbir mevcut erişim plan kotası nedeniyle engellenmez.</div>
    </>:null}
  </div><style jsx>{`
    .planScreen{min-height:100vh;background:radial-gradient(circle at 88% 0%,#28133f 0,transparent 28%),linear-gradient(180deg,#09070d,#100a17 55%,#08060b);color:#f5effa;padding:24px}.planShell{max-width:1380px;margin:0 auto}.planHeader{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:12px 0 28px;border-bottom:1px solid rgba(255,255,255,.08)}.planHeader small,.panel>small,.hero span{font-size:10px;letter-spacing:.14em;color:#9d8dac}.planHeader h1{font-size:42px;letter-spacing:-.04em;margin:8px 0 10px}.planHeader p{margin:0;color:#aa9eb8;line-height:1.65}.planHeader nav{display:flex;gap:8px;flex-wrap:wrap}.planHeader a{color:#d9cbed;text-decoration:none;border:1px solid #3a2d49;border-radius:12px;padding:10px 12px;font-size:12px}.hero{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;margin-top:24px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,#160f20,#0d0913);border-radius:22px;padding:22px}.hero strong{display:block;font-size:34px;margin:7px 0}.hero p{margin:0;color:#9c90a6;font-size:12px;max-width:760px;line-height:1.6}.status{min-width:180px;border:1px solid #3a2d49;border-radius:16px;padding:14px;color:#91859c;font-size:11px}.status b{display:block;color:#f0e9f5;font-size:18px;margin:6px 0}.status small{font-size:9px}.usageGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 0}.usageGrid article,.panel{border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#120d1a,#0c0911);border-radius:18px}.usageGrid article{padding:16px}.usageGrid span,.usageGrid small{display:block;color:#8f829b;font-size:10px}.usageGrid strong{display:block;font-size:24px;margin:7px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{padding:20px}.panel h2{font-size:22px;margin:6px 0 14px}.rows{display:grid;gap:8px}.rows div{border:1px solid #2d2238;background:#0d0913;border-radius:12px;padding:12px}.rows b{display:block;font-size:11px;color:#d9cae8;margin-bottom:4px}.rows span{font-size:10px;color:#8f8399;line-height:1.45}.rows.muted div{border-style:dashed}.note,.state,.error{margin-top:14px;border-radius:12px;padding:12px 14px;font-size:11px}.note,.state{border:1px solid #342641;color:#95899e}.error{border:1px solid #603044;background:#1b0f16;color:#e6a3b2}@media(max-width:900px){.planScreen{padding:16px}.planHeader{display:grid}.planHeader h1{font-size:34px}.hero{grid-template-columns:1fr}.usageGrid{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.status{min-width:0}}@media(max-width:520px){.planScreen{padding:12px}.planHeader h1{font-size:30px}.planHeader a{flex:1;text-align:center}.usageGrid{grid-template-columns:1fr}.hero,.panel{padding:15px}}
  `}</style></main>;
}
