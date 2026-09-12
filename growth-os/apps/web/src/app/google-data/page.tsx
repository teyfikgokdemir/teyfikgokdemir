'use client';

import { useEffect, useState } from 'react';

type Project={id:string;name:string;domain:string};
type GoogleResources={
  analytics?:{accountSummaries?:Array<{name?:string;displayName?:string;propertySummaries?:Array<{property?:string;displayName?:string;propertyType?:string;parent?:string}>}>};
  searchConsole?:{siteEntry?:Array<{siteUrl?:string;permissionLevel?:string}>};
  merchant?:{accounts?:Array<{name?:string;accountName?:string;timeZone?:{id?:string}}>;nextPageToken?:string};
  errors?:Record<string,string>;
};

const api='/api/growth';

export default function GoogleDataPage(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  const [data,setData]=useState<GoogleResources|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    fetch(`${api}/projects`,{cache:'no-store'}).then(async r=>{
      if(!r.ok)return;
      const rows=await r.json() as Project[];
      setProjects(rows);
      if(rows[0])setProjectId(rows[0].id);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(!projectId)return;
    setLoading(true);setError('');setData(null);
    fetch(`${api}/projects/${projectId}/integrations/google/resources`,{cache:'no-store'})
      .then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||'Google kaynakları okunamadı.');setData(body);})
      .catch(e=>setError(e instanceof Error?e.message:'Google kaynakları okunamadı.'))
      .finally(()=>setLoading(false));
  },[projectId]);

  const ga4=(data?.analytics?.accountSummaries||[]).flatMap(account=>(account.propertySummaries||[]).map(property=>({account:account.displayName||account.name||'Google Analytics',...property})));
  const gsc=data?.searchConsole?.siteEntry||[];
  const merchant=data?.merchant?.accounts||[];

  return <main style={{minHeight:'100vh',padding:'40px',background:'#0b0712',color:'#f6f0ff'}}>
    <section className="moduleCard" style={{maxWidth:1500,margin:'0 auto 24px'}}>
      <div className="reportHead compact"><div><p className="eyebrow">Google Data Hub</p><h2>Analytics, Search Console ve Merchant</h2></div><select value={projectId} onChange={e=>setProjectId(e.target.value)} style={{minWidth:280,padding:'12px 14px',borderRadius:14}}>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.domain}</option>)}</select></div>
      <div className="moduleFoot">Google Ads ayrı olarak Ads panelinde kalır. Bu ekran GA4, GSC ve Merchant kaynaklarını doğrulamak içindir.</div>
    </section>

    {loading&&<div className="moduleLoading" style={{maxWidth:1500,margin:'0 auto 24px'}}><span/> Google kaynakları okunuyor…</div>}
    {error&&<div className="error" style={{maxWidth:1500,margin:'0 auto 24px'}}>{error}</div>}

    <div style={{maxWidth:1500,margin:'0 auto',display:'grid',gap:24}}>
      <section className="moduleCard">
        <div className="reportHead compact"><div><p className="eyebrow">Analytics</p><h2>GA4 Properties</h2></div><span>{ga4.length} property</span></div>
        {data?.errors?.analytics&&<div className="error">{data.errors.analytics}</div>}
        {ga4.length===0?<div className="empty">Erişilebilir GA4 property bulunamadı.</div>:<div className="dataTable"><div className="dataHead"><span>Property</span><span>Account</span><span>Resource</span><span>Type</span><span>Durum</span></div>{ga4.map((p,i)=><div className="dataRow" key={`${p.property}-${i}`}><span><b>{p.displayName||'Adsız property'}</b></span><span>{p.account}</span><span>{p.property||'—'}</span><span>{p.propertyType||'GA4'}</span><span>ERİŞİLEBİLİR</span></div>)}</div>}
      </section>

      <section className="moduleCard">
        <div className="reportHead compact"><div><p className="eyebrow">SEO / Search Performance</p><h2>Google Search Console</h2></div><span>{gsc.length} site</span></div>
        {data?.errors?.searchConsole&&<div className="error">{data.errors.searchConsole}</div>}
        {gsc.length===0?<div className="empty">Erişilebilir Search Console property bulunamadı.</div>:<div className="dataTable"><div className="dataHead"><span>Site</span><span>Yetki</span><span></span><span></span><span>Durum</span></div>{gsc.map((s,i)=><div className="dataRow" key={`${s.siteUrl}-${i}`}><span><b>{s.siteUrl||'—'}</b></span><span>{s.permissionLevel||'—'}</span><span></span><span></span><span>ERİŞİLEBİLİR</span></div>)}</div>}
      </section>

      <section className="moduleCard">
        <div className="reportHead compact"><div><p className="eyebrow">Commerce</p><h2>Google Merchant Center</h2></div><span>{merchant.length} hesap</span></div>
        {data?.errors?.merchant&&<div className="error">{data.errors.merchant}</div>}
        {merchant.length===0?<div className="empty">Erişilebilir Merchant Center hesabı bulunamadı.</div>:<div className="dataTable"><div className="dataHead"><span>Hesap</span><span>Resource</span><span>Timezone</span><span></span><span>Durum</span></div>{merchant.map((m,i)=><div className="dataRow" key={`${m.name}-${i}`}><span><b>{m.accountName||m.name||'Merchant hesabı'}</b></span><span>{m.name||'—'}</span><span>{m.timeZone?.id||'—'}</span><span></span><span>ERİŞİLEBİLİR</span></div>)}</div>}
      </section>
    </div>
  </main>;
}
