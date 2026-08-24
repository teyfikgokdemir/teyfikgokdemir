interface Env {
  GSC_CLIENT_ID?: string;
  GSC_REDIRECT_URI?: string;
  CANSU_GSC_TOKENS?: KVNamespace;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GSC_CLIENT_ID || !env.GSC_REDIRECT_URI || !env.CANSU_GSC_TOKENS) {
    return json({ ok: false, error: 'Search Console OAuth yapılandırması eksik' }, 503);
  }
  const stateBytes = new Uint8Array(24);
  crypto.getRandomValues(stateBytes);
  const state = Array.from(stateBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  await env.CANSU_GSC_TOKENS.put(`oauth_state:${state}`, 'pending', { expirationTtl: 600 });
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GSC_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', env.GSC_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);
  return Response.redirect(authUrl.toString(), 302);
};
