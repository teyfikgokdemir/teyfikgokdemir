'use client';

import { FormEvent, useState } from 'react';

type Issue = { key:string; title:string; severity:string; status:string; detail:string; recommendation:string };
type Comparison = {
  previousScore:number; currentScore:number; scoreDelta:number;
  fixed:{key:string;title:string}[]; stillOpen:{key:string;title:string;severity:string}[]; newIssues:{key:string;title:string;severity:string}[];
  readiness:'ready'|'not_ready'; verdict:string;
} | null;
type Audit = { domain:string; overallScore:number; scores:{seo:number;geo:number;aeo:number;aio:number;adsReadiness:number}; issues:Issue[] };
type Overview = {
  project:{id:string;name:string;domain:string}; latestAudit?:{overall_score:number}; openAlerts:number; pendingRecommendations:number;
  metrics30d:{spend:number;revenue:number;grossProfit:number;roas:number|null}; crm:{total:number;won:number};
  targets:null|{target_roas:number|null;break_even_roas:number|null;target_cpa:number|null;target_mer:number|null};
};

const api = '/api/growth';
const money = (value:number) => new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value || 0);

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [comparison, setComparison] = useState<Comparison>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  async function loadOverview(projectId:string) {
    const res = await fetch(`${api}/projects/${projectId}/overview`, { cache:'no-store' });
    if (res.ok) setOverview(await res.json());
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(''); setAudit(null); setComparison(null); setOverview(null);
    try {
      const res = await fetch(`${api}/audit`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({domain}), cache:'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analiz başarısız');
      setAudit(data.audit); setComparison(data.comparison || null);
      await loadOverview(data.project.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Analiz başarısız'); }
    finally { setLoading(false); }
  }

  return <main className="shell">
    <aside className="side">
      <div className="brand"><span>G</span><div><strong>Growth OS</strong><small>Private Control Center</small></div></div>
      <nav><a className="active">Genel Bakış</a><a>Projeler</a><a>Audit</a><a>Final Check</a><a>Ads</a><a>Analytics</a><a>CRM</a><a>Profit</a><a>Alerts</a><a>Recommendations</a></nav>
      <div className="stage">Core / Growth Control Center v0.3</div>
    </aside>

    <section className="content">
      <header><div><p className="eyebrow">Growth intelligence + execution</p><h1>Bir domain gir. Ölç. Düzelt. Tekrar doğrula.</h1></div><span className="private">PRIVATE</span></header>

      <form className="auditBox" onSubmit={submit}>
        <div><label>Domain</label><input value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="ornek.com" /></div>
        <button disabled={loading || !domain}>{loading ? 'Analiz ediliyor…' : 'Analiz Başlat'}</button>
      </form>
      {error && <div className="error">{error}</div>}
      {!audit && <div className="empty"><b>Aktif çekirdek:</b> çoklu sayfa Audit + SEO/GEO/AEO/AIO + Ads Readiness + Final Check + CRM/ROAS/Profit veri modeli + Alerts + Recommendations + onaylı aksiyon kaydı.</div>}

      {overview && <section className="growthPanel">
        <div className="panelTitle"><div><p className="eyebrow">Growth Control Center · Son 30 gün</p><h2>{overview.project.name}</h2></div><span>{overview.project.domain}</span></div>
        <div className="kpiGrid">
          <Kpi label="Reklam Harcaması" value={money(overview.metrics30d.spend)} />
          <Kpi label="Atfedilen Ciro" value={money(overview.metrics30d.revenue)} />
          <Kpi label="Brüt Katkı" value={money(overview.metrics30d.grossProfit)} />
          <Kpi label="ROAS" value={overview.metrics30d.roas == null ? '—' : overview.metrics30d.roas.toFixed(2)} target={overview.targets?.target_roas ? `Hedef ${overview.targets.target_roas}` : undefined}/>
          <Kpi label="CRM Lead" value={String(overview.crm.total)} note={`${overview.crm.won} kazanıldı`} />
          <Kpi label="Açık Uyarı" value={String(overview.openAlerts)} note={`${overview.pendingRecommendations} öneri bekliyor`} />
        </div>
        <div className="engineStrip"><span><b>Audit Engine</b> aktif</span><span><b>Final Check</b> aktif</span><span><b>Ads Connectors</b> read-only hazırlık</span><span><b>Action Engine</b> onay zorunlu</span></div>
      </section>}

      {audit && <>
        <div className="scoreGrid"><Score label="Genel" value={audit.overallScore}/><Score label="SEO" value={audit.scores.seo}/><Score label="GEO" value={audit.scores.geo}/><Score label="AEO" value={audit.scores.aeo}/><Score label="AIO" value={audit.scores.aio}/><Score label="Ads Ready" value={audit.scores.adsReadiness}/></div>
        {comparison && <section className={`finalCard ${comparison.readiness}`}><div><p className="eyebrow">Final Check</p><h2>{comparison.readiness === 'ready' ? 'Reklama Hazır' : 'Düzeltme Devam Etmeli'}</h2><p>{comparison.verdict}</p></div><div className="finalStats"><div><strong>{comparison.previousScore}</strong><span>Önceki</span></div><div><strong>{comparison.currentScore}</strong><span>Şimdi</span></div><div><strong>{comparison.scoreDelta > 0 ? '+' : ''}{comparison.scoreDelta}</strong><span>Değişim</span></div><div><strong>{comparison.fixed.length}</strong><span>Düzelen</span></div><div><strong>{comparison.stillOpen.length}</strong><span>Açık</span></div><div><strong>{comparison.newIssues.length}</strong><span>Yeni</span></div></div></section>}
        <div className="reportHead"><div><p className="eyebrow">{audit.domain}</p><h2>Öncelikli Bulgular</h2></div><span>{audit.issues.filter(i=>i.status!=='pass').length} aksiyon</span></div>
        <div className="issues">{[...audit.issues].sort((a,b)=>Number(a.status==='pass')-Number(b.status==='pass')).map((i)=><article key={i.key} className={i.status}><div className="issueTop"><strong>{i.title}</strong><span>{i.status==='pass'?'PASS':i.severity.toUpperCase()}</span></div><p>{i.detail}</p>{i.status!=='pass' && <small>{i.recommendation}</small>}</article>)}</div>
      </>}
    </section>
  </main>;
}

function Score({label,value}:{label:string;value:number}) { return <div className="score"><div className="ring" style={{['--score' as string]:`${value*3.6}deg`}}><span>{value}</span></div><p>{label}</p></div>; }
function Kpi({label,value,note,target}:{label:string;value:string;note?:string;target?:string}) { return <div className="kpi"><span>{label}</span><strong>{value}</strong>{(note||target)&&<small>{target||note}</small>}</div>; }
