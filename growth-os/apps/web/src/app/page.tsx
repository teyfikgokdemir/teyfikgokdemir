'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Issue = { key:string; title:string; severity:string; status:string; detail:string; recommendation:string };
type Comparison = {
  previousScore:number; currentScore:number; scoreDelta:number;
  fixed:{key:string;title:string}[]; stillOpen:{key:string;title:string;severity:string}[]; newIssues:{key:string;title:string;severity:string}[];
  readiness:'ready'|'not_ready'; verdict:string;
} | null;
type Audit = { domain:string; overallScore:number; scores:{seo:number;geo:number;aeo:number;aio:number;adsReadiness:number}; issues:Issue[] };
type Targets = {target_roas:number|null;break_even_roas:number|null;target_cpa:number|null;target_mer:number|null;avg_order_value?:number|null;gross_margin_pct?:number|null;return_rate_pct?:number|null;shipping_cost?:number|null;fee_pct?:number|null};
type Overview = {
  project:{id:string;name:string;domain:string}; latestAudit?:{overall_score:number}; openAlerts:number; pendingRecommendations:number;
  metrics30d:{spend:number;revenue:number;grossProfit:number;roas:number|null}; crm:{total:number;won:number}; targets:null|Targets;
};
type Project = { id:string; name:string; domain:string; created_at?:string };
type AuditRow = { id:string; domain:string; overall_score:number; seo_score:number; geo_score:number; aeo_score:number; aio_score:number; ads_readiness_score:number; created_at:string };
type AlertRow = { id:string; title:string; message:string; severity:string; status:string; source?:string; created_at?:string };
type RecommendationRow = { id:string; title:string; rationale:string; priority:string; status:string; source:string; proposed_action?:{recommendation?:string;type?:string}; created_at?:string };
type MetricRow = {provider:string;external_campaign_id:string;campaign_name:string;metric_date:string;spend:string|number;impressions:string|number;clicks:string|number;conversions:string|number;attributed_revenue:string|number;crm_revenue:string|number;gross_profit:string|number};
type LeadRow = {id:string;source?:string;campaign_id?:string;name?:string;email?:string;phone?:string;status:string;lead_value:string|number;won_revenue:string|number;owner?:string;created_at?:string};
type IntegrationRow = {id:string;provider:string;account_label?:string;external_account_id?:string;status:string;mode:string;last_sync_at?:string;created_at?:string};
type ActionRow = {id:string;recommendation_id?:string;provider?:string;action_type:string;status:string;approved_by?:string;executed_at?:string;created_at?:string};
type Section = 'overview'|'projects'|'audit'|'final'|'ads'|'analytics'|'crm'|'profit'|'alerts'|'recommendations';

const api = '/api/growth';
const money = (value:number) => new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value || 0);
const number = (value:string|number) => Number(value || 0);
const severityWeight:Record<string,number> = {critical:5,high:4,medium:3,low:2,info:1};
const navItems:{key:Section;label:string;icon:string}[] = [
  {key:'overview',label:'Genel Bakış',icon:'◫'},{key:'projects',label:'Projeler',icon:'◇'},{key:'audit',label:'Audit',icon:'◎'},{key:'final',label:'Final Check',icon:'✓'},
  {key:'ads',label:'Ads',icon:'↗'},{key:'analytics',label:'Analytics',icon:'⌁'},{key:'crm',label:'CRM',icon:'○'},{key:'profit',label:'Profit',icon:'₺'},
  {key:'alerts',label:'Alerts',icon:'!'},{key:'recommendations',label:'Recommendations',icon:'✦'}
];

export default function Home() {
  const [section, setSection] = useState<Section>('overview');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState<'google'|'meta'|null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [comparison, setComparison] = useState<Comparison>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRow[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
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

  async function loadProjectModules(projectId:string) {
    setModuleLoading(true);
    try {
      const [overviewRes,auditsRes,alertsRes,recsRes,finalRes,metricsRes,leadsRes,integrationsRes,actionsRes] = await Promise.all([
        fetch(`${api}/projects/${projectId}/overview`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/audits`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/alerts`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/recommendations`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/final-check`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/metrics`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/leads`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/integrations`,{cache:'no-store'}),
        fetch(`${api}/projects/${projectId}/actions`,{cache:'no-store'})
      ]);
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (integrationsRes.ok) setIntegrations(await integrationsRes.json());
      if (actionsRes.ok) setActions(await actionsRes.json());
      if (finalRes.ok) {
        const data = await finalRes.json();
        setComparison(data.comparison || null);
        if (data.current) setAudit(data.current);
      } else { setComparison(null); }
    } finally { setModuleLoading(false); }
  }

  useEffect(()=>{ loadProjects(); },[]);
  useEffect(()=>{ if(selectedProject) loadProjectModules(selectedProject.id); },[selectedProject?.id]);
  useEffect(()=>{
    if (!projects.length || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integration');
    const projectId = params.get('project');
    if (projectId) {
      const project = projects.find(p=>p.id===projectId);
      if (project) setSelectedProject(project);
    }
    if (integration==='google_success' || integration==='meta_success') setSection('ads');
    if (integration==='google_error') {
      setSection('ads');
      setError('Google bağlantısı tamamlanamadı. OAuth ayarlarını ve Railway değişkenlerini kontrol et.');
    }
    if (integration==='meta_error') {
      setSection('ads');
      setError('Meta bağlantısı tamamlanamadı. Meta Login izinlerini ve Railway değişkenlerini kontrol et.');
    }
    if (integration) window.history.replaceState({},'',window.location.pathname);
  },[projects]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${api}/audit`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({domain}), cache:'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analiz başarısız');
      setAudit(data.audit); setComparison(data.comparison || null); setSelectedProject(data.project); setSection('audit');
      await loadProjects(); await loadProjectModules(data.project.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Analiz başarısız'); }
    finally { setLoading(false); }
  }

  function openProject(project:Project, target:Section='overview') {
    setSelectedProject(project); setProjectMenuOpen(false); setSection(target);
  }

  async function connectGoogle() {
    if (!selectedProject || connectionLoading) return;
    setConnectionLoading('google'); setError('');
    try {
      const res = await fetch(`${api}/projects/${selectedProject.id}/integrations/google/connect`,{method:'POST',headers:{'content-type':'application/json'}});
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error(data.error || 'Google bağlantısı başlatılamadı.');
      window.location.assign(data.authUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google bağlantısı başlatılamadı.');
      setConnectionLoading(null);
    }
  }

  async function connectMeta() {
    if (!selectedProject || connectionLoading) return;
    setConnectionLoading('meta'); setError('');
    try {
      const res = await fetch(`${api}/projects/${selectedProject.id}/integrations/meta/connect`,{method:'POST',headers:{'content-type':'application/json'}});
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error(data.error || 'Meta bağlantısı başlatılamadı.');
      window.location.assign(data.authUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Meta bağlantısı başlatılamadı.');
      setConnectionLoading(null);
    }
  }

  async function approveRecommendation(id:string) {
    const res = await fetch(`${api}/recommendations/${id}/approve`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({approvedBy:'teyfikgokdemir@outlook.com'})});
    if (!res.ok) { const data = await res.json(); setError(data.error || 'Öneri onaylanamadı'); return; }
    if (selectedProject) await loadProjectModules(selectedProject.id);
  }

  async function saveTargets(values:Record<string,number|null>) {
    if (!selectedProject) return false;
    const res = await fetch(`${api}/projects/${selectedProject.id}/targets`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(values)});
    if (!res.ok) { const data = await res.json(); setError(data.error || 'Hedefler kaydedilemedi'); return false; }
    await loadProjectModules(selectedProject.id); return true;
  }

  return <main className="shell">
    <aside className="side">
      <div className="brand"><span>G</span><div><strong>Growth OS</strong><small>Private Control Center</small></div></div>
      <nav>{navItems.map(item=><button key={item.key} className={section===item.key?'active':''} onClick={()=>setSection(item.key)}><i>{item.icon}</i><span>{item.label}</span></button>)}</nav>
      <div className="stage"><span className="liveDot"/> Core online · v0.8</div>
    </aside>

    <section className="content">
      <header><div><p className="eyebrow">Growth intelligence + execution</p><h1>{section==='overview'?'Büyümenin kontrol merkezi.':navItems.find(i=>i.key===section)?.label}</h1></div><span className="private">PRIVATE</span></header>

      <div className="projectBar">
        <div><span>Aktif Proje</span><strong>{selectedProject?.name || 'Henüz proje yok'}</strong><small>{selectedProject?.domain || 'Yeni audit ile proje oluştur'}</small></div>
        {projects.length>0 && <div className="projectPicker">
          <button className={projectMenuOpen?'open':''} onClick={()=>setProjectMenuOpen(v=>!v)}><span><b>{selectedProject?.name}</b><small>{selectedProject?.domain}</small></span><i>⌄</i></button>
          {projectMenuOpen && <div className="projectPickerMenu">{projects.map(p=><button key={p.id} className={p.id===selectedProject?.id?'selected':''} onClick={()=>openProject(p)}><span><strong>{p.name}</strong><small>{p.domain}</small></span>{p.id===selectedProject?.id&&<em>AKTİF</em>}</button>)}</div>}
        </div>}
      </div>

      {error && <div className="error">{error}<button onClick={()=>setError('')}>×</button></div>}
      {moduleLoading && <div className="moduleLoading"><span/> Veriler güncelleniyor…</div>}

      {section==='overview' && <OverviewView overview={overview} projects={projects} audits={audits} alerts={alerts} recommendations={recommendations} onNavigate={setSection} />}
      {section==='projects' && <ProjectsView projects={projects} selected={selectedProject} onSelect={openProject} />}
      {section==='audit' && <AuditView domain={domain} setDomain={setDomain} submit={submit} loading={loading} audit={audit} comparison={comparison} openIssues={openIssues} criticalCount={criticalCount} mediumCount={mediumCount} verdict={verdict} audits={audits} />}
      {section==='final' && <FinalView comparison={comparison} audits={audits} />}
      {section==='ads' && <AdsView audit={audit} integrations={integrations} onGoogleConnect={connectGoogle} onMetaConnect={connectMeta} connecting={connectionLoading} />}
      {section==='analytics' && <AnalyticsView overview={overview} metrics={metrics} />}
      {section==='crm' && <CrmView overview={overview} leads={leads} />}
      {section==='profit' && <ProfitView overview={overview} metrics={metrics} onSave={saveTargets} />}
      {section==='alerts' && <AlertsView alerts={alerts} />}
      {section==='recommendations' && <RecommendationsView recommendations={recommendations} actions={actions} onApprove={approveRecommendation} />}
    </section>
  </main>;
}

function OverviewView({overview,projects,audits,alerts,recommendations,onNavigate}:{overview:Overview|null;projects:Project[];audits:AuditRow[];alerts:AlertRow[];recommendations:RecommendationRow[];onNavigate:(section:Section)=>void}) {
  const latest = audits[0];
  const avgScore = audits.length ? Math.round(audits.reduce((sum,a)=>sum+a.overall_score,0)/audits.length) : 0;
  const criticalAlerts = alerts.filter(a=>['critical','high'].includes(a.severity||'')&&a.status==='open').length;
  const pending = recommendations.filter(r=>r.status==='proposed').length;
  const lastAuditDate = latest?.created_at ? new Date(latest.created_at).toLocaleString('tr-TR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Henüz tarama yok';
  return <div className="dashboardHome">
    <section className="dashboardHero"><div><p className="eyebrow">Growth OS · Genel Bakış</p><h2>Bugün neye müdahale etmeliyiz?</h2><p>Audit, ölçüm, kârlılık, uyarılar ve onay bekleyen aksiyonlar tek merkezde.</p></div><button className="primaryAction" onClick={()=>onNavigate('audit')}>Yeni Audit Başlat</button></section>
    <section className="dashboardStats">
      <div><span>Toplam Proje</span><strong>{projects.length}</strong><small>aktif portföy</small></div>
      <div><span>Son Audit Skoru</span><strong>{latest ? latest.overall_score : '—'}</strong><small>{lastAuditDate}</small></div>
      <div><span>Ortalama Skor</span><strong>{audits.length ? avgScore : '—'}</strong><small>{audits.length} audit</small></div>
      <div><span>Kritik Uyarı</span><strong>{criticalAlerts}</strong><small>{alerts.filter(a=>a.status==='open').length} açık uyarı</small></div>
      <div><span>Bekleyen Öneri</span><strong>{pending}</strong><small>onay bekliyor</small></div>
    </section>
    <div className="dashboardGrid">
      <section className="dashboardMainCard"><div className="dashboardSectionHead"><div><p className="eyebrow">Aktif Proje</p><h3>{overview?.project.name || 'Proje seçilmedi'}</h3></div><button onClick={()=>onNavigate('projects')}>Projeleri Aç</button></div>{overview ? <><div className="overviewScoreRow"><div className="bigScore"><span>Audit skoru</span><strong>{overview.latestAudit?.overall_score ?? latest?.overall_score ?? '—'}</strong></div><div className="overviewMini"><span>ROAS</span><strong>{overview.metrics30d.roas == null ? '—' : overview.metrics30d.roas.toFixed(2)}</strong></div><div className="overviewMini"><span>Brüt Katkı</span><strong>{money(overview.metrics30d.grossProfit)}</strong></div><div className="overviewMini"><span>CRM Lead</span><strong>{overview.crm.total}</strong></div></div><div className="attentionStrip"><span>{overview.openAlerts} açık uyarı</span><span>{overview.pendingRecommendations} bekleyen öneri</span><span>{overview.project.domain}</span></div></> : <div className="empty">Audit bölümünden ilk projeyi oluştur.</div>}</section>
      <section className="quickActions"><p className="eyebrow">Hızlı Aksiyonlar</p><button onClick={()=>onNavigate('audit')}><strong>Yeni Audit</strong><span>Siteyi yeniden tara ve değişimi ölç.</span></button><button onClick={()=>onNavigate('final')}><strong>Final Check</strong><span>Önceki audit ile son durumu karşılaştır.</span></button><button onClick={()=>onNavigate('recommendations')}><strong>Recommendations</strong><span>Önerileri incele ve onay kuyruğuna al.</span></button></section>
    </div>
    <section className="recentAudits"><div className="dashboardSectionHead"><div><p className="eyebrow">Son Aktivite</p><h3>Son auditler</h3></div><button onClick={()=>onNavigate('audit')}>Audit'e Git</button></div>{audits.length===0?<div className="empty">Henüz audit geçmişi yok.</div>:<div className="recentAuditList">{audits.slice(0,5).map(a=><article key={a.id}><div><strong>{a.domain}</strong><span>{new Date(a.created_at).toLocaleString('tr-TR')}</span></div><div className="auditScorePill">{a.overall_score}</div></article>)}</div>}</section>
  </div>;
}

function ProjectsView({projects,selected,onSelect}:{projects:Project[];selected:Project|null;onSelect:(p:Project)=>void}) {
  return <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Portföy</p><h2>Projeler</h2></div><span>{projects.length} proje</span></div>{projects.length===0?<div className="empty">Henüz proje yok. Audit başlatınca otomatik oluşur.</div>:<div className="projectGrid">{projects.map(p=><button key={p.id} className={selected?.id===p.id?'selected':''} onClick={()=>onSelect(p)}><div className="projectAvatar">{p.domain.slice(0,1).toUpperCase()}</div><strong>{p.name}</strong><span>{p.domain}</span><small>{selected?.id===p.id?'Aktif proje':'Projeyi aç →'}</small></button>)}</div>}</section>;
}

function AuditView({domain,setDomain,submit,loading,audit,comparison,openIssues,criticalCount,mediumCount,verdict,audits}:{domain:string;setDomain:(v:string)=>void;submit:(e:FormEvent)=>void;loading:boolean;audit:Audit|null;comparison:Comparison;openIssues:Issue[];criticalCount:number;mediumCount:number;verdict:string;audits:AuditRow[]}) {
  return <><form className="auditBox" onSubmit={submit}><div><label>Domain</label><input value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="domain.com" /></div><button disabled={loading||!domain}>{loading?'Analiz ediliyor…':'Analiz Başlat'}</button></form>{audits.length>0&&<div className="auditHistoryStrip"><span>Son tarama: <b>{new Date(audits[0].created_at).toLocaleString('tr-TR')}</b></span><span>Skor <b>{audits[0].overall_score}</b></span><span>{audits.length} toplam audit</span></div>}{!audit&&<div className="empty"><b>Audit Engine hazır.</b> Domain girerek SEO/GEO/AEO/AIO, Ads Readiness ve teknik görünürlüğü birlikte tara.</div>}{audit&&<><section className="executiveCard"><div className="executiveLead"><p className="eyebrow">Executive Audit Summary</p><h2>{verdict}</h2><p>{audit.domain} için {openIssues.length} açık aksiyon tespit edildi.</p></div><div className="executiveStats"><div><strong>{criticalCount}</strong><span>Kritik/Yüksek</span></div><div><strong>{mediumCount}</strong><span>Orta</span></div><div><strong>{openIssues.length}</strong><span>Toplam Aksiyon</span></div></div></section><div className="scoreGrid"><Score label="Genel" value={audit.overallScore}/><Score label="SEO" value={audit.scores.seo}/><Score label="GEO" value={audit.scores.geo}/><Score label="AEO" value={audit.scores.aeo}/><Score label="AIO" value={audit.scores.aio}/><Score label="Ads Ready" value={audit.scores.adsReadiness}/></div><div className="reportHead"><div><p className="eyebrow">{audit.domain}</p><h2>Detaylı Bulgular</h2></div><span>{openIssues.length} açık aksiyon</span></div><div className="issues">{[...audit.issues].sort((a,b)=>{if(a.status==='pass'&&b.status!=='pass')return 1;if(a.status!=='pass'&&b.status==='pass')return -1;return (severityWeight[b.severity]||0)-(severityWeight[a.severity]||0)}).map(i=><article key={i.key} className={i.status}><div className="issueTop"><strong>{i.title}</strong><span>{i.status==='pass'?'PASS':i.severity.toUpperCase()}</span></div><p>{i.detail}</p>{i.status!=='pass'&&<small>{i.recommendation}</small>}</article>)}</div>{comparison&&<div className="moduleFoot">Final Check verisi hazır. Final Check bölümünden değişimi görebilirsin.</div>}</>}</>;
}

function FinalView({comparison,audits}:{comparison:Comparison;audits:AuditRow[]}) {
  if(audits.length<2||!comparison) return <div className="empty"><b>Final Check için ikinci audit gerekli.</b> Aynı projeyi düzeltmelerden sonra yeniden tara; Growth OS iki sürümü otomatik karşılaştırsın.</div>;
  return <><section className={`finalCard ${comparison.readiness}`}><div><p className="eyebrow">Final Check</p><h2>{comparison.readiness==='ready'?'Reklama Hazır':'Düzeltme Devam Etmeli'}</h2><p>{comparison.verdict}</p></div><div className="finalStats"><div><strong>{comparison.previousScore}</strong><span>Önceki</span></div><div><strong>{comparison.currentScore}</strong><span>Şimdi</span></div><div><strong>{comparison.scoreDelta>0?'+':''}{comparison.scoreDelta}</strong><span>Değişim</span></div><div><strong>{comparison.fixed.length}</strong><span>Düzelen</span></div><div><strong>{comparison.stillOpen.length}</strong><span>Açık</span></div><div><strong>{comparison.newIssues.length}</strong><span>Yeni</span></div></div></section><div className="compareColumns"><section><p className="eyebrow">Düzelenler</p>{comparison.fixed.length?comparison.fixed.map(i=><div className="compareRow good" key={i.key}>{i.title}</div>):<div className="mutedEmpty">Henüz düzelme kaydı yok.</div>}</section><section><p className="eyebrow">Açık Kalanlar</p>{comparison.stillOpen.length?comparison.stillOpen.slice(0,12).map(i=><div className="compareRow" key={i.key}><span>{i.title}</span><b>{i.severity}</b></div>):<div className="mutedEmpty">Açık madde yok.</div>}</section></div></>;
}

function AdsView({audit,integrations,onGoogleConnect,onMetaConnect,connecting}:{audit:Audit|null;integrations:IntegrationRow[];onGoogleConnect:()=>Promise<void>;onMetaConnect:()=>Promise<void>;connecting:'google'|'meta'|null}) {
  const providers=['google_ads','meta_ads','tiktok_ads'];
  const connectedAdsCount = providers.filter(provider=>provider==='google_ads' ? integrations.some(i=>(i.provider==='google_oauth'||i.provider==='google_ads')&&i.status==='connected') : integrations.some(i=>i.provider===provider&&i.status==='connected')).length;
  return <div className="moduleStack"><section className="moduleHero"><div><p className="eyebrow">Ads Readiness</p><h2>Reklam bütçesinden önce altyapıyı doğrula.</h2><p>Ölçümleme, dönüşüm sinyalleri ve hesap bağlantıları tek görünümde.</p></div><Score label="Ads Ready" value={audit?.scores.adsReadiness||0}/></section><section className="integrationGrid">{providers.map(provider=>{const found=provider==='google_ads'?integrations.find(i=>i.provider==='google_oauth'||i.provider==='google_ads'):integrations.find(i=>i.provider===provider);const label=provider==='google_ads'?'Google Ads':provider==='meta_ads'?'Meta Ads':'TikTok Ads';const connected=found?.status==='connected';const onConnect=provider==='google_ads'?onGoogleConnect:provider==='meta_ads'?onMetaConnect:undefined;const loadingKey=provider==='google_ads'?'google':provider==='meta_ads'?'meta':null;return <article key={provider} className={connected?'connected':''}><div className="integrationIcon">{label.slice(0,1)}</div><div><strong>{label}</strong><span>{found?.account_label||'Hesap bağlanmadı'}</span></div>{connected?<em>BAĞLI</em>:onConnect?<button className="integrationConnect" onClick={onConnect} disabled={!!connecting}>{connecting===loadingKey?'AÇILIYOR…':'BAĞLA'}</button>:<button className="integrationConnect" disabled title="OAuth adapter kurulumu sırada">BAĞLA</button>}</article>})}</section><section className="readinessChecklist"><div><span>Audit skoru</span><b>{audit?.overallScore??'—'}</b></div><div><span>Ads readiness</span><b>{audit?.scores.adsReadiness??'—'}</b></div><div><span>Bağlı hesap</span><b>{connectedAdsCount}/3</b></div></section><div className="moduleFoot">Google ve Meta connector'ları aktif OAuth akışına bağlıdır. TikTok connector sıradaki adapter olarak pasif tutulur.</div></div>;
}

function AnalyticsView({overview,metrics}:{overview:Overview|null;metrics:MetricRow[]}) {
  const spend=metrics.reduce((s,m)=>s+number(m.spend),0), revenue=metrics.reduce((s,m)=>s+number(m.attributed_revenue),0), clicks=metrics.reduce((s,m)=>s+number(m.clicks),0), conversions=metrics.reduce((s,m)=>s+number(m.conversions),0);
  return <div className="moduleStack"><section className="metricTiles"><Kpi label="Harcama" value={money(spend||overview?.metrics30d.spend||0)}/><Kpi label="Atfedilen Ciro" value={money(revenue||overview?.metrics30d.revenue||0)}/><Kpi label="ROAS" value={(spend>0?revenue/spend:overview?.metrics30d.roas)?.toFixed(2)||'—'}/><Kpi label="Tıklama" value={clicks.toLocaleString('tr-TR')}/><Kpi label="Dönüşüm" value={conversions.toLocaleString('tr-TR')}/></section><section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Campaign Intelligence</p><h2>Kampanya verileri</h2></div><span>{metrics.length} kayıt</span></div>{metrics.length===0?<div className="empty">Henüz reklam metriği senkronize edilmedi. Connector bağlandığında kampanya verileri burada görünecek.</div>:<div className="dataTable"><div className="dataHead"><span>Kampanya</span><span>Kaynak</span><span>Harcama</span><span>Ciro</span><span>ROAS</span></div>{metrics.slice(0,20).map((m,i)=><div className="dataRow" key={`${m.external_campaign_id}-${m.metric_date}-${i}`}><span><b>{m.campaign_name}</b><small>{m.metric_date}</small></span><span>{m.provider}</span><span>{money(number(m.spend))}</span><span>{money(number(m.attributed_revenue))}</span><span>{number(m.spend)>0?(number(m.attributed_revenue)/number(m.spend)).toFixed(2):'—'}</span></div>)}</div>}</section></div>;
}

function CrmView({overview,leads}:{overview:Overview|null;leads:LeadRow[]}) {
  const won=leads.filter(l=>l.status==='won').length, pipeline=leads.reduce((s,l)=>s+number(l.lead_value),0), wonRevenue=leads.reduce((s,l)=>s+number(l.won_revenue),0);
  return <div className="moduleStack"><section className="metricTiles"><Kpi label="Toplam Lead" value={String(leads.length||overview?.crm.total||0)}/><Kpi label="Kazanılan" value={String(won||overview?.crm.won||0)}/><Kpi label="Pipeline" value={money(pipeline)}/><Kpi label="Kazanılan Ciro" value={money(wonRevenue)}/></section><section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">CRM Pipeline</p><h2>Lead akışı</h2></div><span>{leads.length} lead</span></div>{leads.length===0?<div className="empty">CRM lead verisi henüz yok. Entegrasyon sonrası kaynak, kampanya ve kazanım burada izlenecek.</div>:<div className="leadList">{leads.slice(0,30).map(l=><article key={l.id}><div className="leadAvatar">{(l.name||l.email||'?').slice(0,1).toUpperCase()}</div><div><strong>{l.name||l.email||l.phone||'İsimsiz lead'}</strong><span>{l.source||'direct'} · {l.owner||'atanmadı'}</span></div><em className={`status ${l.status}`}>{l.status}</em><b>{money(number(l.won_revenue||l.lead_value))}</b></article>)}</div>}</section></div>;
}

function ProfitView({overview,metrics,onSave}:{overview:Overview|null;metrics:MetricRow[];onSave:(values:Record<string,number|null>)=>Promise<boolean>}) {
  const [form,setForm]=useState({targetRoas:'',breakEvenRoas:'',targetCpa:'',targetMer:'',avgOrderValue:'',grossMarginPct:'',returnRatePct:'',shippingCost:'',feePct:''});
  const [saved,setSaved]=useState(false);
  useEffect(()=>{const t=overview?.targets;if(!t)return;setForm({targetRoas:String(t.target_roas??''),breakEvenRoas:String(t.break_even_roas??''),targetCpa:String(t.target_cpa??''),targetMer:String(t.target_mer??''),avgOrderValue:String(t.avg_order_value??''),grossMarginPct:t.gross_margin_pct==null?'':String(Number(t.gross_margin_pct)*100),returnRatePct:t.return_rate_pct==null?'':String(Number(t.return_rate_pct)*100),shippingCost:String(t.shipping_cost??''),feePct:t.fee_pct==null?'':String(Number(t.fee_pct)*100)});},[overview?.project.id,overview?.targets]);
  const spend=overview?.metrics30d.spend||0,revenue=overview?.metrics30d.revenue||0,gross=overview?.metrics30d.grossProfit||0,mer=revenue>0?spend/revenue:0;
  async function submitTargets(e:FormEvent){e.preventDefault();const val=(x:string)=>x===''?null:Number(x);const ok=await onSave({targetRoas:val(form.targetRoas),breakEvenRoas:val(form.breakEvenRoas),targetCpa:val(form.targetCpa),targetMer:val(form.targetMer),avgOrderValue:val(form.avgOrderValue),grossMarginPct:form.grossMarginPct===''?null:Number(form.grossMarginPct)/100,returnRatePct:form.returnRatePct===''?null:Number(form.returnRatePct)/100,shippingCost:val(form.shippingCost),feePct:form.feePct===''?null:Number(form.feePct)/100});setSaved(ok);if(ok)setTimeout(()=>setSaved(false),2000);}
  return <div className="moduleStack"><section className="metricTiles"><Kpi label="Atfedilen Ciro" value={money(revenue)}/><Kpi label="Harcama" value={money(spend)}/><Kpi label="Brüt Katkı" value={money(gross)}/><Kpi label="ROAS" value={overview?.metrics30d.roas?.toFixed(2)||'—'}/><Kpi label="MER" value={mer?mer.toFixed(3):'—'}/></section><section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Profit Engine</p><h2>İş hedefleri</h2></div><span>{saved?'Kaydedildi ✓':'Karar eşikleri'}</span></div><form className="targetGrid" onSubmit={submitTargets}>{[['targetRoas','Hedef ROAS'],['breakEvenRoas','Başabaş ROAS'],['targetCpa','Hedef CPA'],['targetMer','Hedef MER'],['avgOrderValue','Ort. Sepet'],['grossMarginPct','Brüt Marj %'],['returnRatePct','İade Oranı %'],['shippingCost','Kargo Maliyeti'],['feePct','Komisyon %']].map(([key,label])=><label key={key}><span>{label}</span><input inputMode="decimal" value={form[key as keyof typeof form]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder="—"/></label>)}<button className="primaryAction" type="submit">Hedefleri Kaydet</button></form></section>{metrics.length===0&&<div className="moduleFoot">Kârlılık hesapları için reklam ve gelir metrikleri bağlandıkça bu ekran gerçek zamanlı karar paneline dönüşür.</div>}</div>;
}

function AlertsView({alerts}:{alerts:AlertRow[]}) {
  const open=alerts.filter(a=>a.status==='open');
  return <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Risk Monitor</p><h2>Alerts</h2></div><span>{open.length} açık</span></div>{open.length===0?<div className="empty"><b>Kritik açık uyarı yok.</b> Yeni audit kritik/yüksek bulgu üretirse otomatik olarak burada görünür.</div>:<div className="alertList">{open.map(a=><article key={a.id} className={a.severity}><div className="alertSeverity">{a.severity.slice(0,1).toUpperCase()}</div><div><strong>{a.title}</strong><p>{a.message}</p><span>{a.source||'system'} · {a.created_at?new Date(a.created_at).toLocaleString('tr-TR'):''}</span></div></article>)}</div>}</section>;
}

function RecommendationsView({recommendations,actions,onApprove}:{recommendations:RecommendationRow[];actions:ActionRow[];onApprove:(id:string)=>Promise<void>}) {
  const proposed=recommendations.filter(r=>r.status==='proposed');
  return <div className="moduleStack"><section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Approval Queue</p><h2>Recommendations</h2></div><span>{proposed.length} onay bekliyor</span></div>{proposed.length===0?<div className="empty">Onay bekleyen öneri yok. Yeni audit açık bulguları otomatik öneriye dönüştürür.</div>:<div className="recommendationList">{proposed.map(r=><article key={r.id}><div className="recPriority">{r.priority}</div><div><strong>{r.title}</strong><p>{r.proposed_action?.recommendation||r.rationale}</p><span>{r.source} · {r.created_at?new Date(r.created_at).toLocaleString('tr-TR'):''}</span></div><button onClick={()=>onApprove(r.id)}>Onayla</button></article>)}</div>}</section><section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Action Log</p><h2>Onay geçmişi</h2></div><span>{actions.length} kayıt</span></div>{actions.length===0?<div className="mutedEmpty">Henüz onaylanmış aksiyon yok.</div>:<div className="actionLog">{actions.slice(0,20).map(a=><article key={a.id}><span>{a.action_type}</span><strong>{a.status}</strong><small>{a.approved_by||'—'} · {a.created_at?new Date(a.created_at).toLocaleString('tr-TR'):''}</small></article>)}</div>}</section></div>;
}

function Score({label,value}:{label:string;value:number}) { return <div className="score"><div className="ring" style={{['--score' as string]:`${value*3.6}deg`}}><span>{value}</span></div><p>{label}</p></div>; }
function Kpi({label,value,note,target}:{label:string;value:string;note?:string;target?:string}) { return <div className="kpi"><span>{label}</span><strong>{value}</strong>{(note||target)&&<small>{target||note}</small>}</div>; }
