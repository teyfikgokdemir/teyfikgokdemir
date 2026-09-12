'use client';

import { useEffect, useMemo, useState } from 'react';

type Project={id:string;name:string;domain:string};
type Metric={provider:string;external_campaign_id:string;campaign_name:string;metric_date:string;spend:string|number;impressions:string|number;clicks:string|number;conversions:string|number;attributed_revenue:string|number};
type Integration={provider:string;account_label?:string;status:string;last_sync_at?:string};
type SyncResult={provider:string;ok:boolean;rows:number;error?:string};
type SyncPayload={readOnly:boolean;externalExecution:boolean;days:number;results:SyncResult[];summary?:Record<string,{spend:number;revenue:number;clicks:number;impressions:number;conversions:number;rows:number}>;intelligence?:{evaluatedCampaigns:number;alerts:number;recommendations:number}};

const api='/api/growth';
const n=(v:string|number|undefined)=>Number(v||0);
const money=(v:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(v||0);
const providerName=(p:string)=>p==='google_ads'||p==='google_oauth'?'Google Ads':p==='meta_ads'?'Meta Ads':p==='tiktok_ads'?'TikTok Ads':p;

export default function AdsSyncPanel({projectId,onSynced}:{projectId:string|null;onSynced?:()=>void|Promise<void>}){
  const [syncing,setSyncing]=useState(false);
  const [days,setDays]=useState(30);
  const [result,setResult]=useState<SyncPayload|null>(null);
  const [metrics,setMetrics]=useState<Metric[]>([]);
  const [integrations,setIntegrations]=useState<Integration[]>([]);
  const [error,setError]=useState('');

  async function load(){
    if(!projectId){setMetrics([]);setIntegrations([]);return;}
    const [metricsRes,integrationsRes]=await Promise.all([
      fetch(`${api}/projects/${projectId}/metrics`,{cache:'no-store'}),
      fetch(`${api}/projects/${projectId}/integrations`,{cache:'no-store'})
    ]);
    if(metricsRes.ok)setMetrics(await metricsRes.json());
    if(integrationsRes.ok)setIntegrations(await integrationsRes.json());
  }

  useEffect(()=>{setResult(null);setError('');void load();},[projectId]);

  async function sync(){
    if(!projectId||syncing)return;
    setSyncing(true);setError('');
    try{
      const res=await fetch(`${api}/projects/${projectId}/ads/sync`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({days})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Senkronizasyon başarısız.');
      setResult(data);
      await load();
      await onSynced?.();
    }catch(e){setError(e instanceof Error?e.message:'Senkronizasyon başarısız.');}
    finally{setSyncing(false);}
  }

  const totals=useMemo(()=>metrics.reduce((a,m)=>({spend:a.spend+n(m.spend),revenue:a.revenue+n(m.attributed_revenue),clicks:a.clicks+n(m.clicks),conversions:a.conversions+n(m.conversions),impressions:a.impressions+n(m.impressions)}),{spend:0,revenue:0,clicks:0,conversions:0,impressions:0}),[metrics]);
  const roas=totals.spend>0?totals.revenue/totals.spend:null;
  const lastSync=integrations.map(i=>i.last_sync_at).filter(Boolean).sort().at(-1);

  if(!projectId)return <section className="moduleCard"><div className="empty">Önce bir proje seç.</div></section>;

  return <div className="moduleStack">
    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Read-only Ads Sync</p><h2>Gerçek kampanya verilerini senkronize et</h2></div><span>{lastSync?`Son: ${new Date(lastSync).toLocaleString('tr-TR')}`:'Henüz sync yok'}</span></div>
      <div style={{display:'flex',gap:12,alignItems:'end',flexWrap:'wrap'}}>
        <label style={{display:'grid',gap:7,minWidth:150}}><span>Veri aralığı</span><select value={days} onChange={e=>setDays(Number(e.target.value))} disabled={syncing}><option value={7}>Son 7 gün</option><option value={14}>Son 14 gün</option><option value={30}>Son 30 gün</option><option value={60}>Son 60 gün</option><option value={90}>Son 90 gün</option></select></label>
        <button className="primaryAction" onClick={sync} disabled={syncing}>{syncing?'Senkronize ediliyor…':'Verileri Senkronize Et'}</button>
        <span style={{opacity:.7,fontSize:13}}>Salt okunur · reklam yayınlama kapalı</span>
      </div>
      {error&&<div className="error" style={{marginTop:14}}>{error}</div>}
      {result&&<div style={{display:'grid',gap:10,marginTop:18}}>{result.results.map(r=><div key={r.provider} style={{display:'flex',justifyContent:'space-between',gap:18,padding:'12px 14px',border:'1px solid rgba(255,255,255,.09)',borderRadius:12}}><span><b>{providerName(r.provider)}</b>{r.error&&<small style={{display:'block',opacity:.7,marginTop:4}}>{r.error}</small>}</span><strong>{r.ok?`${r.rows} kayıt`:'HATA'}</strong></div>)}</div>}
    </section>

    <section className="metricTiles">
      <div className="kpi"><span>Harcama</span><strong>{money(totals.spend)}</strong></div>
      <div className="kpi"><span>Atfedilen Ciro</span><strong>{money(totals.revenue)}</strong></div>
      <div className="kpi"><span>ROAS</span><strong>{roas==null?'—':roas.toFixed(2)}</strong></div>
      <div className="kpi"><span>Tıklama</span><strong>{totals.clicks.toLocaleString('tr-TR')}</strong></div>
      <div className="kpi"><span>Dönüşüm</span><strong>{totals.conversions.toLocaleString('tr-TR')}</strong></div>
    </section>

    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Campaign Performance</p><h2>Son kampanya metrikleri</h2></div><span>{metrics.length} kayıt</span></div>
      {metrics.length===0?<div className="empty">Henüz kampanya metriği yok. Yukarıdan senkronizasyon başlat.</div>:<div className="dataTable"><div className="dataHead"><span>Kampanya</span><span>Kaynak</span><span>Harcama</span><span>Ciro</span><span>ROAS</span></div>{metrics.slice(0,30).map((m,i)=><div className="dataRow" key={`${m.external_campaign_id}-${m.metric_date}-${i}`}><span><b>{m.campaign_name}</b><small>{m.metric_date}</small></span><span>{providerName(m.provider)}</span><span>{money(n(m.spend))}</span><span>{money(n(m.attributed_revenue))}</span><span>{n(m.spend)>0?(n(m.attributed_revenue)/n(m.spend)).toFixed(2):'—'}</span></div>)}</div>}
    </section>
  </div>;
}
