'use client';

import { FormEvent, useEffect, useState } from 'react';

type WorkspacePayload={
  actor:{workspaceId:string;role:string;email:string};
  workspace?:{id:string;name:string;plan?:string}|null;
  branding?:{brand_name?:string;logo_url?:string;primary_color?:string;accent_color?:string;custom_domain?:string;report_footer?:string}|null;
};

const api='/api/growth';

export default function AgencySettingsPage(){
  const [data,setData]=useState<WorkspacePayload|null>(null);
  const [brandName,setBrandName]=useState('');
  const [logoUrl,setLogoUrl]=useState('');
  const [primaryColor,setPrimaryColor]=useState('#8b5cf6');
  const [accentColor,setAccentColor]=useState('#c4b5fd');
  const [customDomain,setCustomDomain]=useState('');
  const [reportFooter,setReportFooter]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const response=await fetch(`${api}/workspaces/me`,{cache:'no-store'});
        const payload=await response.json();
        if(!response.ok)throw new Error(payload?.error||'Workspace ayarları okunamadı.');
        if(!active)return;
        setData(payload);
        const branding=payload.branding||{};
        setBrandName(branding.brand_name||payload.workspace?.name||'Growth OS');
        setLogoUrl(branding.logo_url||'');
        setPrimaryColor(branding.primary_color||'#8b5cf6');
        setAccentColor(branding.accent_color||'#c4b5fd');
        setCustomDomain(branding.custom_domain||'');
        setReportFooter(branding.report_footer||'');
      }catch(err){if(active)setError(err instanceof Error?err.message:'Workspace ayarları yüklenemedi.')}finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[]);

  async function save(event:FormEvent){
    event.preventDefault();
    if(!data?.actor.workspaceId)return;
    setSaving(true);setError('');setNotice('');
    try{
      const response=await fetch(`${api}/workspaces/${data.actor.workspaceId}/branding`,{
        method:'PUT',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          brandName:brandName||null,
          logoUrl:logoUrl||null,
          primaryColor:primaryColor||null,
          accentColor:accentColor||null,
          customDomain:customDomain||null,
          reportFooter:reportFooter||null
        })
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload?.error||'Marka ayarları kaydedilemedi.');
      setNotice('White-label marka ayarları kaydedildi. Müşteri portalı bu değerleri kullanacak.');
    }catch(err){setError(err instanceof Error?err.message:'Marka ayarları kaydedilemedi.')}finally{setSaving(false)}
  }

  const previewBrand=brandName||data?.workspace?.name||'Growth OS';

  return <main className="settingsScreen">
    <div className="settingsShell">
      <header className="settingsHeader">
        <div><small>AGENCY WORKSPACE</small><h1>White-label Ayarları</h1><p>Müşteri portalında görünen marka adı, logo, renkler ve rapor imzasını tek yerden yönet.</p></div>
        <div className="headerActions"><a href="/agency/clients">Müşteri Yönetimi</a><a href="/">Growth OS’a dön</a></div>
      </header>

      {loading?<div className="stateBox">Workspace ayarları yükleniyor…</div>:null}
      {error?<div className="errorBox">{error}</div>:null}
      {notice?<div className="noticeBox">{notice}</div>:null}

      {!loading&&data?<div className="settingsGrid">
        <form className="settingsPanel" onSubmit={save}>
          <div className="panelTitle"><small>BRAND SYSTEM</small><h2>Ajans kimliği</h2><p>Bu bilgiler müşteri portalının üst alanı ve rapor yüzeylerinde kullanılır.</p></div>

          <label><span>Marka adı</span><input value={brandName} onChange={e=>setBrandName(e.target.value)} maxLength={100} placeholder="Ajans adı"/></label>
          <label><span>Logo URL</span><input value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://..."/></label>

          <div className="colorGrid">
            <label><span>Ana renk</span><div className="colorInput"><input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)}/><input value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} pattern="#[0-9A-Fa-f]{6}"/></div></label>
            <label><span>Vurgu rengi</span><div className="colorInput"><input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)}/><input value={accentColor} onChange={e=>setAccentColor(e.target.value)} pattern="#[0-9A-Fa-f]{6}"/></div></label>
          </div>

          <label><span>Özel domain</span><input value={customDomain} onChange={e=>setCustomDomain(e.target.value)} placeholder="portal.ajansiniz.com"/><small className="hint">DNS bağlama ayrı bir deployment adımıdır; bu alan şimdilik white-label domain kaydıdır.</small></label>
          <label><span>Rapor alt bilgisi</span><textarea value={reportFooter} onChange={e=>setReportFooter(e.target.value)} maxLength={500} rows={4} placeholder="Ajans adı · Müşteri raporu"/></label>

          <button className="saveButton" disabled={saving||!['owner','admin'].includes(data.actor.role)}>{saving?'Kaydediliyor…':'Marka Ayarlarını Kaydet'}</button>
          {!['owner','admin'].includes(data.actor.role)?<small className="hint">Bu alanı değiştirmek için admin veya owner rolü gerekir.</small>:null}
        </form>

        <aside className="previewPanel" style={{'--preview-primary':primaryColor,'--preview-accent':accentColor} as React.CSSProperties}>
          <small>CANLI ÖNİZLEME</small>
          <div className="previewCard">
            <div className="previewBrand">
              {logoUrl?<img src={logoUrl} alt="Logo önizleme"/>:<div className="previewMark">{previewBrand.slice(0,1).toUpperCase()}</div>}
              <div><span>MÜŞTERİ PORTALI</span><strong>{previewBrand}</strong></div>
            </div>
            <div className="previewHero"><span>PERFORMANS MERKEZİ</span><h3>Markanız için net büyüme görünümü.</h3><p>Performans, açık aksiyonlar ve doğrulanmış sonuçlar tek yerde.</p></div>
            <div className="previewStats"><div><span>30 Günlük Gelir</span><b>₺248.500</b></div><div><span>ROAS</span><b>4,8x</b></div></div>
            <footer>{reportFooter||`${previewBrand} · Growth OS tarafından desteklenir`}</footer>
          </div>
        </aside>
      </div>:null}
    </div>

    <style jsx>{`
      .settingsScreen{min-height:100vh;background:radial-gradient(circle at 85% 0%,#28133d 0,transparent 28%),linear-gradient(180deg,#09070d,#100a17 55%,#08060b);color:#f5effa;padding:24px;font-family:inherit}.settingsShell{max-width:1380px;margin:0 auto}.settingsHeader{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:12px 0 28px;border-bottom:1px solid rgba(255,255,255,.08)}.settingsHeader small,.panelTitle small,.previewPanel>small{font-size:10px;letter-spacing:.14em;color:#9d8dac}.settingsHeader h1{font-size:42px;letter-spacing:-.04em;margin:8px 0 10px}.settingsHeader p,.panelTitle p{margin:0;color:#aa9eb8;line-height:1.65}.headerActions{display:flex;gap:8px;flex-wrap:wrap}.headerActions a{color:#d9cbed;text-decoration:none;border:1px solid #3a2d49;border-radius:12px;padding:10px 12px;font-size:12px}.settingsGrid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.75fr);gap:18px;padding-top:24px}.settingsPanel,.previewPanel{border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#120d1a,#0c0911);border-radius:22px;padding:22px}.panelTitle{margin-bottom:18px}.panelTitle h2{font-size:24px;margin:5px 0 7px}.settingsPanel{display:grid;gap:14px}.settingsPanel label{display:grid;gap:7px}.settingsPanel label>span{font-size:11px;color:#b7a9c6}.settingsPanel input,.settingsPanel textarea{box-sizing:border-box;width:100%;background:#0b0810;border:1px solid #342641;color:#f3edf7;border-radius:12px;padding:12px 13px;outline:none;font:inherit;font-size:13px}.settingsPanel input:focus,.settingsPanel textarea:focus{border-color:#74509a}.colorGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.colorInput{display:grid;grid-template-columns:48px 1fr;gap:8px}.colorInput input[type=color]{padding:3px;height:44px}.hint{font-size:10px;color:#83778d;line-height:1.45}.saveButton{appearance:none;border:1px solid #7753a2;background:linear-gradient(135deg,#6d42a3,#3e275b);color:#fff;border-radius:12px;padding:13px 16px;font:inherit;font-weight:800;cursor:pointer}.saveButton:disabled{opacity:.45;cursor:not-allowed}.previewPanel{position:sticky;top:24px;align-self:start}.previewCard{margin-top:12px;border:1px solid color-mix(in srgb,var(--preview-primary) 40%,#352343);background:linear-gradient(150deg,color-mix(in srgb,var(--preview-primary) 12%,#171020),#0d0914);border-radius:20px;padding:18px;overflow:hidden}.previewBrand{display:flex;align-items:center;gap:10px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.08)}.previewBrand img,.previewMark{width:40px;height:40px;border-radius:12px;object-fit:cover}.previewMark{display:grid;place-items:center;background:linear-gradient(135deg,var(--preview-primary),#2b1b45);font-weight:900}.previewBrand div:last-child{display:grid;gap:2px}.previewBrand span,.previewHero span,.previewStats span{font-size:8px;color:#92849d;letter-spacing:.1em}.previewBrand strong{font-size:13px}.previewHero{padding:34px 0 26px}.previewHero h3{font-size:30px;line-height:1;letter-spacing:-.04em;margin:8px 0 10px}.previewHero p{color:#aa9db7;font-size:12px;line-height:1.55}.previewStats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.previewStats div{border:1px solid #30223d;border-radius:12px;padding:12px;background:#0d0913}.previewStats b{display:block;font-size:18px;margin-top:6px}.previewCard footer{padding-top:20px;text-align:center;color:#756b7c;font-size:9px}.stateBox,.errorBox,.noticeBox{margin-top:18px;border-radius:12px;padding:12px 14px;font-size:12px}.stateBox{border:1px solid #342641;color:#a99bb6}.errorBox{border:1px solid #603044;background:#1b0f16;color:#e6a3b2}.noticeBox{border:1px solid #31523d;background:#0d1911;color:#9addaf}@media(max-width:900px){.settingsScreen{padding:16px}.settingsHeader{display:grid}.settingsHeader h1{font-size:34px}.settingsGrid{grid-template-columns:1fr}.previewPanel{position:static}.colorGrid{grid-template-columns:1fr}}@media(max-width:520px){.settingsScreen{padding:12px}.settingsHeader h1{font-size:30px}.settingsPanel,.previewPanel{padding:15px;border-radius:18px}.headerActions a{flex:1;text-align:center}.previewHero h3{font-size:25px}.previewStats{grid-template-columns:1fr}}
    `}</style>
  </main>;
}
