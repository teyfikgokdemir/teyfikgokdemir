import { encryptSecret } from './google.js';

export const META_SCOPES = ['ads_read','business_management'];

function required(name:string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} yapılandırılmamış.`);
  return value;
}

function graphBase() {
  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0';
  return `https://graph.facebook.com/${version}`;
}

export function buildMetaAuthUrl(state:string) {
  const url = new URL('https://www.facebook.com/dialog/oauth');
  url.searchParams.set('client_id', required('META_APP_ID'));
  url.searchParams.set('redirect_uri', required('META_REDIRECT_URI'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('config_id', required('META_CONFIG_ID'));
  url.searchParams.set('scope', META_SCOPES.join(','));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeMetaCode(code:string) {
  const url = new URL(`${graphBase()}/oauth/access_token`);
  url.searchParams.set('client_id', required('META_APP_ID'));
  url.searchParams.set('client_secret', required('META_APP_SECRET'));
  url.searchParams.set('redirect_uri', required('META_REDIRECT_URI'));
  url.searchParams.set('code', code);
  const response = await fetch(url);
  const data = await response.json() as {access_token?:string;token_type?:string;expires_in?:number;error?:{message?:string}};
  if (!response.ok || !data.access_token) throw new Error(data.error?.message || 'Meta access token alınamadı.');
  return data;
}

export async function exchangeMetaLongLivedToken(shortToken:string) {
  const url = new URL(`${graphBase()}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', required('META_APP_ID'));
  url.searchParams.set('client_secret', required('META_APP_SECRET'));
  url.searchParams.set('fb_exchange_token', shortToken);
  const response = await fetch(url);
  const data = await response.json() as {access_token?:string;token_type?:string;expires_in?:number;error?:{message?:string}};
  if (!response.ok || !data.access_token) throw new Error(data.error?.message || 'Meta uzun süreli token alınamadı.');
  return data;
}

async function getJson(path:string, accessToken:string) {
  const url = new URL(`${graphBase()}${path}`);
  url.searchParams.set('access_token', accessToken);
  const response = await fetch(url);
  const data = await response.json() as Record<string,unknown> & {error?:{message?:string}};
  if (!response.ok) throw new Error(data.error?.message || `Meta API ${response.status}`);
  return data;
}

export async function discoverMetaResources(accessToken:string) {
  const [profile, adAccounts] = await Promise.all([
    getJson('/me?fields=id,name', accessToken),
    getJson('/me/adaccounts?fields=id,account_id,name,account_status,currency,timezone_name,business_name&limit=200', accessToken)
  ]);
  return {profile, adAccounts};
}

export function metaCredentialMetadata(accessToken:string, expiresIn?:number, extra:Record<string,unknown>={}) {
  return {
    accessTokenEncrypted: encryptSecret(accessToken),
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scopes: META_SCOPES,
    configurationId: process.env.META_CONFIG_ID || null,
    connectedAt: new Date().toISOString(),
    ...extra
  };
}
