const enc = new TextEncoder();
function hex(bytes) { return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function sha256(v){ return hex(await crypto.subtle.digest('SHA-256', enc.encode(v))); }
function json(body,status=200){ return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}}); }
function randomCode(){ const a=new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000).padStart(6,'0'); }

export async function onRequestPost(context){
  const db=context.env.CANSU_ANALYTICS_DB;
  if(!db) return json({ok:false,error:'db_unavailable'},503);
  const now=Date.now();
  const ip=context.request.headers.get('CF-Connecting-IP')||'unknown';
  const ipHash=await sha256(ip);
  const recent=await db.prepare('SELECT COUNT(*) c FROM cansu_access_codes WHERE requester_ip_hash=? AND requested_at>?')
    .bind(ipHash,now-15*60*1000).first();
  if(Number(recent?.c||0)>=3) return json({ok:false,error:'rate_limited'},429);

  const code=randomCode();
  const hash=await sha256(code);
  const expires=now+10*60*1000;
  const ua=(context.request.headers.get('user-agent')||'').slice(0,240);
  await db.prepare('INSERT INTO cansu_access_codes(code_hash,requested_at,expires_at,requester_ip_hash,requester_ua) VALUES(?,?,?,?,?)')
    .bind(hash,now,expires,ipHash,ua).run();

  const apiKey=context.env.RESEND_API_KEY;
  const owner=context.env.CANSU_ACCESS_EMAIL;
  if(!apiKey||!owner) return json({ok:false,error:'mail_not_configured'},503);
  const mail=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{authorization:'Bearer '+apiKey,'content-type':'application/json'},
    body:JSON.stringify({
      from: context.env.CANSU_ACCESS_FROM || 'Cansu Access <onboarding@resend.dev>',
      to:[owner],
      subject:'Cansu erişim kodu: '+code,
      text:'Cansu Operations Center erişim talebi.\n\nTek kullanımlık kod: '+code+'\nGeçerlilik: 10 dakika.\n\nIP hash: '+ipHash.slice(0,12)
    })
  });
  if(!mail.ok) {\n    let detail='';\n    try { detail=(await mail.text()).slice(0,500); } catch {}\n    console.error('Cansu access mail failed', mail.status, detail);\n    return json({ok:false,error:'mail_failed',status:mail.status,detail},502);\n  }
  return json({ok:true,expiresIn:600});
}
