'use client';

import { useEffect,useState } from 'react';

type Row={keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number};
type Site={siteUrl?:string;permissionLevel?:string};
type Performance={matched?:boolean;siteUrl?:string;permissionLevel?:string;days:number;message?:string;selectedSearchConsoleSiteUrl?:string|null;sites?:Site[];summary?:{clicks:number;impressions:number;ctr:number;position:number|null};queries?:Row[];pages?:Row[]};

const api='/api/growth';

export default function SearchConsolePanel({projectId}:{projectId:string|null}){
  const[days,setDays]=useState(28);
  const[data,setData]=useState<Performance|null>(null);
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');
  const[selectedSite,setSelectedSite]=useState('');

  async function load(targetProjectId=projectId,targetDays=days){
    if(!targetProjectId){setData(null);return;}
    setLoading(true);setError('');
    try{
      const response=await fetch(`${api}/workspaces/me/projects/${targetProjectId}/search-console/performance?days=${targetDays}`,{cache:'no-store'});
      const body=await response.json() as Performance&{error?:string};
      if(!response.ok)throw new Error(body.error||'Search Console verisi okunamadı.');
      setData(body);
      setSelectedSite(body.selectedSearchConsoleSiteUrl||'');
    }catch(e){setData(null);setError(e instanceof Error?e.message:'Search Console verisi okunamadı.');}
    finally{setLoading(false);}
  }

  useEffect(()=>{void load(projectId,days)},[projectId,days]);

  async function selectSite(){
    if(!projectId||!selectedSite||saving)return;
    setSaving(true);setError('');
    try{
      const response=await fetch(`${api}/workspaces/me/projects/${projectId}/search-console/select`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({siteUrl:selectedSite})});
      const body=await response.json() as {error?:string};
      if(!response.ok)throw new Error(body.error||'Search Console property kaydedilemedi.');
      await load(projectId,days);
    }catch(e){setError(e instanceof Error?e.message:'Search Console property kaydedilemedi.');}
    finally{setSaving(false);}
  }

  const fmt=(n:number)=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(n||0);

  if(!projectId)return <div className="empty">Önce bir proje seç.</div>;
  return <div className="moduleStack">
    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">SEO / Search Performance</p><h2>Google Search Console</h2></div><select value={days} onChange={e=>setDays(Number(e.target.value))} disabled={loading||saving}><option value={7}>7 gün</option><option value={28}>28 gün</option><option value={60}>60 gün</option><option value={90}>90 gün</option></select></div>
      {loading&&<div className="moduleLoading"><span/> Search Console verileri okunuyor…</div>}
      {error&&<div className="error">{error}</div>}
      {data?.matched&&<div className="moduleFoot">{data.siteUrl} · {data.permissionLevel||'erişim mevcut'}</div>}
      {data&&!data.matched&&<div className="empty"><b>Search Console property otomatik eşleşmedi.</b> {data.message}<div style={{display:'flex',gap:10,alignItems:'center',justifyContent:'center',flexWrap:'wrap',marginTop:14}}><select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)} disabled={saving}><option value="">Property seç</option>{(data.sites||[]).map(site=><option key={site.siteUrl} value={site.siteUrl}>{site.siteUrl} · {site.permissionLevel||'erişim mevcut'}</option>)}</select><button className="primaryAction" onClick={selectSite} disabled={!selectedSite||saving}>{saving?'Kaydediliyor…':'Property Eşle'}</button></div><small style={{display:'block',marginTop:10}}>{data.sites?.length||0} erişilebilir property bulundu.</small></div>}
    </section>
    {data?.matched&&data.summary&&<>
      <section className="metricTiles"><div className="kpi"><span>Tıklama</span><strong>{fmt(data.summary.clicks)}</strong></div><div className="kpi"><span>Gösterim</span><strong>{fmt(data.summary.impressions)}</strong></div><div className="kpi"><span>CTR</span><strong>%{fmt(data.summary.ctr*100)}</strong></div><div className="kpi"><span>Ort. Konum</span><strong>{data.summary.position==null?'—':fmt(data.summary.position)}</strong></div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Queries</p><h2>En güçlü arama sorguları</h2></div><span>{data.queries?.length||0} kayıt</span></div><div className="dataTable"><div className="dataHead"><span>Sorgu</span><span>Tıklama</span><span>Gösterim</span><span>CTR</span><span>Konum</span></div>{(data.queries||[]).slice(0,50).map((r,i)=><div className="dataRow" key={`${r.keys?.[0]}-${i}`}><span><b>{r.keys?.[0]||'—'}</b></span><span>{fmt(r.clicks||0)}</span><span>{fmt(r.impressions||0)}</span><span>%{fmt((r.ctr||0)*100)}</span><span>{fmt(r.position||0)}</span></div>)}</div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Landing Pages</p><h2>Organik sayfa performansı</h2></div><span>{data.pages?.length||0} kayıt</span></div><div className="dataTable"><div className="dataHead"><span>Sayfa</span><span>Tıklama</span><span>Gösterim</span><span>CTR</span><span>Konum</span></div>{(data.pages||[]).slice(0,50).map((r,i)=><div className="dataRow" key={`${r.keys?.[0]}-${i}`}><span><b>{r.keys?.[0]||'—'}</b></span><span>{fmt(r.clicks||0)}</span><span>{fmt(r.impressions||0)}</span><span>%{fmt((r.ctr||0)*100)}</span><span>{fmt(r.position||0)}</span></div>)}</div></section>
    </>}
  </div>;
}
