interface Env {
  CLARITY_API_TOKEN?: string;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CLARITY_API_TOKEN) return json({ ok: false, reason: 'CLARITY_API_TOKEN yapılandırılmamış' }, 503);
  const requested = new URL(request.url).searchParams.get('numOfDays') || '1';
  const numOfDays = ['1', '2', '3'].includes(requested) ? requested : '1';
  const upstream = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=${numOfDays}&dimension1=Device`, {
    headers: { authorization: `Bearer ${env.CLARITY_API_TOKEN}`, accept: 'application/json' },
  });
  if (!upstream.ok) return json({ ok: false, reason: `Clarity API ${upstream.status}` }, upstream.status === 429 ? 429 : 502);
  const data = await upstream.json();
  return json({ ok: true, generatedAt: new Date().toISOString(), numOfDays, data });
};
