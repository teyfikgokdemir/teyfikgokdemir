interface Env {
  CANSU_ANALYTICS_DB?: D1Database;
}

// 7-day monitoring window: 2026-11-09T00:00:00Z to 2026-11-16T23:59:59Z
const MONITORING_START = 1794182400000; // 2026-11-09T00:00:00Z
const MONITORING_EXPIRY = 1794787199000; // 2026-11-16T23:59:59Z

const SITES = new Set(['teyfikgokdemir', 'ctseg', 'mythborn', 'qct-studio', 'qct-commerce-tr', 'qctone', 'olivon-agency']);
const ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://cansu.teyfikgokdemir.com',
  'https://ctseg.com.tr',
  'https://mythborn.co',
  'https://qctstudio.com',
  'https://qctcommerce.com',
  'https://qctone.com',
  'https://olivon.com.tr',
]);

const cors = (origin: string | null) => ({
  'access-control-allow-origin': origin && ORIGINS.has(origin) ? origin : 'null',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store, no-cache, must-revalidate',
});

const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'content-type': 'application/json; charset=utf-8' },
  });

const cleanPath = (raw: unknown) => {
  const str = String(raw || '/').trim();
  const withoutQuery = str.split('?')[0].split('#')[0];
  return withoutQuery.slice(0, 120);
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  // Auto-expire check
  const now = Date.now();
  const isExpired = now > MONITORING_EXPIRY;

  if (request.method === 'POST') {
    if (isExpired) {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (!env.CANSU_ANALYTICS_DB) {
      return json({ ok: false, error: 'Database binding missing' }, 503, origin);
    }

    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const site = String(body.site || '').trim();
      if (!SITES.has(site)) {
        return json({ ok: false, error: 'Invalid site' }, 400, origin);
      }

      const path = cleanPath(body.path);
      const isBot = body.is_bot === true || body.is_bot === 1 ? 1 : 0;
      const day = new Date(now).toISOString().slice(0, 10);
      const cf = (request as any).cf;
      const country = String(cf?.country || 'XX').slice(0, 4);

      // Ensure aggregate table exists
      await env.CANSU_ANALYTICS_DB.prepare(
        `CREATE TABLE IF NOT EXISTS privacy_traffic_7d (
          site TEXT NOT NULL,
          day TEXT NOT NULL,
          path TEXT NOT NULL,
          country TEXT NOT NULL,
          is_bot INTEGER NOT NULL DEFAULT 0,
          hits INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (site, day, path, country, is_bot)
        )`
      ).run();

      await env.CANSU_ANALYTICS_DB.prepare(
        `INSERT INTO privacy_traffic_7d (site, day, path, country, is_bot, hits)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(site, day, path, country, is_bot) DO UPDATE SET hits = hits + 1`
      ).bind(site, day, path, country, isBot).run();

      return json({ ok: true }, 200, origin);
    } catch (e: any) {
      return json({ ok: false, error: e.message }, 500, origin);
    }
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const site = (url.searchParams.get('site') || '').trim();
    if (site && !SITES.has(site)) {
      return json({ ok: false, error: 'Invalid site' }, 400, origin);
    }

    if (!env.CANSU_ANALYTICS_DB) {
      return json({ ok: false, error: 'Database binding missing' }, 503, origin);
    }

    try {
      await env.CANSU_ANALYTICS_DB.prepare(
        `CREATE TABLE IF NOT EXISTS privacy_traffic_7d (
          site TEXT NOT NULL,
          day TEXT NOT NULL,
          path TEXT NOT NULL,
          country TEXT NOT NULL,
          is_bot INTEGER NOT NULL DEFAULT 0,
          hits INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (site, day, path, country, is_bot)
        )`
      ).run();

      let query = `
        SELECT site, day, is_bot, SUM(hits) as total_hits, COUNT(DISTINCT path) as unique_paths
        FROM privacy_traffic_7d
      `;
      const params: any[] = [];
      if (site) {
        query += ' WHERE site = ?';
        params.push(site);
      }
      query += ' GROUP BY site, day, is_bot ORDER BY day DESC, total_hits DESC';

      const results = await env.CANSU_ANALYTICS_DB.prepare(query).bind(...params).all();

      return json({
        ok: true,
        monitoring: {
          start: new Date(MONITORING_START).toISOString(),
          expiry: new Date(MONITORING_EXPIRY).toISOString(),
          isExpired,
          now: new Date(now).toISOString(),
        },
        rows: results.results || [],
      }, 200, origin);
    } catch (e: any) {
      return json({ ok: false, error: e.message }, 500, origin);
    }
  }

  return json({ ok: false, error: 'Method not allowed' }, 405, origin);
};
