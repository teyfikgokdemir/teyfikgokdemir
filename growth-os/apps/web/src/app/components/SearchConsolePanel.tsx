'use client';

import { useEffect,useRef,useState } from 'react';

type Row={keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number};
type Site={siteUrl?:string;permissionLevel?:string};
type Performance={partial?:boolean;detailCoverage?:string;matched?:boolean;siteUrl?:string;permissionLevel?:string;days:number;message?:string;selectedSearchConsoleSiteUrl?:string|null;sites?:Site[];summary?:{clicks:number;impressions:number;ctr:number;position:number|null};queries?:Row[];pages?:Row[]};

const api='/api/growth';

export default function SearchConsolePanel({projectId}:{projectId:string|null}){
  const[days,setDays]=useState(28);
  const[data,setData]=useState<Performance|null>(null);
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');
  const[selectedSite,setSelectedSite]=useState('');
  const loadGeneration=useRef(0);

  async function load(targetProjectId=projectId,targetDays=days,generation=loadGeneration.current){
    if(!targetProjectId){if(generation===loadGeneration.current){setData(null);setSelectedSite('');setLoading(false)}return;}
    if(generation===loadGeneration.current){setLoading(true);setError('');}
    try{
      const response=await fetch(`${api}/workspaces/me/projects/${targetProjectId}/search-console/performance?days=${targetDays}`,{cache:'no-store'});
      const body=await response.json() as Performance&{error?:string};
      if(!response.ok)throw new Error(body.error||'Search Console verisi okunamadı.');
      if(generation!==loadGeneration.current)return;
      setData(body);
      setSelectedSite(body.selectedSearchConsoleSiteUrl||body.siteUrl||'');
    }catch(e){
      if(generation!==loadGeneration.current)return;
      setData(null);setSelectedSite('');setError(e instanceof Error?e.message:'Search Console verisi okunamadı.');
    }finally{
      if(generation===loadGeneration.current)setLoading(false);
    }
  }

  useEffect(()=>{
    const generation=++loadGeneration.current;
    setData(null);setSelectedSite('');setError('');setSaving(false);
    void load(projectId,days,generation);
  },[projectId,days]);

  async function selectSite(){
    if(!projectId||!selectedSite||saving)return;
    const targetProjectId=projectId;
    const targetDays=days;
    const generation=loadGeneration.current;
    setSaving(true);setError('');
    try{
      const response=await fetch(`${api}/workspaces/me/projects/${targetProjectId}/search-console/select`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({siteUrl:selectedSite})});
      const body=await response.json() as {error?:string};
      if(!response.ok)throw new Error(body.error||'Search Console property kaydedilemedi.');
      if(generation!==loadGeneration.current)return;
      await load(targetProjectId,targetDays,generation);
    }catch(e){if(generation===loadGeneration.current)setError(e instanceof Error?e.message:'Search Console property kaydedilemedi.');}
    finally{if(generation===loadGeneration.current)setSaving(false);}
  }

  const fmt=(n:number)=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(n||0);
  const sites=(data?.sites||[]).filter(site=>site.siteUrl);
  const canOverride=sites.length>1;

  if(!projectId)return <div className="empty">Önce bir proje seç.</div>;
  return <div className="moduleStack">
    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">SEO / Search Performance</p><h2>Google Search Console</h2></div><select value={days} onChange={e=>setDays(Number(e.target.value))} disabled={loading||saving}><option value={7}>7 gün</option><option value={28}>28 gün</option><option value={60}>60 gün</option><option value={90}>90 gün</option></select></div>
      {loading&&<div className="moduleLoading"><span/> Search Console verileri okunuyor…</div>}
      {data?.partial&&<div className="moduleFoot">Sorgu veya sayfa detayları güvenlik sınırında kesildi. Özet ayrı toplam raporundan gelir.</div>}
      {data?.detailCoverage&&<div className="moduleFoot">Detay listeleri Google’ın sunduğu en güçlü satırları içerir; tüm arama verisini temsil etmeyebilir.</div>}
      {error&&<div className="error">{error}</div>}
      {data?.matched&&<><div className="moduleFoot">{data.siteUrl} · {data.permissionLevel||'erişim mevcut'}</div>{canOverride&&<div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:14}}><select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)} disabled={saving}><option value="">Property seç</option>{sites.map(site=><option key={site.siteUrl} value={site.siteUrl}>{site.siteUrl} · {site.permissionLevel||'erişim mevcut'}</option>)}</select><button className="primaryAction" onClick={selectSite} disabled={!selectedSite||saving||selectedSite===data.siteUrl}>{saving?'Kaydediliyor…':'Property Değiştir'}</button><span style={{opacity:.7,fontSize:13}}>Yanlış property eşleştiyse aktif proje için değiştirebilirsin.</span></div>}</>}
      {data&&!data.matched&&sites.length===0&&<div className="empty"><b>Bu Google hesabında erişilebilir Search Console property bulunamadı.</b><div style={{marginTop:8,opacity:.75}}>Önce ilgili siteyi Google Search Console hesabına ekle veya erişimi olan başka bir Google hesabı bağla.</div></div>}
      {data&&!data.matched&&sites.length>0&&<div className="empty"><b>Search Console property otomatik eşleşmedi.</b> {data.message}<div style={{display:'flex',gap:10,alignItems:'center',justifyContent:'center',flexWrap:'wrap',marginTop:14}}><select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)} disabled={saving}><option value="">Property seç</option>{sites.map(site=><option key={site.siteUrl} value={site.siteUrl}>{site.siteUrl} · {site.permissionLevel||'erişim mevcut'}</option>)}</select><button className="primaryAction" onClick={selectSite} disabled={!selectedSite||saving}>{saving?'Kaydediliyor…':'Property Eşle'}</button></div><small style={{display:'block',marginTop:10}}>{sites.length} erişilebilir property bulundu.</small></div>}
    </section>
    {data?.matched&&data.summary&&<>
      <section className="metricTiles"><div className="kpi"><span>Tıklama</span><strong>{fmt(data.summary.clicks)}</strong></div><div className="kpi"><span>Gösterim</span><strong>{fmt(data.summary.impressions)}</strong></div><div className="kpi"><span>CTR</span><strong>%{fmt(data.summary.ctr*100)}</strong></div><div className="kpi"><span>Ort. Konum</span><strong>{data.summary.position==null?'—':fmt(data.summary.position)}</strong></div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Queries</p><h2>En güçlü arama sorguları</h2></div><span>{data.queries?.length||0} kayıt</span></div><div className="dataTable"><div className="dataHead"><span>Sorgu</span><span>Tıklama</span><span>Gösterim</span><span>CTR</span><span>Konum</span></div>{(data.queries||[]).slice(0,50).map((r,i)=><div className="dataRow" key={`${r.keys?.[0]}-${i}`}><span><b>{r.keys?.[0]||'—'}</b></span><span>{fmt(r.clicks||0)}</span><span>{fmt(r.impressions||0)}</span><span>%{fmt((r.ctr||0)*100)}</span><span>{r.position==null?'—':fmt(r.position)}</span></div>)}</div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Landing Pages</p><h2>Organik sayfa performansı</h2></div><span>{data.pages?.length||0} kayıt</span></div><div className="dataTable"><div className="dataHead"><span>Sayfa</span><span>Tıklama</span><span>Gösterim</span><span>CTR</span><span>Konum</span></div>{(data.pages||[]).slice(0,50).map((r,i)=><div className="dataRow" key={`${r.keys?.[0]}-${i}`}><span><b>{r.keys?.[0]||'—'}</b></span><span>{fmt(r.clicks||0)}</span><span>{fmt(r.impressions||0)}</span><span>%{fmt((r.ctr||0)*100)}</span><span>{r.position==null?'—':fmt(r.position)}</span></div>)}</div></section>
    </>}
  </div>;
}
