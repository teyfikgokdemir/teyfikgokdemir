import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { initDb, pool } from './db.js';
import { runAudit } from './audit.js';
import { syncAdsProject } from './ads-sync.js';
import { buildGoogleAuthUrl, discoverGoogleResources, encryptSecret, exchangeGoogleCode, searchConsolePerformanceForProject } from './google.js';
import { buildMetaAuthUrl, discoverMetaResources, exchangeMetaCode, exchangeMetaLongLivedToken, metaCredentialMetadata } from './meta.js';
import { buildTikTokAuthUrl, discoverTikTokAdvertisers, exchangeTikTokCode, tikTokCredentialMetadata } from './tiktok.js';
import { getExecutionCenter } from './execution-workflow.js';
import { buildJobPlan, prepareExecution, runPreparedExecution } from './execution-orchestrator.js';
import { finalizeExecutionForVerification, verifyExecutionJob } from './verification-orchestrator.js';
import { executorCapabilities } from './executors.js';
import { workspaceRouter } from './workspace-routes.js';
import { legacyWorkspaceGuard } from './legacy-access-guard.js';

type AuditPayload = Awaited<ReturnType<typeof runAudit>>;

const app = express();
const normalizeOrigin=(value:string)=>value.trim().replace(/\/$/,'');
const productionOrigins=new Set([
  'https://growth.teyfikgokdemir.com',
  ...(process.env.APP_BASE_URL?[process.env.APP_BASE_URL]:[]),
  ...(process.env.CORS_ALLOWED_ORIGINS||'').split(',')
].map(normalizeOrigin).filter(Boolean));
app.use(cors({
  origin(origin,callback){
    if(!origin||process.env.NODE_ENV!=='production'||productionOrigins.has(normalizeOrigin(origin)))return callback(null,true);
    return callback(new Error('CORS_ORIGIN_DENIED'));
  },
  credentials:false,
  methods:['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders:['content-type','cf-access-authenticated-user-email','cf-access-jwt-assertion']
}));
app.use(express.json({ limit: '1mb' }));
app.use(legacyWorkspaceGuard);
app.use('/workspaces',workspaceRouter);

function compareAudits(previous: AuditPayload | null, current: AuditPayload) {
  if (!previous) return null;
  const prevByKey = new Map(previous.issues.map((issue) => [issue.key, issue]));
  const currentByKey = new Map(current.issues.map((issue) => [issue.key, issue]));
  const fixed = current.issues.filter((issue) => issue.status === 'pass' && prevByKey.get(issue.key)?.status !== 'pass');
  const stillOpen = current.issues.filter((issue) => issue.status !== 'pass' && prevByKey.get(issue.key)?.status !== 'pass');
  const newIssues = current.issues.filter((issue) => issue.status !== 'pass' && prevByKey.get(issue.key)?.status === 'pass');
  const regressed = previous.issues.filter((issue) => issue.status === 'pass' && currentByKey.get(issue.key)?.status !== 'pass');
  const scoreDelta = current.overallScore - previous.overallScore;
  const criticalOpen = current.issues.filter((i) => i.status !== 'pass' && ['critical','high'].includes(i.severity));
  const ready = criticalOpen.length === 0 && current.scores.adsReadiness >= 80 && current.overallScore >= 80;
  return { previousScore:previous.overallScore,currentScore:current.overallScore,scoreDelta,
    fixed:fixed.map(i=>({key:i.key,title:i.title})),stillOpen:current.issues.filter((issue) => issue.status !== 'pass' && prevByKey.get(issue.key)?.status !== 'pass').map(i=>({key:i.key,title:i.title,severity:i.severity})),newIssues:newIssues.map(i=>({key:i.key,title:i.title,severity:i.severity})),regressed:regressed.map(i=>({key:i.key,title:i.title})),
    readiness:ready?'ready':'not_ready',verdict:ready?'Final kontrolden geçti. Reklam hazırlık aşamasına geçilebilir.':`Final kontrol tamamlanmadı. ${criticalOpen.length} kritik/yüksek öncelikli madde açık.` };
}

async function refreshAuditActions(projectId:string, auditId:string, result:AuditPayload) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("update alerts set status='resolved', resolved_at=now() where project_id=$1 and source='audit_engine' and status='open'", [projectId]);
    await client.query("update recommendations set status='superseded', decided_at=now() where project_id=$1 and source='audit_engine' and status='proposed'", [projectId]);
    for (const issue of result.issues.filter(i=>i.status!=='pass')) {
      await client.query(`insert into recommendations(project_id,source,priority,title,rationale,proposed_action,status) values($1,'audit_engine',$2,$3,$4,$5,'proposed')`,[projectId,issue.severity,issue.title,issue.detail,{type:'site_fix',issueKey:issue.key,recommendation:issue.recommendation,auditId}]);
      if (['critical','high'].includes(issue.severity)) await client.query(`insert into alerts(project_id,source,severity,title,message,status,payload) values($1,'audit_engine',$2,$3,$4,'open',$5)`,[projectId,issue.severity,issue.title,issue.recommendation,{issueKey:issue.key,auditId}]);
    }
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}

app.get('/health', (_req, res) => res.json({ ok:true, service:'growth-os-api', time:new Date().toISOString() }));
app.get('/capabilities',(_req,res)=>res.json({mode:'read_only',externalExecution:false,adPublishing:false,budgetMutation:false,creativeMutation:false,metricsSync:true}));
app.get('/projects', async (_req,res)=>{ const {rows}=await pool.query('select * from projects order by created_at desc'); res.json(rows); });

app.get('/projects/:id/overview', async (req,res)=>{
  const projectId=req.params.id;
  const [project,audit,alerts,recommendations,metrics,leads,targets]=await Promise.all([
    pool.query('select * from projects where id=$1',[projectId]),
    pool.query('select overall_score, seo_score, geo_score, aeo_score, aio_score, ads_readiness_score, created_at from audits where project_id=$1 order by created_at desc limit 1',[projectId]),
    pool.query("select count(*)::int as count from alerts where project_id=$1 and status='open'",[projectId]),
    pool.query("select count(*)::int as count from recommendations where project_id=$1 and status='proposed'",[projectId]),
    pool.query("select coalesce(sum(spend),0)::numeric as spend, coalesce(sum(attributed_revenue),0)::numeric as revenue, coalesce(sum(gross_profit),0)::numeric as gross_profit from campaign_metrics where project_id=$1 and metric_date >= current_date - interval '30 days'",[projectId]),
    pool.query("select count(*)::int as total, count(*) filter (where status='won')::int as won from crm_leads where project_id=$1",[projectId]),
    pool.query('select * from business_targets where project_id=$1',[projectId])]);
  if(!project.rows[0]) return res.status(404).json({error:'Proje bulunamadı'});
  const m=metrics.rows[0], spend=Number(m.spend||0), revenue=Number(m.revenue||0);
  res.json({project:project.rows[0],latestAudit:audit.rows[0]||null,openAlerts:alerts.rows[0].count,pendingRecommendations:recommendations.rows[0].count,metrics30d:{spend,revenue,grossProfit:Number(m.gross_profit||0),roas:spend>0?revenue/spend:null},crm:leads.rows[0],targets:targets.rows[0]||null});
});

app.get('/projects/:id/audits',async(req,res)=>{const{rows}=await pool.query('select id, domain, overall_score, seo_score, geo_score, aeo_score, aio_score, ads_readiness_score, created_at from audits where project_id=$1 order by created_at desc',[req.params.id]);res.json(rows)});
app.get('/projects/:id/final-check',async(req,res)=>{const{rows}=await pool.query('select payload, created_at from audits where project_id=$1 order by created_at desc limit 2',[req.params.id]);if(!rows.length)return res.status(404).json({error:'Bu proje için audit bulunamadı.'});const current=rows[0].payload as AuditPayload,previous=rows[1]?.payload as AuditPayload|undefined;res.json({comparison:compareAudits(previous||null,current),current,previous:previous||null})});
app.get('/projects/:id/alerts',async(req,res)=>{const{rows}=await pool.query('select * from alerts where project_id=$1 order by created_at desc limit 100',[req.params.id]);res.json(rows)});
app.get('/projects/:id/recommendations',async(req,res)=>{const{rows}=await pool.query('select * from recommendations where project_id=$1 order by created_at desc limit 100',[req.params.id]);res.json(rows)});
app.get('/projects/:id/metrics',async(req,res)=>{const{rows}=await pool.query('select provider, external_campaign_id, campaign_name, metric_date, spend, impressions, clicks, conversions, attributed_revenue, crm_revenue, gross_profit from campaign_metrics where project_id=$1 order by metric_date desc, spend desc limit 250',[req.params.id]);res.json(rows)});
app.get('/projects/:id/leads',async(req,res)=>{const{rows}=await pool.query('select id,source,campaign_id,name,email,phone,status,lead_value,won_revenue,owner,created_at,updated_at from crm_leads where project_id=$1 order by created_at desc limit 250',[req.params.id]);res.json(rows)});
app.get('/projects/:id/integrations',async(req,res)=>{const{rows}=await pool.query('select id,provider,account_label,external_account_id,status,mode,last_sync_at,created_at from integrations where project_id=$1 order by provider',[req.params.id]);res.json(rows)});
app.get('/projects/:id/actions',async(req,res)=>{const{rows}=await pool.query('select id,recommendation_id,provider,action_type,status,approved_by,executed_at,created_at from action_log where project_id=$1 order by created_at desc limit 100',[req.params.id]);res.json(rows)});

app.get('/projects/:id/execution-center',async(req,res)=>{
  const project=await pool.query('select id from projects where id=$1',[req.params.id]);
  if(!project.rows[0])return res.status(404).json({error:'Proje bulunamadı.'});
  try{res.json({...await getExecutionCenter(req.params.id),executorCapabilities:executorCapabilities(),externalExecution:false})}
  catch(error){res.status(400).json({error:error instanceof Error?error.message:'Execution Center okunamadı.'})}
});
app.get('/execution-jobs/:id/plan',async(req,res)=>{try{res.json(await buildJobPlan(req.params.id))}catch(error){res.status(400).json({error:error instanceof Error?error.message:'Execution planı oluşturulamadı.'})}});
app.post('/execution-jobs/:id/prepare',async(req,res)=>{try{res.json(await prepareExecution(req.params.id))}catch(error){res.status(400).json({error:error instanceof Error?error.message:'Execution hazırlanamadı.'})}});
app.post('/execution-jobs/:id/run',async(req,res)=>{try{res.json(await runPreparedExecution(req.params.id))}catch(error){res.status(400).json({error:error instanceof Error?error.message:'Execution çalıştırılamadı.'})}});
app.post('/execution-jobs/:id/finalize',async(req,res)=>{
  const parsed=z.object({resultState:z.record(z.unknown()).optional()}).safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Execution result state geçersiz.'});
  try{res.json(await finalizeExecutionForVerification(req.params.id,parsed.data.resultState||{}))}catch(error){res.status(400).json({error:error instanceof Error?error.message:'Execution doğrulamaya aktarılamadı.'})}
});
app.post('/execution-jobs/:id/verify',async(req,res)=>{try{res.json(await verifyExecutionJob(req.params.id))}catch(error){res.status(400).json({error:error instanceof Error?error.message:'Execution doğrulanamadı.'})}});

app.post('/projects/:id/ads/sync',async(req,res)=>{
  const parsed=z.object({days:z.number().int().min(1).max(90).optional()}).safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Senkronizasyon aralığı geçersiz.'});
  const project=await pool.query('select id from projects where id=$1',[req.params.id]);
  if(!project.rows[0])return res.status(404).json({error:'Proje bulunamadı.'});
  try{res.json(await syncAdsProject(req.params.id,parsed.data.days||30))}
  catch(error){res.status(400).json({error:error instanceof Error?error.message:'Reklam verileri senkronize edilemedi.'})}
});

app.post('/projects/:id/integrations/google/connect', async (req,res)=>{
  const project=await pool.query('select id from projects where id=$1',[req.params.id]);
  if(!project.rows[0]) return res.status(404).json({error:'Proje bulunamadı'});
  await pool.query("delete from oauth_states where expires_at < now()");
  const state=crypto.randomBytes(32).toString('base64url');
  await pool.query("insert into oauth_states(state,project_id,provider,return_path,expires_at) values($1,$2,'google',$3,now()+interval '10 minutes')",[state,req.params.id,'/?integration=google']);
  try { res.json({authUrl:buildGoogleAuthUrl(state)}); }
  catch(error){res.status(503).json({error:error instanceof Error?error.message:'Google OAuth yapılandırılmamış.'})}
});

app.get('/oauth/google/callback', async (req,res)=>{
  const code=typeof req.query.code==='string'?req.query.code:'';
  const state=typeof req.query.state==='string'?req.query.state:'';
  const appBase=process.env.APP_BASE_URL||'http://localhost:3000';
  if(!code||!state) return res.redirect(`${appBase}/?integration=google_error&reason=missing_code`);
  const stateResult=await pool.query("delete from oauth_states where state=$1 and provider='google' and expires_at>now() returning project_id,return_path",[state]);
  if(!stateResult.rows[0]) return res.redirect(`${appBase}/?integration=google_error&reason=invalid_state`);
  try {
    const token=await exchangeGoogleCode(code);
    if(!token.refresh_token) throw new Error('Google refresh token dönmedi. Bağlantıyı yeniden deneyin.');
    await pool.query(`insert into integrations(project_id,provider,account_label,external_account_id,status,mode,metadata,last_sync_at)
      values($1,'google_oauth','Google Workspace','primary','connected','read_only',$2,now())
      on conflict(project_id,provider,external_account_id) do update set status='connected',mode='read_only',metadata=excluded.metadata,last_sync_at=now()`,
      [stateResult.rows[0].project_id,{refreshTokenEncrypted:encryptSecret(token.refresh_token),scope:token.scope||'',connectedAt:new Date().toISOString()}]);
    res.redirect(`${appBase}/?integration=google_success&project=${stateResult.rows[0].project_id}`);
  } catch(error){console.error(error);res.redirect(`${appBase}/?integration=google_error&reason=exchange_failed`)}
});

app.get('/projects/:id/integrations/google/resources',async(req,res)=>{
  try {
    const resources=await discoverGoogleResources(req.params.id);
    const integration=await pool.query("select metadata from integrations where project_id=$1 and provider='google_oauth' and status='connected' order by created_at desc limit 1",[req.params.id]);
    const metadata=integration.rows[0]?.metadata as {selectedCustomerResourceName?:string;selectedMerchantAccountName?:string}|undefined;
    res.json({...resources,selectedCustomerResourceName:metadata?.selectedCustomerResourceName||null,selectedMerchantAccountName:metadata?.selectedMerchantAccountName||null});
  }
  catch(error){res.status(400).json({error:error instanceof Error?error.message:'Google kaynakları okunamadı.'})}
});

app.get('/projects/:id/search-console/performance',async(req,res)=>{
  const parsed=z.object({days:z.coerce.number().int().min(1).max(90).optional()}).safeParse(req.query);
  if(!parsed.success)return res.status(400).json({error:'Geçerli bir tarih aralığı seçin.'});
  try{res.json(await searchConsolePerformanceForProject(req.params.id,parsed.data.days||28))}
  catch(error){res.status(400).json({error:error instanceof Error?error.message:'Search Console verileri okunamadı.'})}
});

app.post('/projects/:id/integrations/google/select',async(req,res)=>{
  const parsed=z.object({customerResourceName:z.string().regex(/^customers\/\d+$/)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Geçerli Google Ads hesabı seçin.'});
  try {
    const resources=await discoverGoogleResources(req.params.id);
    const names=((resources.ads as {resourceNames?:string[]}|undefined)?.resourceNames)||[];
    if(!names.includes(parsed.data.customerResourceName))return res.status(403).json({error:'Bu Google Ads hesabına erişim bulunamadı.'});
    const customerId=parsed.data.customerResourceName.replace('customers/','');
    const formatted=customerId.length===10?`${customerId.slice(0,3)}-${customerId.slice(3,6)}-${customerId.slice(6)}`:customerId;
    const patch=JSON.stringify({selectedCustomerResourceName:parsed.data.customerResourceName,selectedCustomerId:customerId});
    const {rows}=await pool.query(`update integrations set account_label=$2, metadata=coalesce(metadata,'{}'::jsonb)||$3::jsonb, last_sync_at=now() where project_id=$1 and provider='google_oauth' and status='connected' returning id,provider,account_label,status,mode,last_sync_at,metadata`,[req.params.id,`Google Ads · ${formatted}`,patch]);
    if(!rows[0])return res.status(404).json({error:'Google bağlantısı bulunamadı.'});
    res.json({integration:rows[0],selectedCustomerResourceName:parsed.data.customerResourceName,selectedCustomerId:customerId});
  }catch(error){console.error('Google account mapping failed',error);res.status(400).json({error:error instanceof Error?error.message:'Google hesabı seçilemedi.'})}
});

app.post('/projects/:id/integrations/google/merchant/select',async(req,res)=>{
  const parsed=z.object({accountName:z.string().regex(/^accounts\/\d+$/)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Geçerli Merchant Center hesabı seçin.'});
  try{
    const resources=await discoverGoogleResources(req.params.id);
    const accounts=((resources.merchant as {accounts?:Array<{name?:string;accountName?:string}>}|undefined)?.accounts)||[];
    const account=accounts.find(a=>a.name===parsed.data.accountName);
    if(!account)return res.status(403).json({error:'Bu Merchant Center hesabına erişim bulunamadı.'});
    const patch=JSON.stringify({selectedMerchantAccountName:parsed.data.accountName,selectedMerchantAccountLabel:account.accountName||parsed.data.accountName});
    const {rows}=await pool.query(`update integrations set metadata=coalesce(metadata,'{}'::jsonb)||$2::jsonb,last_sync_at=now() where project_id=$1 and provider='google_oauth' and status='connected' returning id,provider,account_label,status,mode,last_sync_at,metadata`,[req.params.id,patch]);
    if(!rows[0])return res.status(404).json({error:'Google bağlantısı bulunamadı.'});
    res.json({integration:rows[0],selectedMerchantAccountName:parsed.data.accountName,selectedMerchantAccountLabel:account.accountName||parsed.data.accountName});
  }catch(error){console.error('Merchant account mapping failed',error);res.status(400).json({error:error instanceof Error?error.message:'Merchant Center hesabı seçilemedi.'})}
});

app.post('/projects/:id/integrations/meta/connect', async (req,res)=>{
  const project=await pool.query('select id from projects where id=$1',[req.params.id]);
  if(!project.rows[0]) return res.status(404).json({error:'Proje bulunamadı'});
  await pool.query("delete from oauth_states where expires_at < now()");
  const state=crypto.randomBytes(32).toString('base64url');
  await pool.query("insert into oauth_states(state,project_id,provider,return_path,expires_at) values($1,$2,'meta',$3,now()+interval '10 minutes')",[state,req.params.id,'/?integration=meta']);
  try { res.json({authUrl:buildMetaAuthUrl(state)}); }
  catch(error){res.status(503).json({error:error instanceof Error?error.message:'Meta OAuth yapılandırılmamış.'})}
});

app.get('/oauth/meta/callback', async (req,res)=>{
  const code=typeof req.query.code==='string'?req.query.code:'';
  const state=typeof req.query.state==='string'?req.query.state:'';
  const appBase=process.env.APP_BASE_URL||'http://localhost:3000';
  if(!code||!state) return res.redirect(`${appBase}/?integration=meta_error&reason=missing_code`);
  const stateResult=await pool.query("delete from oauth_states where state=$1 and provider='meta' and expires_at>now() returning project_id,return_path",[state]);
  if(!stateResult.rows[0]) return res.redirect(`${appBase}/?integration=meta_error&reason=invalid_state`);
  try {
    const shortToken=await exchangeMetaCode(code);
    const longToken=await exchangeMetaLongLivedToken(shortToken.access_token!);
    const resources=await discoverMetaResources(longToken.access_token!);
    const accounts=((resources.adAccounts as {data?:Array<{id?:string;account_id?:string;name?:string}>})?.data)||[];
    const profile=resources.profile as {id?:string;name?:string};
    const label=accounts.length===1?(accounts[0].name||'Meta Ads'):accounts.length>1?`${accounts.length} Meta Ads hesabı`:(profile.name||'Meta Ads');
    await pool.query(`insert into integrations(project_id,provider,account_label,external_account_id,status,mode,metadata,last_sync_at)
      values($1,'meta_ads',$2,'oauth_primary','connected','read_only',$3,now())
      on conflict(project_id,provider,external_account_id) do update set account_label=excluded.account_label,status='connected',mode='read_only',metadata=excluded.metadata,last_sync_at=now()`,
      [stateResult.rows[0].project_id,label,metaCredentialMetadata(longToken.access_token!,longToken.expires_in,{profile,adAccounts:accounts})]);
    res.redirect(`${appBase}/?integration=meta_success&project=${stateResult.rows[0].project_id}`);
  } catch(error){console.error(error);res.redirect(`${appBase}/?integration=meta_error&reason=exchange_failed`)}
});

app.get('/projects/:id/integrations/meta/resources',async(req,res)=>{
  const {rows}=await pool.query("select metadata from integrations where project_id=$1 and provider='meta_ads' and status='connected' order by created_at desc limit 1",[req.params.id]);
  const metadata=rows[0]?.metadata as {profile?:unknown;adAccounts?:unknown;selectedAdAccountId?:string;selectedAdAccountName?:string}|undefined;
  if(!metadata) return res.status(404).json({error:'Meta bağlantısı bulunamadı.'});
  res.json({profile:metadata.profile||null,adAccounts:metadata.adAccounts||[],selectedAdAccountId:metadata.selectedAdAccountId||null,selectedAdAccountName:metadata.selectedAdAccountName||null});
});

app.post('/projects/:id/integrations/meta/select',async(req,res)=>{
  const parsed=z.object({accountId:z.string().min(2)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Geçerli Meta Ads hesabı seçin.'});
  const integration=await pool.query("select metadata from integrations where project_id=$1 and provider='meta_ads' and status='connected' order by created_at desc limit 1",[req.params.id]);
  const metadata=integration.rows[0]?.metadata as {adAccounts?:Array<{id?:string;account_id?:string;name?:string}>}|undefined;
  if(!metadata)return res.status(404).json({error:'Meta bağlantısı bulunamadı.'});
  const account=(metadata.adAccounts||[]).find(a=>a.id===parsed.data.accountId||a.account_id===parsed.data.accountId);
  if(!account)return res.status(403).json({error:'Bu Meta Ads hesabına erişim bulunamadı.'});
  const accountId=account.id||account.account_id||parsed.data.accountId;
  const accountName=account.name||`Meta Ads · ${account.account_id||accountId}`;
  const {rows}=await pool.query(`update integrations set account_label=$2,metadata=coalesce(metadata,'{}'::jsonb)||$3::jsonb,last_sync_at=now() where project_id=$1 and provider='meta_ads' and status='connected' returning id,provider,account_label,status,mode,last_sync_at`,[req.params.id,accountName,JSON.stringify({selectedAdAccountId:accountId,selectedAdAccountName:accountName})]);
  res.json(rows[0]);
});

app.post('/projects/:id/integrations/tiktok/connect',async(req,res)=>{
  const project=await pool.query('select id from projects where id=$1',[req.params.id]);
  if(!project.rows[0])return res.status(404).json({error:'Proje bulunamadı'});
  await pool.query("delete from oauth_states where expires_at < now()");
  const state=crypto.randomBytes(32).toString('base64url');
  await pool.query("insert into oauth_states(state,project_id,provider,return_path,expires_at) values($1,$2,'tiktok',$3,now()+interval '10 minutes')",[state,req.params.id,'/?integration=tiktok']);
  try{res.json({authUrl:buildTikTokAuthUrl(state)})}
  catch(error){res.status(503).json({error:error instanceof Error?error.message:'TikTok OAuth yapılandırılmamış.'})}
});

app.get('/oauth/tiktok/callback',async(req,res)=>{
  const authCode=typeof req.query.auth_code==='string'?req.query.auth_code:'';
  const state=typeof req.query.state==='string'?req.query.state:'';
  const appBase=process.env.APP_BASE_URL||'http://localhost:3000';
  if(!authCode||!state)return res.redirect(`${appBase}/?integration=tiktok_error&reason=missing_code`);
  const stateResult=await pool.query("delete from oauth_states where state=$1 and provider='tiktok' and expires_at>now() returning project_id,return_path",[state]);
  if(!stateResult.rows[0])return res.redirect(`${appBase}/?integration=tiktok_error&reason=invalid_state`);
  try{
    const token=await exchangeTikTokCode(authCode);
    const advertisers=await discoverTikTokAdvertisers(token.access_token!);
    const first=advertisers[0];
    const label=advertisers.length===1?(first?.advertiser_name||first?.name||`TikTok Ads · ${first?.advertiser_id||''}`):advertisers.length>1?`${advertisers.length} TikTok Ads hesabı`:'TikTok Ads';
    await pool.query(`insert into integrations(project_id,provider,account_label,external_account_id,status,mode,metadata,last_sync_at)
      values($1,'tiktok_ads',$2,'oauth_primary','connected','read_only',$3,now())
      on conflict(project_id,provider,external_account_id) do update set account_label=excluded.account_label,status='connected',mode='read_only',metadata=excluded.metadata,last_sync_at=now()`,
      [stateResult.rows[0].project_id,label,tikTokCredentialMetadata(token.access_token!,token,advertisers)]);
    res.redirect(`${appBase}/?integration=tiktok_success&project=${stateResult.rows[0].project_id}`);
  }catch(error){console.error('TikTok OAuth failed',error);res.redirect(`${appBase}/?integration=tiktok_error&reason=exchange_failed&project=${stateResult.rows[0].project_id}`)}
});

app.get('/projects/:id/integrations/tiktok/resources',async(req,res)=>{
  const {rows}=await pool.query("select metadata from integrations where project_id=$1 and provider='tiktok_ads' and status='connected' order by created_at desc limit 1",[req.params.id]);
  const metadata=rows[0]?.metadata as {advertisers?:unknown;selectedAdvertiserId?:string;selectedAdvertiserName?:string}|undefined;
  if(!metadata)return res.status(404).json({error:'TikTok bağlantısı bulunamadı.'});
  res.json({advertisers:metadata.advertisers||[],selectedAdvertiserId:metadata.selectedAdvertiserId||null,selectedAdvertiserName:metadata.selectedAdvertiserName||null});
});

app.post('/projects/:id/integrations/tiktok/select',async(req,res)=>{
  const parsed=z.object({advertiserId:z.string().min(2)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Geçerli TikTok Ads hesabı seçin.'});
  const integration=await pool.query("select metadata from integrations where project_id=$1 and provider='tiktok_ads' and status='connected' order by created_at desc limit 1",[req.params.id]);
  const metadata=integration.rows[0]?.metadata as {advertisers?:Array<{advertiser_id?:string;advertiser_name?:string;name?:string}>}|undefined;
  if(!metadata)return res.status(404).json({error:'TikTok bağlantısı bulunamadı.'});
  const account=(metadata.advertisers||[]).find(a=>String(a.advertiser_id||'')===parsed.data.advertiserId);
  if(!account)return res.status(403).json({error:'Bu TikTok Ads hesabına erişim bulunamadı.'});
  const accountName=account.advertiser_name||account.name||`TikTok Ads · ${parsed.data.advertiserId}`;
  const {rows}=await pool.query(`update integrations set account_label=$2,metadata=coalesce(metadata,'{}'::jsonb)||$3::jsonb,last_sync_at=now() where project_id=$1 and provider='tiktok_ads' and status='connected' returning id,provider,account_label,status,mode,last_sync_at`,[req.params.id,accountName,JSON.stringify({selectedAdvertiserId:parsed.data.advertiserId,selectedAdvertiserName:accountName})]);
  res.json(rows[0]);
});

app.put('/projects/:id/targets',async(req,res)=>{
  const schema=z.object({targetRoas:z.number().nonnegative().nullable().optional(),breakEvenRoas:z.number().nonnegative().nullable().optional(),targetCpa:z.number().nonnegative().nullable().optional(),targetMer:z.number().nonnegative().nullable().optional(),avgOrderValue:z.number().nonnegative().nullable().optional(),grossMarginPct:z.number().min(0).max(1).nullable().optional(),returnRatePct:z.number().min(0).max(1).nullable().optional(),shippingCost:z.number().nonnegative().nullable().optional(),feePct:z.number().min(0).max(1).nullable().optional()});
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Hedef değerleri geçersiz.'});const d=parsed.data;
  const{rows}=await pool.query(`insert into business_targets(project_id,target_roas,break_even_roas,target_cpa,target_mer,avg_order_value,gross_margin_pct,return_rate_pct,shipping_cost,fee_pct) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict(project_id) do update set target_roas=excluded.target_roas,break_even_roas=excluded.break_even_roas,target_cpa=excluded.target_cpa,target_mer=excluded.target_mer,avg_order_value=excluded.avg_order_value,gross_margin_pct=excluded.gross_margin_pct,return_rate_pct=excluded.return_rate_pct,shipping_cost=excluded.shipping_cost,fee_pct=excluded.fee_pct,updated_at=now() returning *`,[req.params.id,d.targetRoas??null,d.breakEvenRoas??null,d.targetCpa??null,d.targetMer??null,d.avgOrderValue??null,d.grossMarginPct??null,d.returnRatePct??null,d.shippingCost??null,d.feePct??null]);res.json(rows[0]);
});

app.post('/recommendations/:id/approve',async(req,res)=>{const approved=z.object({approvedBy:z.string().min(1)}).safeParse(req.body);if(!approved.success)return res.status(400).json({error:'Onaylayan kullanıcı gerekli.'});const client=await pool.connect();try{await client.query('begin');const rec=await client.query("update recommendations set status='approved', decided_at=now() where id=$1 and status='proposed' returning *",[req.params.id]);if(!rec.rows[0]){await client.query('rollback');return res.status(404).json({error:'Onaylanabilir öneri bulunamadı.'})}const log=await client.query("insert into action_log(project_id,recommendation_id,provider,action_type,status,requested_state,approved_by) values($1,$2,$3,$4,'approved',$5,$6) returning *",[rec.rows[0].project_id,rec.rows[0].id,rec.rows[0].source,rec.rows[0].proposed_action?.type||'pending_external_execution',rec.rows[0].proposed_action,approved.data.approvedBy]);await client.query('commit');res.json({recommendation:rec.rows[0],action:log.rows[0],externalExecution:false})}catch(error){await client.query('rollback');throw error}finally{client.release()}});

app.post('/audit',async(req,res)=>{const parsed=z.object({domain:z.string().min(3),projectName:z.string().min(1).optional()}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Geçerli bir domain girin.'});try{const result=await runAudit(parsed.data.domain);const hostname=new URL(result.domain).hostname.replace(/^www\./,'');const projectName=parsed.data.projectName||hostname;const projectResult=await pool.query('insert into projects(name, domain) values($1,$2) on conflict(domain) do update set name=excluded.name returning id, name, domain',[projectName,hostname]);const project=projectResult.rows[0];const previousResult=await pool.query('select payload from audits where project_id=$1 order by created_at desc limit 1',[project.id]);const previous=previousResult.rows[0]?.payload as AuditPayload|undefined;const insert=await pool.query('insert into audits(project_id, domain, overall_score, seo_score, geo_score, aeo_score, aio_score, ads_readiness_score, payload) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id, created_at',[project.id,result.domain,result.overallScore,result.scores.seo,result.scores.geo,result.scores.aeo,result.scores.aio,result.scores.adsReadiness,result]);await refreshAuditActions(project.id,insert.rows[0].id,result);res.json({project,audit:{...result,id:insert.rows[0].id,createdAt:insert.rows[0].created_at},comparison:compareAudits(previous||null,result)})}catch(error){res.status(502).json({error:error instanceof Error?error.message:'Audit başarısız'})}});
app.get('/audits/:id',async(req,res)=>{const{rows}=await pool.query('select payload, created_at from audits where id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({error:'Audit bulunamadı'});res.json({...rows[0].payload,createdAt:rows[0].created_at})});

app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{console.error(error);res.status(500).json({error:'Beklenmeyen sunucu hatası.'})});
const port=Number(process.env.PORT||4000);
initDb().then(()=>app.listen(port,'0.0.0.0',()=>console.log(`Growth OS API :${port}`))).catch(error=>{console.error(error);process.exit(1)});