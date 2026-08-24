interface Env {
  GSC_CLIENT_ID?: string;
  GSC_CLIENT_SECRET?: string;
  GSC_REDIRECT_URI?: string;
  CANSU_GSC_TOKENS?: KVNamespace;
}

const redirect = (request: Request, path: string, status = 302) => Response.redirect(new URL(path, request.url).toString(), status);
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  if (oauthError) return redirect(request, `/cansu/?gsc=error&reason=${encodeURIComponent(oauthError)}`);
  if (!code || !state || !env.CANSU_GSC_TOKENS) return json({ ok: false, error: 'OAuth callback eksik veya geçersiz' }, 400);
  const stateValue = await env.CANSU_GSC_TOKENS.get(`oauth_state:${state}`);
  if (stateValue !== 'pending') return json({ ok: false, error: 'OAuth state geçersiz veya süresi dolmuş' }, 400);
  await env.CANSU_GSC_TOKENS.delete(`oauth_state:${state}`);
  if (!env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET || !env.GSC_REDIRECT_URI) return json({ ok: false, error: 'Search Console OAuth secret yapılandırması eksik' }, 503);

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.GSC_CLIENT_ID, client_secret: env.GSC_CLIENT_SECRET, redirect_uri: env.GSC_REDIRECT_URI, grant_type: 'authorization_code' }),
  });
  const tokenPayload = await tokenResponse.json() as { refresh_token?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok || !tokenPayload.refresh_token) {
    return json({ ok: false, error: tokenPayload.error_description || tokenPayload.error || `Google token ${tokenResponse.status}` }, 502);
  }
  await env.CANSU_GSC_TOKENS.put('gsc_refresh_token', tokenPayload.refresh_token);
  return redirect(request, '/cansu/?gsc=connected');
};
