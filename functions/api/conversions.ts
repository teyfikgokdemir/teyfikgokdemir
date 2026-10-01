interface Env {
  CANSU_ANALYTICS_DB: D1Database;
}

const SITES = new Set(['teyfikgokdemir', 'ctseg', 'mythborn', 'qct-studio', 'qct-commerce-tr', 'olivon-agency']);
const EVENT_TYPES = new Set(['form_submit', 'rfq_submit', 'whatsapp_click', 'phone_click', 'email_click', 'purchase', 'lead']);
const ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://ctseg.com.tr',
  'https://mythborn.co',
  'https://qctstudio.com',
  'https://qctcommerce.com',
  'https://olivon.com.tr',
  'https://olivonagency.com',
  'https://olivon.agency',
  'https://olivon-agency.pages.dev',
]);

const clean = (value: unknown, max: number) =>
  String(value ?? '').trim().slice(0, max).replace(/[\u0000-\u001f\u007f]/g, '');

const cors = (origin: string | null) => ({
  'access-control-allow-origin': origin && ORIGINS.has(origin) ? origin : 'null',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store',
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'content-type': 'application/json; charset=utf-8' },
  });

const sourceName = (body: Record<string, unknown>) => {
  const utmSource = clean(body.utm_source, 80).toLowerCase();
  const utmMedium = clean(body.utm_medium, 80).toLowerCase();
  const referrer = clean(body.referrer_host, 160).toLowerCase().replace(/^www\./, '');
  if (utmSource) return utmMedium ? `${utmSource} / ${utmMedium}` : utmSource;
  if (!referrer) return 'direct';
  if (referrer.includes('google.')) return 'google';
  if (referrer.includes('bing.')) return 'bing';
  if (referrer.includes('chatgpt.com')) return 'chatgpt';
  return referrer;
};

const dayString = (daysAgo = 0) => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (!env.CANSU_ANALYTICS_DB) {
    return json({ ok: false, error: 'Analytics database is not configured' }, 503, origin);
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json() as Record<string, unknown>;
      const site = clean(body.site, 40);
      const eventType = clean(body.event_type, 40);
      if (!SITES.has(site)) return json({ ok: false, error: 'Unknown site' }, 400, origin);
      if (!EVENT_TYPES.has(eventType)) return json({ ok: false, error: 'Unknown event type' }, 400, origin);

      const landingPath = clean(body.landing_path, 180) || '/';
      const source = sourceName(body);
      const day = dayString();

      await env.CANSU_ANALYTICS_DB.prepare(
        `INSERT INTO conversion_events (site, day, event_type, landing_path, source, count)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(site, day, event_type, landing_path, source)
         DO UPDATE SET count = count + 1`
      ).bind(site, day, eventType, landingPath, source).run();

      return json({ ok: true }, 202, origin);
    } catch {
      return json({ ok: false, error: 'Invalid conversion event' }, 400, origin);
    }
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const site = clean(url.searchParams.get('site'), 40);
    const siteFilter = site && SITES.has(site) ? site : null;

    const queryPeriod = async (since: string) => {
      const sql = siteFilter
        ? `SELECT site, event_type, SUM(count) AS count
           FROM conversion_events
           WHERE day >= ? AND site = ?
           GROUP BY site, event_type
           ORDER BY count DESC`
        : `SELECT site, event_type, SUM(count) AS count
           FROM conversion_events
           WHERE day >= ?
           GROUP BY site, event_type
           ORDER BY count DESC`;

      const statement = env.CANSU_ANALYTICS_DB.prepare(sql);
      const result = siteFilter
        ? await statement.bind(since, siteFilter).all<{ site: string; event_type: string; count: number }>()
        : await statement.bind(since).all<{ site: string; event_type: string; count: number }>();

      return result.results ?? [];
    };

    const [oneDay, sevenDays, thirtyDays] = await Promise.all([
      queryPeriod(dayString(1)),
      queryPeriod(dayString(7)),
      queryPeriod(dayString(30)),
    ]);

    const summarize = (rows: Array<{ site: string; event_type: string; count: number }>) => ({
      total: rows.reduce((sum, row) => sum + Number(row.count || 0), 0),
      bySite: rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.site] = (acc[row.site] || 0) + Number(row.count || 0);
        return acc;
      }, {}),
      byType: rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.event_type] = (acc[row.event_type] || 0) + Number(row.count || 0);
        return acc;
      }, {}),
      rows,
    });

    return json({
      ok: true,
      generatedAt: new Date().toISOString(),
      site: siteFilter,
      periods: {
        oneDay: summarize(oneDay),
        sevenDays: summarize(sevenDays),
        thirtyDays: summarize(thirtyDays),
      },
    }, 200, origin);
  }

  return json({ ok: false, error: 'Method not allowed' }, 405, origin);
};
