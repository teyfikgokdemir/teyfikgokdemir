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
  if (!token) return json({ ok: false, site, reason: `${secretName} yapılandırılmamış` }, 503);
  const requested = params.get('numOfDays') || '1';
  const numOfDays = ['1', '2', '3'].includes(requested) ? requested : '1';
  const upstream = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=${numOfDays}&dimension1=Device`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  if (!upstream.ok) return json({ ok: false, reason: `Clarity API ${upstream.status}` }, upstream.status === 429 ? 429 : 502);
  const data = await upstream.json();
  return json({ ok: true, site, generatedAt: new Date().toISOString(), numOfDays, data });
};
