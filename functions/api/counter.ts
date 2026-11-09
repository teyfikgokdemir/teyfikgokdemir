interface Env {
  CANSU_ANALYTICS_DB?: D1Database;
  COUNTER_AUTH_SECRET?: string;
}

// 7-day monitoring window: 2026-11-09T00:00:00Z to 2026-11-16T23:59:59Z
const MONITORING_START = 1794182400000; // 2026-11-09T00:00:00Z
const MONITORING_EXPIRY = 1794787199000; // 2026-11-16T23:59:59Z
const DEFAULT_AUTH_TOKEN = 'psatm-master-recovery-2026';

const SITES = new Set([
  'teyfikgokdemir',
  'ctseg',
  'mythborn',
  'qct-studio',
  'qct-commerce-tr',
  'qctone',
  'olivon-agency'
]);

const ALLOWED_ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://www.teyfikgokdemir.com',
  'https://cansu.teyfikgokdemir.com',
  'https://ctseg.com.tr',
  'https://www.ctseg.com.tr',
  'https://mythborn.co',
  'https://www.mythborn.co',
  'https://qctstudio.com',
  'https://www.qctstudio.com',
  'https://qctcommerce.com',
  'https://www.qctcommerce.com',
  'https://qctone.com',
  'https://www.qctone.com',
  'https://olivon.com.tr',
  'https://www.olivon.com.tr',
]);

const corsHeaders = (origin: string | null) => {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : '*';
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-api-key',
    'cache-control': 'no-store, no-cache, must-revalidate',
  };
};

const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json; charset=utf-8' },
  });

const sanitizePath = (raw: unknown): string => {
  const str = String(raw || '/').trim();
  const clean = str.split('?')[0].split('#')[0];
  return clean.slice(0, 100);
};

const BOT_UA_REGEX = /bot|spider|crawl|slurp|googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkshare|w3c_validator|headlesschrome|playwright|puppeteer|lighthouse|pagespeed/i;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const now = Date.now();
  const isExpired = now > MONITORING_EXPIRY;

  // Ensure DB binding exists
  if (!env.CANSU_ANALYTICS_DB) {
    return json({ ok: false, error: 'Database binding CANSU_ANALYTICS_DB missing' }, 503, origin);
  }

  // Ensure table exists on first run
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

  // POST: Record count
  if (request.method === 'POST') {
    if (isExpired) {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Payload size guard (< 2048 bytes)
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 2048) {
      return json({ ok: false, error: 'Payload too large' }, 413, origin);
    }

    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const site = String(body.site || '').trim();
      if (!SITES.has(site)) {
        return json({ ok: false, error: 'Invalid or unregistered site' }, 400, origin);
      }

      const path = sanitizePath(body.path);
      const ua = request.headers.get('user-agent') || '';
      const cf = (request as any).cf;

      // Server-side & client-side hybrid bot classification
      const isServerBot =
        BOT_UA_REGEX.test(ua) ||
        cf?.botManagement?.verifiedBot === true ||
        (typeof cf?.botManagement?.score === 'number' && cf.botManagement.score < 30);

      const isClientBot = body.is_bot === true || body.is_bot === 1;
      const isBot = (isServerBot || isClientBot) ? 1 : 0;

      const day = new Date(now).toISOString().slice(0, 10);
      const country = String(cf?.country || 'XX').slice(0, 4);

      // Increment aggregate counter safely
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

  // GET: Reporting (Protected with authentication)
  if (request.method === 'GET') {
    const url = new URL(request.url);

    // Authentication check
    const authHeader = request.headers.get('authorization') || '';
    const tokenHeader = request.headers.get('x-api-key') || '';
    const queryToken = url.searchParams.get('token') || '';
    const expectedToken = env.COUNTER_AUTH_SECRET || DEFAULT_AUTH_TOKEN;

    const providedToken = authHeader.replace(/^Bearer\s+/i, '').trim() || tokenHeader.trim() || queryToken.trim();
    if (providedToken !== expectedToken) {
      return json({ ok: false, error: 'Unauthorized: valid token required' }, 401, origin);
    }

    const site = (url.searchParams.get('site') || '').trim();
    if (site && !SITES.has(site)) {
      return json({ ok: false, error: 'Invalid site parameter' }, 400, origin);
    }

    const detail = url.searchParams.get('detail') || '';

    try {
      if (detail === 'paths') {
        let query = `
          SELECT site, day, path, is_bot, SUM(hits) as total_hits
          FROM privacy_traffic_7d
        `;
        const params: any[] = [];
        if (site) {
          query += ' WHERE site = ?';
          params.push(site);
        }
        query += ' GROUP BY site, day, path, is_bot ORDER BY day DESC, total_hits DESC LIMIT 200';
        const res = await env.CANSU_ANALYTICS_DB.prepare(query).bind(...params).all();

        return json({
          ok: true,
          monitoring: {
            start: new Date(MONITORING_START).toISOString(),
            expiry: new Date(MONITORING_EXPIRY).toISOString(),
            isExpired,
            now: new Date(now).toISOString(),
          },
          paths: res.results || [],
        }, 200, origin);
      }

      // Default overview query
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
