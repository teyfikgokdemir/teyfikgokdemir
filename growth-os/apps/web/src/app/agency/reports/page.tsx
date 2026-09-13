'use client';

import { useEffect, useMemo, useState } from 'react';

type Project={id:string;name:string;domain:string};
type Overview={latestAudit?:{overall_score?:number}|null;metrics30d?:{spend?:number;revenue?:number;grossProfit?:number;roas?:number|null};pendingRecommendations?:number;openAlerts?:number};
type Execution={counts?:{verified?:number;failed?:number;queued?:number;in_progress?:number;verification_pending?:number}};
type Row={project:Project;overview:Overview;execution:Execution;overviewLoaded:boolean;executionLoaded:boolean};

const api='/api/growth';
const n=(value:unknown)=>{const parsed=Number(value??0);return Number.isFinite(parsed)?parsed:0};
const money=(value:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value||0);

export default function AgencyReportsPage(){
  const [rows,setRows]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const projectsRes=await fetch(`${api}/projects`,{cache:'no-store'});
        const projects=await projectsRes.json();
        if(!projectsRes.ok)throw new Error(projects?.error||'Projeler okunamadı.');
        const data=await Promise.all((projects as Project[]).slice(0,50).map(async project=>{
          const [overviewRes,executionRes]=await Promise.all([
            fetch(`${api}/projects/${project.id}/overview`,{cache:'no-store'}),
            fetch(`${api}/projects/${project.id}/execution-center`,{cache:'no-store'})
          ]);
          return {
            project,
            overview:overviewRes.ok?await overviewRes.json():{},
            execution:executionRes.ok?await executionRes.json():{},
            overviewLoaded:overviewRes.ok,
            executionLoaded:executionRes.ok
          } as Row;
        }));
        if(active)setRows(data);
      }catch(err){if(active)setError(err instanceof Error?err.message:'Rapor merkezi yüklenemedi.')}finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[]);

  const totals=useMemo(()=>({
    projects:rows.length,
    revenue:rows.reduce((sum,row)=>sum+n(row.overview.metrics30d?.revenue),0),
    spend:rows.reduce((sum,row)=>sum+n(row.overview.metrics30d?.spend),0),
    verified:rows.reduce((sum,row)=>sum+n(row.execution.counts?.verified),0),
    waiting:rows.reduce((sum,row)=>sum+n(row.execution.counts?.queued)+n(row.execution.counts?.in_progress)+n(row.execution.counts?.verification_pending),0),
    alerts:rows.reduce((sum,row)=>sum+n(row.overview.openAlerts),0),
    incomplete:rows.filter(row=>!row.overviewLoaded||!row.executionLoaded).length
  }),[rows]);
  const partialLabel=totals.incomplete>0?`kısmi toplam · ${totals.incomplete} proje eksik`:'toplam';

  return <main className="reportsScreen">
    <div className="reportsShell">
      <header className="reportsHeader">
        <div><small>AGENCY PROOF LAYER</small><h1>Rapor ve Kanıt Merkezi</h1><p>Müşteri performansını yalnızca metriklerle değil; execution durumu, doğrulanmış sonuçlar ve açık risklerle birlikte göster.</p></div>
        <nav><a href="/agency">Ajans Merkezi</a><a href="/agency/clients">Müşteriler</a><a href="/agency/settings">White-label</a></nav>
      </header>

      {loading?<div className="state">Rapor verileri hazırlanıyor…</div>:null}
      {error?<div className="error">{error}</div>:null}

      {!loading&&!error?<>
        <section className="summary">
          <article><span>Projeler</span><strong>{totals.projects}</strong><small>workspace kapsamında</small></article>
          <article><span>30 Gün Gelir</span><strong>{money(totals.revenue)}</strong><small>{partialLabel}</small></article>
          <article><span>30 Gün Harcama</span><strong>{money(totals.spend)}</strong><small>{partialLabel}</small></article>
          <article><span>Doğrulanmış</span><strong>{totals.verified}</strong><small>{totals.incomplete>0?partialLabel:'kanıtlanmış execution'}</small></article>
          <article><span>Execution Hattı</span><strong>{totals.waiting}</strong><small>{totals.incomplete>0?partialLabel:'işlem / doğrulama bekleyen'}</small></article>
          <article><span>Açık Alarm</span><strong>{totals.alerts}</strong><small>{totals.incomplete>0?partialLabel:'aktif risk sinyali'}</small></article>
        </section>

        <section className="panel">
          <div className="panelHead"><div><small>CLIENT REPORTING</small><h2>Portföy görünümü</h2></div><span>{rows.length} proje{totals.incomplete>0?` · ${totals.incomplete} eksik kaynak`:''}</span></div>
          <div className="tableWrap"><table><thead><tr><th>Müşteri / Proje</th><th>Audit</th><th>Gelir</th><th>Harcama</th><th>ROAS</th><th>Bekleyen</th><th>Verified</th></tr></thead><tbody>
            {rows.map(row=><tr key={row.project.id}><td><b>{row.project.name}</b><small>{row.project.domain}{!row.overviewLoaded||!row.executionLoaded?' · veri eksik':''}</small></td><td>{row.overviewLoaded?(row.overview.latestAudit?.overall_score??'—'):'—'}</td><td>{row.overviewLoaded?money(n(row.overview.metrics30d?.revenue)):'—'}</td><td>{row.overviewLoaded?money(n(row.overview.metrics30d?.spend)):'—'}</td><td>{row.overviewLoaded?(row.overview.metrics30d?.roas==null?'—':Number(row.overview.metrics30d.roas).toFixed(2)):'—'}</td><td>{row.executionLoaded?n(row.execution.counts?.queued)+n(row.execution.counts?.in_progress)+n(row.execution.counts?.verification_pending):'—'}</td><td>{row.executionLoaded?n(row.execution.counts?.verified):'—'}</td></tr>)}
          </tbody></table></div>
          {rows.length===0?<div className="empty">Workspace içinde raporlanacak proje bulunmuyor.</div>:null}
          {totals.incomplete>0?<div className="state">{totals.incomplete} projede overview veya execution kaynağı okunamadı. Bu satırlardaki eksik alanlar sıfır yerine “—” gösterilir; üst toplamlar yalnız okunabilen kaynakların kısmi toplamıdır.</div>:null}
        </section>

        <section className="proofGrid">
          <article><small>01 · DETECT</small><h3>Sorunu göster</h3><p>Audit, alarm ve performans verileriyle problemin ne olduğunu görünür kıl.</p></article>
          <article><small>02 · EXECUTE</small><h3>Ne yapıldığını göster</h3><p>Onaylanan işin execution hattındaki durumunu müşteriye açıklanabilir hale getir.</p></article>
          <article><small>03 · VERIFY</small><h3>Sonucu kanıtla</h3><p>Önce / sonra ve verified kayıtlarıyla ajans emeğini ölçülebilir kanıta dönüştür.</p></article>
        </section>
      </>:null}
    </div>

    <style jsx>{`
      .reportsScreen{min-height:100vh;background:radial-gradient(circle at 86% 0%,#26113a 0,transparent 28%),linear-gradient(180deg,#09070d,#100a17 55%,#08060b);color:#f5effa;padding:24px}.reportsShell{max-width:1380px;margin:0 auto}.reportsHeader{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:12px 0 28px;border-bottom:1px solid rgba(255,255,255,.08)}.reportsHeader small,.panelHead small,.proofGrid small{font-size:10px;letter-spacing:.14em;color:#9d8dac}.reportsHeader h1{font-size:42px;letter-spacing:-.04em;margin:8px 0 10px}.reportsHeader p{margin:0;color:#aa9eb8;line-height:1.65;max-width:760px}.reportsHeader nav{display:flex;gap:8px;flex-wrap:wrap}.reportsHeader a{color:#d9cbed;text-decoration:none;border:1px solid #3a2d49;border-radius:12px;padding:10px 12px;font-size:12px}.summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;padding:24px 0 14px}.summary article,.panel,.proofGrid article{border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#120d1a,#0c0911);border-radius:18px}.summary article{padding:16px}.summary span,.summary small{display:block;color:#8f829b;font-size:10px}.summary strong{display:block;font-size:20px;margin:7px 0}.panel{padding:20px}.panelHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.panelHead h2{font-size:22px;margin:5px 0 0}.panelHead>span{border:1px solid #3a2d49;border-radius:999px;padding:5px 8px;color:#9588a0;font-size:10px}.tableWrap{overflow-x:auto;-webkit-overflow-scrolling:touch}.tableWrap table{width:100%;border-collapse:collapse;min-width:760px}.tableWrap th,.tableWrap td{text-align:left;padding:12px;border-bottom:1px solid #2d2238;font-size:11px}.tableWrap th{color:#8f829b;font-weight:600}.tableWrap td{color:#ded5e5}.tableWrap td:first-child{display:grid;gap:3px}.tableWrap td small{color:#817587}.proofGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.proofGrid article{padding:18px}.proofGrid h3{margin:7px 0 8px;font-size:18px}.proofGrid p{margin:0;color:#9b8fa6;font-size:11px;line-height:1.6}.state,.error,.empty{margin-top:18px;border-radius:11px;padding:11px 13px;font-size:11px}.state,.empty{border:1px solid #342641;color:#94889d}.error{border:1px solid #603044;background:#1b0f16;color:#e6a3b2}@media(max-width:1100px){.summary{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:900px){.reportsScreen{padding:16px}.reportsHeader{display:grid}.reportsHeader h1{font-size:34px}.proofGrid{grid-template-columns:1fr}}@media(max-width:560px){.reportsScreen{padding:12px}.reportsHeader h1{font-size:30px}.reportsHeader a{flex:1;text-align:center}.summary{grid-template-columns:1fr 1fr}.panel{padding:14px}}@media(max-width:380px){.summary{grid-template-columns:1fr}}
    `}</style>
  </main>;
}
