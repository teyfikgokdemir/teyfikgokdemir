import crypto from 'node:crypto';
import { pool } from './db.js';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/content'
];

function required(name:string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} yapılandırılmamış.`);
  return value;
}

function key() {
  return crypto.createHash('sha256').update(required('INTEGRATION_ENCRYPTION_KEY')).digest();
}

export function encryptSecret(value:string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(value:string) {
  const [ivText, tagText, dataText] = value.split('.');
  if (!ivText || !tagText || !dataText) throw new Error('Şifreli credential formatı geçersiz.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
}

export function buildGoogleAuthUrl(state:string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', required('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', required('GOOGLE_REDIRECT_URI'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeGoogleCode(code:string) {
  const body = new URLSearchParams({
    code,
    client_id: required('GOOGLE_CLIENT_ID'),
    client_secret: required('GOOGLE_CLIENT_SECRET'),
    redirect_uri: required('GOOGLE_REDIRECT_URI'),
    grant_type: 'authorization_code'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  const data = await response.json() as {access_token?:string;refresh_token?:string;expires_in?:number;scope?:string;token_type?:string;id_token?:string;error?:string;error_description?:string};
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || 'Google token alınamadı.');
  return data;
}

export async function refreshGoogleAccessToken(refreshToken:string) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: required('GOOGLE_CLIENT_ID'),
    client_secret: required('GOOGLE_CLIENT_SECRET'),
    grant_type: 'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  const data = await response.json() as {access_token?:string;expires_in?:number;error?:string;error_description?:string};
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || 'Google token yenilenemedi.');
  return data.access_token;
}

export async function googleAccessForProject(projectId:string) {
  const { rows } = await pool.query("select metadata from integrations where project_id=$1 and provider='google_oauth' and status='connected' order by created_at desc limit 1", [projectId]);
  const metadata = rows[0]?.metadata as {refreshTokenEncrypted?:string}|undefined;
  if (!metadata?.refreshTokenEncrypted) throw new Error('Google bağlantısı bulunamadı.');
  return refreshGoogleAccessToken(decryptSecret(metadata.refreshTokenEncrypted));
}

async function getJson(url:string, accessToken:string) {
  const response = await fetch(url, {headers:{authorization:`Bearer ${accessToken}`}});
  const text = await response.text();
  let data:unknown = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {raw:text}; }
  if (!response.ok) throw new Error(`Google API ${response.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`);
  return data;
}

async function postJson(url:string, accessToken:string, body:unknown) {
  const response=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json'},body:JSON.stringify(body)});
  const text=await response.text();
  let data:unknown={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!response.ok)throw new Error(`Google API ${response.status}: ${typeof data==='object'?JSON.stringify(data):text}`);
  return data;
}

function isoDate(date:Date){return date.toISOString().slice(0,10)}

export async function searchConsolePerformanceForProject(projectId:string,days=28){
  const project=await pool.query('select domain from projects where id=$1',[projectId]);
  const domain=String(project.rows[0]?.domain||'').replace(/^www\./,'').toLowerCase();
  if(!domain)throw new Error('Proje bulunamadı.');
  const accessToken=await googleAccessForProject(projectId);
  const sites=await getJson('https://www.googleapis.com/webmasters/v3/sites',accessToken) as {siteEntry?:Array<{siteUrl?:string;permissionLevel?:string}>};
  const entries=sites.siteEntry||[];
  const exactDomain=`sc-domain:${domain}`;
  const site=entries.find(s=>s.siteUrl===exactDomain)||entries.find(s=>String(s.siteUrl||'').toLowerCase().includes(domain));
  if(!site?.siteUrl)throw new Error(`Search Console içinde ${domain} için erişilebilir property bulunamadı.`);
  const end=new Date();
  const start=new Date();
  start.setUTCDate(start.getUTCDate()-(Math.max(1,Math.min(days,90))-1));
  const base={startDate:isoDate(start),endDate:isoDate(end),rowLimit:1000,dataState:'final'};
  const endpoint=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`;
  const [queries,pages]=await Promise.all([
    postJson(endpoint,accessToken,{...base,dimensions:['query']}),
    postJson(endpoint,accessToken,{...base,dimensions:['page']})
  ]) as [{rows?:Array<{keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number}>},{rows?:Array<{keys?:string[];clicks?:number;impressions?:number;ctr?:number;position?:number}>}];
  const queryRows=queries.rows||[];
  const pageRows=pages.rows||[];
  const summary=queryRows.reduce((acc,row)=>{
    acc.clicks+=Number(row.clicks||0);
    acc.impressions+=Number(row.impressions||0);
    acc.positionWeighted+=Number(row.position||0)*Number(row.impressions||0);
    return acc;
  },{clicks:0,impressions:0,positionWeighted:0});
  return {
    siteUrl:site.siteUrl,
    permissionLevel:site.permissionLevel||null,
    days:Math.max(1,Math.min(days,90)),
    summary:{clicks:summary.clicks,impressions:summary.impressions,ctr:summary.impressions>0?summary.clicks/summary.impressions:0,position:summary.impressions>0?summary.positionWeighted/summary.impressions:null},
    queries:queryRows.slice(0,100),
    pages:pageRows.slice(0,100)
  };
}

export async function discoverGoogleResources(projectId:string) {
  const accessToken = await googleAccessForProject(projectId);
  const adsVersion = process.env.GOOGLE_ADS_API_VERSION || 'v25';
  const results:{ads?:unknown;analytics?:unknown;searchConsole?:unknown;merchant?:unknown;errors:Record<string,string>} = {errors:{}};

  const jobs:[keyof Omit<typeof results,'errors'>,()=>Promise<unknown>][] = [
    ['ads',()=>getJson(`https://googleads.googleapis.com/${adsVersion}/customers:listAccessibleCustomers`,accessToken)],
    ['analytics',()=>getJson('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',accessToken)],
    ['searchConsole',()=>getJson('https://www.googleapis.com/webmasters/v3/sites',accessToken)],
    ['merchant',()=>getJson('https://merchantapi.googleapis.com/accounts/v1alpha/accounts?pageSize=500',accessToken)]
  ];

  await Promise.all(jobs.map(async ([key,job])=>{
    try { results[key] = await job(); }
    catch (error) { results.errors[key] = error instanceof Error ? error.message : 'Kaynak okunamadı'; }
  }));
  return results;
}
