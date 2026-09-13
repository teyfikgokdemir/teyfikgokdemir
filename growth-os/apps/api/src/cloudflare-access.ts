import { createPublicKey, verify as verifySignature } from 'node:crypto';
import type { Request } from 'express';

type JwtHeader={alg?:string;kid?:string;typ?:string};
type JwtPayload={
  aud?:string|string[];
  email?:string;
  exp?:number;
  iat?:number;
  iss?:string;
  nbf?:number;
  sub?:string;
};
type Jwk={kid?:string;kty?:string;alg?:string;use?:string;[key:string]:unknown};
type Jwks={keys?:Jwk[]};

type CachedJwks={expiresAt:number;keys:Jwk[]};
let cachedJwks:CachedJwks|null=null;

function normalizeTeamDomain(value:string){
  const trimmed=value.trim().replace(/\/$/,'');
  if(!trimmed)return '';
  return /^https?:\/\//i.test(trimmed)?trimmed:`https://${trimmed}`;
}

function decodeJson<T>(value:string):T{
  return JSON.parse(Buffer.from(value,'base64url').toString('utf8')) as T;
}

function audienceMatches(actual:string|string[]|undefined,expected:string){
  if(Array.isArray(actual))return actual.includes(expected);
  return actual===expected;
}

async function loadJwks(teamDomain:string){
  const now=Date.now();
  if(cachedJwks&&cachedJwks.expiresAt>now)return cachedJwks.keys;

  const response=await fetch(`${teamDomain}/cdn-cgi/access/certs`,{
    headers:{accept:'application/json'},
    signal:AbortSignal.timeout(5000)
  });
  if(!response.ok)throw new Error('CF_ACCESS_JWKS_UNAVAILABLE');
  const payload=await response.json() as Jwks;
  const keys=Array.isArray(payload.keys)?payload.keys:[];
  if(keys.length===0)throw new Error('CF_ACCESS_JWKS_UNAVAILABLE');
  cachedJwks={keys,expiresAt:now+5*60*1000};
  return keys;
}

export function cloudflareAccessConfigured(){
  return Boolean(process.env.CF_ACCESS_TEAM_DOMAIN?.trim()&&process.env.CF_ACCESS_AUD?.trim());
}

export async function verifiedCloudflareAccessEmail(req:Request){
  const teamDomain=normalizeTeamDomain(process.env.CF_ACCESS_TEAM_DOMAIN||'');
  const expectedAudience=(process.env.CF_ACCESS_AUD||'').trim();
  if(!teamDomain||!expectedAudience)throw new Error('CF_ACCESS_CONFIG_MISSING');

  const token=req.header('cf-access-jwt-assertion')||'';
  if(!token)throw new Error('CF_ACCESS_JWT_MISSING');
  const parts=token.split('.');
  if(parts.length!==3)throw new Error('CF_ACCESS_JWT_INVALID');

  let header:JwtHeader;
  let payload:JwtPayload;
  try{
    header=decodeJson<JwtHeader>(parts[0]);
    payload=decodeJson<JwtPayload>(parts[1]);
  }catch{
    throw new Error('CF_ACCESS_JWT_INVALID');
  }

  if(header.alg!=='RS256'||!header.kid)throw new Error('CF_ACCESS_JWT_INVALID');
  if(payload.iss!==teamDomain||!audienceMatches(payload.aud,expectedAudience))throw new Error('CF_ACCESS_JWT_INVALID');

  const now=Math.floor(Date.now()/1000);
  if(typeof payload.exp!=='number'||payload.exp<=now)throw new Error('CF_ACCESS_JWT_INVALID');
  if(typeof payload.nbf==='number'&&payload.nbf>now+30)throw new Error('CF_ACCESS_JWT_INVALID');

  const keys=await loadJwks(teamDomain);
  const jwk=keys.find(key=>key.kid===header.kid&&key.kty==='RSA');
  if(!jwk)throw new Error('CF_ACCESS_JWT_INVALID');

  let publicKey;
  try{
    publicKey=createPublicKey({key:jwk as never,format:'jwk'});
  }catch{
    throw new Error('CF_ACCESS_JWT_INVALID');
  }
  const signature=Buffer.from(parts[2],'base64url');
  const valid=verifySignature('RSA-SHA256',Buffer.from(`${parts[0]}.${parts[1]}`),publicKey,signature);
  if(!valid)throw new Error('CF_ACCESS_JWT_INVALID');

  const email=typeof payload.email==='string'?payload.email.trim().toLowerCase():'';
  if(!email)throw new Error('CF_ACCESS_JWT_INVALID');

  const forwardedEmail=(req.header('cf-access-authenticated-user-email')||'').trim().toLowerCase();
  if(forwardedEmail&&forwardedEmail!==email)throw new Error('CF_ACCESS_IDENTITY_MISMATCH');
  return email;
}
