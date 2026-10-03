const CANSU_HOST = 'cansu.teyfikgokdemir.com';
const PUBLIC_PATHS = new Set(['/login', '/login/', '/api/access/request', '/api/access/request/', '/api/access/verify', '/api/access/verify/']);
const MACHINE_PATHS = new Set(['/api/umami-config', '/api/conversions', '/api/sources']);
// Public measurement clients must load without a dashboard session.
const MEASUREMENT_ASSETS = new Set(['/cansu-source-beacon.js', '/cansu-umami-loader.js', '/cansu-events.js']);
const enc = new TextEncoder();

function hex(bytes) { return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''); }
async function sha256(value) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(value))); }
function cookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}
async function sessionValid(context) {
  const token = cookie(context.request, 'cansu_session');
  if (!token || !context.env.CANSU_ANALYTICS_DB) return false;
  const hash = await sha256(token);
  const now = Date.now();
  const row = await context.env.CANSU_ANALYTICS_DB.prepare(
    'SELECT expires_at, revoked_at FROM cansu_access_sessions WHERE token_hash = ? LIMIT 1'
  ).bind(hash).first();
  return !!row && !row.revoked_at && Number(row.expires_at) > now;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname !== CANSU_HOST) return context.next();

  if (MACHINE_PATHS.has(url.pathname)) return context.next();
  if (MEASUREMENT_ASSETS.has(url.pathname)) return context.next();
  if (PUBLIC_PATHS.has(url.pathname)) return context.next();

  if (!(await sessionValid(context))) {
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok:false, error:'unauthorized' }), { status:401, headers:{'content-type':'application/json'} });
    }
    return Response.redirect(new URL('/login', url).toString(), 302);
  }

  if (url.pathname === '/' || url.pathname === '') {
    const target = new URL('/cansu/', url);
    const response = await context.env.ASSETS.fetch(new Request(target, context.request));
    const headers = new Headers(response.headers);
    headers.set('content-location', '/');
    return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
  }

  return context.next();
}
