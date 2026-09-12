'use client';

import { useEffect,useState } from 'react';

type Row={keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number};
type Performance={siteUrl:string;permissionLevel?:string;days:number;summary:{clicks:number;impressions:number;ctr:number;position:number|null};queries:Row[];pages:Row[]};

const api='/api/growth';

export default function SearchConsolePanel({projectId}:{projectId:string|null}){
  const[days,setDays]=useState(28);
  const[data,setData]=useState<Performance|null>(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  useEffect(()=>{
    if(!projectId){setData(null);return;}
    let alive=true;
    setLoading(true);setError('');
    fetch(`${api}/projects/${projectId}/search-console/performance?days=${days}`,{cache:'no-store'})
      .then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||'Search Console verisi okunamadı.');if(alive)setData(body)})
      .catch(e=>{if(alive){setData(null);setError(e instanceof Error?e.message:'Search Console verisi okunamadı.')}})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[projectId,days]);

  const fmt=(n:number)=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(n||0);

  if(!projectId)return <div className="empty">Önce bir proje seç.</div>;
  return <div className="moduleStack">
    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">SEO / Search Performance</p><h2>Google Search Console</h2></div><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 gün</option><option value={28}>28 gün</option><option value={60}>60 gün</option><option value={90}>90 gün</option></select></div>
      {loading&&<div className="moduleLoading"><span/> Search Console verileri okunuyor…</div>}
      {error&&<div className="error">{error}</div>}
      {data&&<div className="moduleFoot">{data.siteUrl} · {data.permissionLevel||'erişim mevcut'}</div>}
    </section>
    {data&&<>
      <section className="metricTiles"><div className="kpi"><span>Tıklama</span><strong>{fmt(data.summary.clicks)}</strong></div><div className="kpi"><span>Gösterim</span><strong>{fmt(data.summary.impressions)}</strong></div><div className="kpi"><span>CTR</span><strong>%{fmt(data.summary.ctr*100)}</strong></div><div className="kpi"><span>Ort. Konum</span><strong>{data.summary.position==null?'—':fmt(data.summary.position)}</strong></div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Queries</p><h2>En güçlü arama sorguları</h2></div><span>{data.queries.length} kayıt</span></div><div className="dataTable"><div className="dataHead"><span>Sorgu</span><span>Tıklama</span><span>Gösterim</span><span>CTR</span><span>Konum</span></div>{data.queries.slice(0,50).map((r,i)=><div className="dataRow" key={`${r.keys?.[0]}-${i}`}><span><b>{r.keys?.[0]||'—'}</b></span><span>{fmt(r.clicks||0)}</span><span>{fmt(r.impressions||0)}</span><span>%{fmt((r.ctr||0)*100)}</span><span>{fmt(r.position||0)}</span></div>)}</div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Landing Pages</p><h2>Organik sayfa performansı</h2></div><span>{data.pages.length} kayıt</span></div><div className="dataTable"><div className="dataHead"><span>Sayfa</span><span>Tıklama</span><span>Gösterim</span><span>CTR</span><span>Konum</span></div>{data.pages.slice(0,50).map((r,i)=><div className="dataRow" key={`${r.keys?.[0]}-${i}`}><span><b>{r.keys?.[0]||'—'}</b></span><span>{fmt(r.clicks||0)}</span><span>{fmt(r.impressions||0)}</span><span>%{fmt((r.ctr||0)*100)}</span><span>{fmt(r.position||0)}</span></div>)}</div></section>
    </>}
  </div>;
}
