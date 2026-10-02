const enc=new TextEncoder();
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function sha256(v){return hex(await crypto.subtle.digest('SHA-256',enc.encode(v)));}
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});}
function token(){const b=new Uint8Array(32);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}

export async function onRequestPost(context){
 const db=context.env.CANSU_ANALYTICS_DB;
 if(!db)return json({ok:false,error:'db_unavailable'},503);
 let body;try{body=await context.request.json();}catch{return json({ok:false,error:'bad_request'},400);}
 const code=String(body?.code||'').trim();
 if(!/^\d{6}$/.test(code))return json({ok:false,error:'invalid_code'},400);
 const now=Date.now(), hash=await sha256(code);
 const row=await db.prepare('SELECT id,expires_at,used_at FROM cansu_access_codes WHERE code_hash=? ORDER BY id DESC LIMIT 1').bind(hash).first();
 if(!row||row.used_at||Number(row.expires_at)<=now)return json({ok:false,error:'invalid_or_expired'},401);
 await db.prepare('UPDATE cansu_access_codes SET used_at=? WHERE id=? AND used_at IS NULL').bind(now,row.id).run();
 const raw=token(), tokenHash=await sha256(raw), expires=now+4*60*60*1000;
 const ip=context.request.headers.get('CF-Connecting-IP')||'unknown';
 const ua=(context.request.headers.get('user-agent')||'').slice(0,240);
 await db.prepare('INSERT INTO cansu_access_sessions(token_hash,created_at,expires_at,ip_hash,user_agent) VALUES(?,?,?,?,?)')
  .bind(tokenHash,now,expires,await sha256(ip),ua).run();
 return json({ok:true,expiresIn:14400},200,{'set-cookie':`cansu_session=${encodeURIComponent(raw)}; Path=/; Max-Age=14400; HttpOnly; Secure; SameSite=Strict`});
}
