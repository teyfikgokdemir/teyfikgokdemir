'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

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
type Project = { id:string; name:string; domain:string; created_at?:string };
type AuditRow = { id:string; domain:string; overall_score:number; seo_score:number; geo_score:number; aeo_score:number; aio_score:number; ads_readiness_score:number; created_at:string };
type AlertRow = { id:string; title?:string; message?:string; severity?:string; status?:string; created_at?:string };
type RecommendationRow = { id:string; title?:string; description?:string; status?:string; source?:string; created_at?:string };
type Section = 'overview'|'projects'|'audit'|'final'|'ads'|'analytics'|'crm'|'profit'|'alerts'|'recommendations';

const api = '/api/growth';
const money = (value:number) => new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value || 0);
const severityWeight:Record<string,number> = {critical:5,high:4,medium:3,low:2,info:1};
const navItems:{key:Section;label:string}[] = [
  {key:'overview',label:'Genel Bakış'},{key:'projects',label:'Projeler'},{key:'audit',label:'Audit'},{key:'final',label:'Final Check'},
  {key:'ads',label:'Ads'},{key:'analytics',label:'Analytics'},{key:'crm',label:'CRM'},{key:'profit',label:'Profit'},
  {key:'alerts',label:'Alerts'},{key:'recommendations',label:'Recommendations'}
];

export default function Home() {
  const [section, setSection] = useState<Section>('overview');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [comparison, setComparison] = useState<Comparison>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRow[]>([]);
  const [error, setError] = useState('');

  const openIssues = useMemo(() => audit ? audit.issues.filter(i=>i.status!=='pass').sort((a,b)=>(severityWeight[b.severity]||0)-(severityWeight[a.severity]||0)) : [], [audit]);
  const criticalCount = openIssues.filter(i=>['critical','high'].includes(i.severity)).length;
  const mediumCount = openIssues.filter(i=>i.severity==='medium').length;
  const verdict = audit ? (criticalCount===0 && audit.scores.adsReadiness>=80 ? 'Reklama hazırlık aşamasına geçilebilir' : criticalCount>0 ? 'Önce kritik teknik ve ölçüm açıklarını kapat' : 'İyileştirme tamamlanmadan ölçekleme yapma') : '';

  async function loadProjects() {
    const res = await fetch(`${api}/projects`, { cache:'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setProjects(data);
    if (!selectedProject && data[0]) setSelectedProject(data[0]);
  }

  async function loadOverview(projectId:string) {
    const res = await fetch(`${api}/projects/${projectId}/overview`, { cache:'no-store' });
    if (res.ok) setOverview(await res.json());
  }

  async function loadProjectModules(projectId:string) {
    setModuleLoading(true);
    try {
      const [overviewRes,auditsRes,alertsRes,recsRes,finalRes] = await Promise.all([
        fetch(`${api}/projects/${projectId}/overview`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/audits`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/alerts`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/recommendations`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/final-check`,{cache:'no-store'})
      ]);
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
      if (finalRes.ok) {
        const data = await finalRes.json();
        setComparison(data.comparison || null);
        if (data.current) setAudit(data.current);
      }
    } finally { setModuleLoading(false); }
  }

  useEffect(()=>{ loadProjects(); },[]);
  useEffect(()=>{ if(selectedProject) loadProjectModules(selectedProject.id); },[selectedProject?.id]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${api}/audit`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({domain}), cache:'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analiz başarısız');
      setAudit(data.audit); setComparison(data.comparison || null);
      setSelectedProject(data.project); await loadOverview(data.project.id); await loadProjects(); setSection('audit');
    } catch (e) { setError(e instanceof Error ? e.message : 'Analiz başarısız'); }
    finally { setLoading(false); }
  }

  return <main className="shell">
    <aside className="side">
      <div className="brand"><span>G</span><div><strong>Growth OS</strong><small>Private Control Center</small></div></div>
      <nav>{navItems.map(item=><button key={item.key} className={section===item.key?'active':''} onClick={()=>setSection(item.key)}>{item.label}</button>)}</nav>
      <div className="stage">Core / Growth Control Center v0.5</div>
    </aside>

    <section className="content">
      <header><div><p className="eyebrow">Growth intelligence + execution</p><h1>{section==='overview'?'Büyümenin kontrol merkezi.':navItems.find(i=>i.key===section)?.label}</h1></div><span className="private">PRIVATE</span></header>

      <div className="projectBar">
        <div><span>Aktif Proje</span><strong>{selectedProject?.name || 'Henüz proje yok'}</strong><small>{selectedProject?.domain || 'Yeni audit ile proje oluştur'}</small></div>
        {projects.length>0 && <select value={selectedProject?.id || ''} onChange={e=>setSelectedProject(projects.find(p=>p.id===e.target.value)||null)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.domain}</option>)}</select>}
      </div>

      {error && <div className="error">{error}</div>}
      {moduleLoading && <div className="moduleLoading">Veriler güncelleniyor…</div>}

      {section==='overview' && <OverviewView overview={overview} />}
      {section==='projects' && <ProjectsView projects={projects} selected={selectedProject} onSelect={setSelectedProject} />}
      {section==='audit' && <AuditView domain={domain} setDomain={setDomain} submit={submit} loading={loading} audit={audit} comparison={comparison} openIssues={openIssues} criticalCount={criticalCount} mediumCount={mediumCount} verdict={verdict} />}
      {section==='final' && <FinalView comparison={comparison} />}
      {section==='ads' && <SimpleModule title="Ads Readiness" subtitle="Reklam öncesi teknik ve ölçüm hazırlığı" value={audit ? `${audit.scores.adsReadiness}/100` : '—'} note={audit ? (audit.scores.adsReadiness>=80?'Hazır':'Düzeltme gerekli') : 'Önce audit çalıştır'} />}
      {section==='analytics' && <SimpleModule title="Analytics" subtitle="Son 30 gün ölçüm görünümü" value={overview ? money(overview.metrics30d.revenue) : '—'} note={overview ? `ROAS ${overview.metrics30d.roas?.toFixed(2) || '—'} · Harcama ${money(overview.metrics30d.spend)}` : 'Aktif proje seç'} />}
      {section==='crm' && <SimpleModule title="CRM" subtitle="Lead ve kazanım görünümü" value={overview ? String(overview.crm.total) : '—'} note={overview ? `${overview.crm.won} kazanılmış lead` : 'Aktif proje seç'} />}
      {section==='profit' && <SimpleModule title="Profit" subtitle="Kârlılık görünümü" value={overview ? money(overview.metrics30d.grossProfit) : '—'} note={overview?.targets?.target_roas ? `Hedef ROAS ${overview.targets.target_roas}` : 'Hedef değerleri henüz tanımlı değil'} />}
      {section==='alerts' && <ListModule title="Alerts" empty="Açık uyarı bulunmuyor." items={alerts.map(a=>({id:a.id,title:a.title||a.message||'Uyarı',meta:`${a.severity||'info'} · ${a.status||'open'}`}))} />}
      {section==='recommendations' && <ListModule title="Recommendations" empty="Bekleyen öneri bulunmuyor." items={recommendations.map(r=>({id:r.id,title:r.title||r.description||'Öneri',meta:`${r.source||'system'} · ${r.status||'proposed'}`}))} />}
    </section>
  </main>;
}

function OverviewView({overview}:{overview:Overview|null}) {
  if(!overview) return <div className="empty"><b>Kontrol merkezi hazır.</b> Bir proje seç veya Audit bölümünden yeni domain analizi başlat.</div>;
  return <section className="growthPanel"><div className="panelTitle"><div><p className="eyebrow">Growth Control Center · Son 30 gün</p><h2>{overview.project.name}</h2></div><span>{overview.project.domain}</span></div><div className="kpiGrid"><Kpi label="Reklam Harcaması" value={money(overview.metrics30d.spend)} /><Kpi label="Atfedilen Ciro" value={money(overview.metrics30d.revenue)} /><Kpi label="Brüt Katkı" value={money(overview.metrics30d.grossProfit)} /><Kpi label="ROAS" value={overview.metrics30d.roas == null ? '—' : overview.metrics30d.roas.toFixed(2)} target={overview.targets?.target_roas ? `Hedef ${overview.targets.target_roas}` : undefined}/><Kpi label="CRM Lead" value={String(overview.crm.total)} note={`${overview.crm.won} kazanıldı`} /><Kpi label="Açık Uyarı" value={String(overview.openAlerts)} note={`${overview.pendingRecommendations} öneri bekliyor`} /></div></section>;
}

function ProjectsView({projects,selected,onSelect}:{projects:Project[];selected:Project|null;onSelect:(p:Project)=>void}) {
  return <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Portföy</p><h2>Projeler</h2></div><span>{projects.length} proje</span></div>{projects.length===0?<div className="empty">Henüz proje yok. Audit başlatınca otomatik oluşur.</div>:<div className="projectGrid">{projects.map(p=><button key={p.id} className={selected?.id===p.id?'selected':''} onClick={()=>onSelect(p)}><strong>{p.name}</strong><span>{p.domain}</span><small>{selected?.id===p.id?'Aktif proje':'Projeyi aç'}</small></button>)}</div>}</section>;
}

function AuditView({domain,setDomain,submit,loading,audit,comparison,openIssues,criticalCount,mediumCount,verdict}:{domain:string;setDomain:(v:string)=>void;submit:(e:FormEvent)=>void;loading:boolean;audit:Audit|null;comparison:Comparison;openIssues:Issue[];criticalCount:number;mediumCount:number;verdict:string}) {
  return <><form className="auditBox" onSubmit={submit}><div><label>Domain</label><input value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="domain.com" /></div><button disabled={loading || !domain}>{loading ? 'Analiz ediliyor…' : 'Analiz Başlat'}</button></form>{!audit&&<div className="empty"><b>Audit Engine hazır.</b> Domain girerek SEO/GEO/AEO/AIO, Ads Readiness ve teknik görünürlüğü birlikte tara.</div>}{audit&&<><section className="executiveCard"><div className="executiveLead"><p className="eyebrow">Executive Audit Summary</p><h2>{verdict}</h2><p>{audit.domain} için {openIssues.length} açık aksiyon tespit edildi.</p></div><div className="executiveStats"><div><strong>{criticalCount}</strong><span>Kritik/Yüksek</span></div><div><strong>{mediumCount}</strong><span>Orta</span></div><div><strong>{openIssues.length}</strong><span>Toplam Aksiyon</span></div></div></section><div className="scoreGrid"><Score label="Genel" value={audit.overallScore}/><Score label="SEO" value={audit.scores.seo}/><Score label="GEO" value={audit.scores.geo}/><Score label="AEO" value={audit.scores.aeo}/><Score label="AIO" value={audit.scores.aio}/><Score label="Ads Ready" value={audit.scores.adsReadiness}/></div><div className="reportHead"><div><p className="eyebrow">{audit.domain}</p><h2>Detaylı Bulgular</h2></div><span>{openIssues.length} açık aksiyon</span></div><div className="issues">{[...audit.issues].sort((a,b)=>{if(a.status==='pass'&&b.status!=='pass')return 1;if(a.status!=='pass'&&b.status==='pass')return -1;return (severityWeight[b.severity]||0)-(severityWeight[a.severity]||0)}).map((i)=><article key={i.key} className={i.status}><div className="issueTop"><strong>{i.title}</strong><span>{i.status==='pass'?'PASS':i.severity.toUpperCase()}</span></div><p>{i.detail}</p>{i.status!=='pass'&&<small>{i.recommendation}</small>}</article>)}</div>{comparison&&<div className="moduleFoot">Final Check verisi hazır. Sol menüden Final Check bölümüne geçebilirsin.</div>}</>}</>;
}

function FinalView({comparison}:{comparison:Comparison}) {
  if(!comparison) return <div className="empty">Final Check için aynı projede en az iki audit çalıştır.</div>;
  return <section className={`finalCard ${comparison.readiness}`}><div><p className="eyebrow">Final Check</p><h2>{comparison.readiness==='ready'?'Reklama Hazır':'Düzeltme Devam Etmeli'}</h2><p>{comparison.verdict}</p></div><div className="finalStats"><div><strong>{comparison.previousScore}</strong><span>Önceki</span></div><div><strong>{comparison.currentScore}</strong><span>Şimdi</span></div><div><strong>{comparison.scoreDelta>0?'+':''}{comparison.scoreDelta}</strong><span>Değişim</span></div><div><strong>{comparison.fixed.length}</strong><span>Düzelen</span></div><div><strong>{comparison.stillOpen.length}</strong><span>Açık</span></div><div><strong>{comparison.newIssues.length}</strong><span>Yeni</span></div></div></section>;
}

function SimpleModule({title,subtitle,value,note}:{title:string;subtitle:string;value:string;note:string}) { return <section className="moduleCard"><p className="eyebrow">{subtitle}</p><h2 className="moduleTitle">{title}</h2><div className="heroMetric"><strong>{value}</strong><span>{note}</span></div></section>; }
function ListModule({title,items,empty}:{title:string;items:{id:string;title:string;meta:string}[];empty:string}) { return <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Growth OS</p><h2>{title}</h2></div><span>{items.length} kayıt</span></div>{items.length===0?<div className="empty">{empty}</div>:<div className="listRows">{items.map(i=><article key={i.id}><strong>{i.title}</strong><span>{i.meta}</span></article>)}</div>}</section>; }
function Score({label,value}:{label:string;value:number}) { return <div className="score"><div className="ring" style={{['--score' as string]:`${value*3.6}deg`}}><span>{value}</span></div><p>{label}</p></div>; }
function Kpi({label,value,note,target}:{label:string;value:string;note?:string;target?:string}) { return <div className="kpi"><span>{label}</span><strong>{value}</strong>{(note||target)&&<small>{target||note}</small>}</div>; }
