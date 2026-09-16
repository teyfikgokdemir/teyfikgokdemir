import { encryptSecret } from './google.js';

const API_BASE='https://business-api.tiktok.com/open_api/v1.3';
const TIKTOK_HTTP_TIMEOUT_MS=20_000;
const TIKTOK_HTTP_MAX_BYTES=4*1024*1024;

function required(name:string){
  const value=process.env[name];
  if(!value)throw new Error(`${name} yapılandırılmamış.`);
  return value;
}

async function readLimitedText(response:Response,maxBytes=TIKTOK_HTTP_MAX_BYTES){
  const contentLength=Number(response.headers.get('content-length')||'0');
  if(Number.isFinite(contentLength)&&contentLength>maxBytes)throw new Error('TikTok API yanıtı boyut limitini aştı.');
  if(!response.body)return '';
  const reader=response.body.getReader();
  const chunks:Uint8Array[]=[];
  let total=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>maxBytes){
        await reader.cancel();
        throw new Error('TikTok API yanıtı boyut limitini aştı.');
      }
      chunks.push(value);
    }
  }finally{
    reader.releaseLock();
  }
  const bytes=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){
    bytes.set(chunk,offset);
    offset+=chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchJson<T>(input:string|URL,init:RequestInit={}):Promise<{response:Response;data:T}>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(new Error('TikTok API isteği zaman aşımına uğradı.')),TIKTOK_HTTP_TIMEOUT_MS);
  try{
    const response=await fetch(input,{...init,signal:controller.signal});
    const text=await readLimitedText(response);
    const data=(text?JSON.parse(text):{}) as T;
    return {response,data};
  }finally{
    clearTimeout(timeout);
  }
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
  const {response,data}=await fetchJson<TikTokTokenResponse>(`${API_BASE}/oauth2/access_token/`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({app_id:required('TIKTOK_APP_ID'),secret:required('TIKTOK_APP_SECRET'),auth_code:authCode})
  });
  if(!response.ok||data.code!==0||!data.data?.access_token){
    throw new Error(data.message||`TikTok token alınamadı (${response.status}).`);
  }
  return data.data;
}

export async function discoverTikTokAdvertisers(accessToken:string){
  const url=new URL(`${API_BASE}/oauth2/advertiser/get/`);
  url.searchParams.set('app_id',required('TIKTOK_APP_ID'));
  url.searchParams.set('secret',required('TIKTOK_APP_SECRET'));
  const {response,data:payload}=await fetchJson<{code?:number;message?:string;data?:{list?:TikTokAdvertiser[];advertisers?:TikTokAdvertiser[]}}>(url,{headers:{'Access-Token':accessToken}});
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
