interface Env {
  CANSU_ANALYTICS_DB: D1Database;
}

const SITES = new Set(['teyfikgokdemir', 'ctseg', 'mythborn', 'qct-studio', 'qct-commerce-tr', 'iran-ahli']);
const ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://ctseg.com.tr',
  'https://mythborn.co',
  'https://qctstudio.com',
  'https://qctcommerce.com',
  'https://iran-ahli.pages.dev',
  'https://atelierpersia.com',
]);

const cors = (origin: string | null) => ({
  'access-control-allow-origin': origin && ORIGINS.has(origin) ? origin : 'null',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store',
});

const response = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors(origin), 'content-type': 'application/json; charset=utf-8' },
});

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max).replace(/[\u0000-\u001f\u007f]/g, '');

const sourceName = (body: Record<string, unknown>) => {
  const utmSource = clean(body.utm_source, 80).toLowerCase();
  const utmMedium = clean(body.utm_medium, 80).toLowerCase();
  const referrer = clean(body.referrer_host, 160).toLowerCase().replace(/^www\./, '');
  if (utmSource) return utmMedium ? `${utmSource} / ${utmMedium}` : utmSource;
  if (!referrer) return 'Doğrudan / bilinmiyor';
  if (referrer.includes('google.')) return 'Google';
  if (referrer.includes('bing.')) return 'Bing';
  if (referrer.includes('facebook.') || referrer.includes('instagram.') || referrer.includes('linkedin.') || referrer.includes('t.co')) return referrer;
  return referrer;
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (!env.CANSU_ANALYTICS_DB) return response({ ok: false, error: 'Analytics database is not configured' }, 503, origin);

  if (request.method === 'POST') {
    try {
      const body = await request.json() as Record<string, unknown>;
      const site = clean(body.site, 40);
      if (!SITES.has(site)) return response({ ok: false, error: 'Unknown site' }, 400, origin);
      const source = sourceName(body);
      const path = clean(body.landing_path, 180) || '/';
      const day = new Date().toISOString().slice(0, 10);
      await env.CANSU_ANALYTICS_DB.prepare(
        'INSERT INTO source_events (site, day, source, landing_path, views) VALUES (?, ?, ?, ?, 1) ON CONFLICT(site, day, source, landing_path) DO UPDATE SET views = views + 1',
      ).bind(site, day, source, path).run();
      return response({ ok: true }, 202, origin);
    } catch {
      return response({ ok: false, error: 'Invalid analytics event' }, 400, origin);
    }
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const eventSite = clean(url.searchParams.get('event_site'), 40);
    if (eventSite) {
      if (!SITES.has(eventSite)) return response({ ok: false, error: 'Unknown site' }, 400, origin);
      const source = sourceName({
        referrer_host: url.searchParams.get('referrer_host'),
        utm_source: url.searchParams.get('utm_source'),
        utm_medium: url.searchParams.get('utm_medium'),
      });
      const path = clean(url.searchParams.get('landing_path'), 180) || '/';
      const day = new Date().toISOString().slice(0, 10);
      await env.CANSU_ANALYTICS_DB.prepare(
        'INSERT INTO source_events (site, day, source, landing_path, views) VALUES (?, ?, ?, ?, 1) ON CONFLICT(site, day, source, landing_path) DO UPDATE SET views = views + 1',
      ).bind(eventSite, day, source, path).run();
      return response({ ok: true }, 202, origin);
    }
    const site = clean(url.searchParams.get('site'), 40);
    if (!SITES.has(site)) return response({ ok: false, error: 'Unknown site' }, 400, origin);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = await env.CANSU_ANALYTICS_DB.prepare(
      'SELECT source, SUM(views) AS views FROM source_events WHERE site = ? AND day >= ? GROUP BY source ORDER BY views DESC LIMIT 12',
    ).bind(site, since).all<{ source: string; views: number }>();
    return response({ ok: true, site, since, sources: result.results ?? [] }, 200, origin);
  }

  return response({ ok: false, error: 'Method not allowed' }, 405, origin);
};
