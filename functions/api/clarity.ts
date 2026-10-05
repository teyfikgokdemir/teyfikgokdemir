interface Env {
  CLARITY_API_TOKEN?: string;
  [key: string]: unknown;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const params = new URL(request.url).searchParams;
  const site = params.get('site') || 'ctseg';
  const secretName = site === 'ctseg' ? 'CLARITY_API_TOKEN' : `CLARITY_API_TOKEN_${site.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`;
  const token = env[secretName] as string | undefined;
  if (!token) return json({ ok: false, site, code: 'missing_token', reason: `${secretName} yapılandırılmamış` }, 503);
  const requested = params.get('numOfDays') || '1';
  const numOfDays = ['1', '2', '3'].includes(requested) ? requested : '1';
  try {
    const upstream = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=${numOfDays}&dimension1=Device`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) {
      const code = upstream.status === 429 ? 'rate_limited' : [401, 403].includes(upstream.status) ? 'auth_error' : 'upstream_error';
      return json({ ok: false, site, code, upstreamStatus: upstream.status, reason: upstream.status === 429 ? 'Clarity API 429 · günlük istek limiti aşıldı' : `Clarity API ${upstream.status}` }, upstream.status === 429 ? 429 : 502);
    }
    const data = await upstream.json();
    return json({ ok: true, site, generatedAt: new Date().toISOString(), numOfDays, data });
  } catch {
    return json({ ok: false, site, code: 'upstream_error', reason: 'Clarity API verisi alınamadı' }, 502);
  }
};
