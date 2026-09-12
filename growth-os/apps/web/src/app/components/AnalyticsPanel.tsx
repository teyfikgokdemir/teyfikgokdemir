'use client';

import { useEffect,useState } from 'react';

type Performance={
  matched?:boolean;days?:number;property?:string;propertyName?:string;accountName?:string;message?:string;
  stream?:{displayName?:string;measurementId?:string;defaultUri?:string}|null;
  metadata?:{currencyCode?:string;timeZone?:string};
  summary?:{activeUsers:number;newUsers:number;sessions:number;views:number;keyEvents:number;transactions:number;totalRevenue:number};
  traffic?:Array<{channel:string;sessions:number;activeUsers:number;keyEvents:number;totalRevenue:number}>;
  landingPages?:Array<{page:string;sessions:number;activeUsers:number;keyEvents:number;totalRevenue:number}>;
  properties?:Array<{property?:string;displayName?:string;accountName?:string}>;
};
type Resources={analyticsPerformance?:Performance;errors?:Record<string,string>};
const api='/api/growth';

export default function AnalyticsPanel({projectId}:{projectId:string|null}){
  const[data,setData]=useState<Performance|null>(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  useEffect(()=>{
    if(!projectId){setData(null);return;}
    let alive=true;
    setLoading(true);setError('');
    fetch(`${api}/projects/${projectId}/integrations/google/resources`,{cache:'no-store'})
      .then(async r=>{const body=await r.json() as Resources & {error?:string};if(!r.ok)throw new Error(body.error||'Google Analytics verisi okunamadı.');if(body.errors?.analyticsPerformance)throw new Error(body.errors.analyticsPerformance);if(alive)setData(body.analyticsPerformance||null)})
      .catch(e=>{if(alive){setData(null);setError(e instanceof Error?e.message:'Google Analytics verisi okunamadı.')}})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[projectId]);

  const fmt=(n:number)=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(n||0);
  const money=(n:number,currency='TRY')=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:currency||'TRY',maximumFractionDigits:0}).format(n||0);
  const currency=data?.metadata?.currencyCode||'TRY';

  if(!projectId)return <div className="empty">Önce bir proje seç.</div>;
  return <div className="moduleStack">
    <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Google Analytics 4</p><h2>Analytics</h2></div><span>{data?.matched?'CANLI VERİ':'PROPERTY EŞLEME'}</span></div>{loading&&<div className="moduleLoading"><span/> GA4 verileri okunuyor…</div>}{error&&<div className="error">{error}</div>}{data?.matched&&<div className="moduleFoot">{data.propertyName} · {data.stream?.measurementId||data.property} · {data.metadata?.timeZone||'timezone bilinmiyor'}</div>}{data&&!data.matched&&<div className="empty"><b>GA4 property otomatik eşleşmedi.</b> {data.message}<br/><small>{data.properties?.length||0} erişilebilir property bulundu. Sonraki adımda manuel property seçimini de ekleyeceğiz.</small></div>}</section>
    {data?.matched&&data.summary&&<><section className="metricTiles"><div className="kpi"><span>Aktif Kullanıcı</span><strong>{fmt(data.summary.activeUsers)}</strong></div><div className="kpi"><span>Oturum</span><strong>{fmt(data.summary.sessions)}</strong></div><div className="kpi"><span>Görüntüleme</span><strong>{fmt(data.summary.views)}</strong></div><div className="kpi"><span>Key Event</span><strong>{fmt(data.summary.keyEvents)}</strong></div><div className="kpi"><span>İşlem</span><strong>{fmt(data.summary.transactions)}</strong></div><div className="kpi"><span>Toplam Gelir</span><strong>{money(data.summary.totalRevenue,currency)}</strong></div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Acquisition</p><h2>Trafik kaynakları</h2></div><span>{data.traffic?.length||0} kanal</span></div><div className="dataTable"><div className="dataHead"><span>Kanal</span><span>Oturum</span><span>Kullanıcı</span><span>Key Event</span><span>Gelir</span></div>{(data.traffic||[]).map((r,i)=><div className="dataRow" key={`${r.channel}-${i}`}><span><b>{r.channel}</b></span><span>{fmt(r.sessions)}</span><span>{fmt(r.activeUsers)}</span><span>{fmt(r.keyEvents)}</span><span>{money(r.totalRevenue,currency)}</span></div>)}</div></section>
      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Landing Pages</p><h2>Landing page performansı</h2></div><span>{data.landingPages?.length||0} sayfa</span></div><div className="dataTable"><div className="dataHead"><span>Sayfa</span><span>Oturum</span><span>Kullanıcı</span><span>Key Event</span><span>Gelir</span></div>{(data.landingPages||[]).map((r,i)=><div className="dataRow" key={`${r.page}-${i}`}><span><b>{r.page}</b></span><span>{fmt(r.sessions)}</span><span>{fmt(r.activeUsers)}</span><span>{fmt(r.keyEvents)}</span><span>{money(r.totalRevenue,currency)}</span></div>)}</div></section></>}
  </div>;
}
