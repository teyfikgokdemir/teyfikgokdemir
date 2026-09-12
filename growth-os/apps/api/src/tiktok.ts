import { encryptSecret } from './google.js';

const API_BASE='https://business-api.tiktok.com/open_api/v1.3';

function required(name:string){
  const value=process.env[name];
  if(!value)throw new Error(`${name} yapılandırılmamış.`);
  return value;
}

export type TikTokAdvertiser={
  advertiser_id?:string;
  advertiser_name?:string;
  name?:string;
};

export type TikTokTokenResponse={
  code?:number;
  message?:string;
  request_id?:string;
  data?:{
    access_token?:string;
    advertiser_ids?:string[];
    scope?:string[]|string;
    token_type?:string;
    refresh_token?:string;
    expires_in?:number;
    refresh_token_expires_in?:number;
  };
};

export function buildTikTokAuthUrl(state:string){
  const url=new URL('https://ads.tiktok.com/marketing_api/auth');
  url.searchParams.set('app_id',required('TIKTOK_APP_ID'));
  url.searchParams.set('state',state);
  url.searchParams.set('redirect_uri',required('TIKTOK_REDIRECT_URI'));
  return url.toString();
}

export async function exchangeTikTokCode(authCode:string){
  const response=await fetch(`${API_BASE}/oauth2/access_token/`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({app_id:required('TIKTOK_APP_ID'),secret:required('TIKTOK_APP_SECRET'),auth_code:authCode})
  });
  const data=await response.json() as TikTokTokenResponse;
  if(!response.ok||data.code!==0||!data.data?.access_token){
    throw new Error(data.message||`TikTok token alınamadı (${response.status}).`);
  }
  return data.data;
}

export async function discoverTikTokAdvertisers(accessToken:string){
  const url=new URL(`${API_BASE}/oauth2/advertiser/get/`);
  url.searchParams.set('app_id',required('TIKTOK_APP_ID'));
  url.searchParams.set('secret',required('TIKTOK_APP_SECRET'));
  const response=await fetch(url,{headers:{'Access-Token':accessToken}});
  const payload=await response.json() as {code?:number;message?:string;data?:{list?:TikTokAdvertiser[];advertisers?:TikTokAdvertiser[]}};
  if(!response.ok||payload.code!==0)throw new Error(payload.message||`TikTok reklam hesapları okunamadı (${response.status}).`);
  return payload.data?.list||payload.data?.advertisers||[];
}

export function tikTokCredentialMetadata(accessToken:string,tokenData:TikTokTokenResponse['data'],advertisers:TikTokAdvertiser[]){
  const scope=Array.isArray(tokenData?.scope)?tokenData?.scope.join(','):tokenData?.scope||'';
  return {
    accessTokenEncrypted:encryptSecret(accessToken),
    refreshTokenEncrypted:tokenData?.refresh_token?encryptSecret(tokenData.refresh_token):null,
    expiresIn:tokenData?.expires_in||null,
    refreshTokenExpiresIn:tokenData?.refresh_token_expires_in||null,
    scope,
    advertisers,
    connectedAt:new Date().toISOString()
  };
}
