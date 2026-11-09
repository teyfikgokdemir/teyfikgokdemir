interface Env {
  CANSU_ANALYTICS_DB?: D1Database;
  COUNTER_AUTH_SECRET?: string;
}

// 7-day monitoring window: 2026-11-09T00:00:00Z to 2026-11-15T23:59:59Z
const MONITORING_START = 1794182400000; // 2026-11-09T00:00:00Z
const MONITORING_EXPIRY = 1794787199000; // 2026-11-15T23:59:59Z

const SITES = new Set([
  'teyfikgokdemir',
  'ctseg',
  'mythborn',
  'qct-studio',
  'qct-commerce-tr',
  'qctone'
]);

// Whitelisted origins permitted to send analytics events
const ALLOWED_COLLECTION_ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://www.teyfikgokdemir.com',
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
]);

// Independent site-to-origin mapping to prevent cross-site origin spoofing
const SITE_PERMITTED_ORIGINS: Record<string, string[]> = {
  'teyfikgokdemir': ['https://teyfikgokdemir.com', 'https://www.teyfikgokdemir.com'],
  'ctseg': ['https://ctseg.com.tr', 'https://www.ctseg.com.tr'],
  'mythborn': ['https://mythborn.co', 'https://www.mythborn.co'],
  'qct-studio': ['https://qctstudio.com', 'https://www.qctstudio.com'],
  'qct-commerce-tr': ['https://qctcommerce.com', 'https://www.qctcommerce.com'],
  'qctone': ['https://qctone.com', 'https://www.qctone.com'],
};

// Administrative origins allowed for reporting CORS (Never wildcard)
const ALLOWED_ADMIN_ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://www.teyfikgokdemir.com',
]);

const getCorsHeaders = (origin: string | null, isAdmin = false) => {
  const allowedSet = isAdmin ? ALLOWED_ADMIN_ORIGINS : ALLOWED_COLLECTION_ORIGINS;
  const isAllowed = origin && allowedSet.has(origin);
  const headers: Record<string, string> = {
    'cache-control': 'no-store, no-cache, must-revalidate',
    'x-content-type-options': 'nosniff',
  };

  if (isAllowed && origin) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-methods'] = isAdmin ? 'GET, OPTIONS' : 'POST, OPTIONS';
    headers['access-control-allow-headers'] = isAdmin ? 'authorization, x-api-key' : 'content-type';
    headers['vary'] = 'Origin';
  }

  return headers;
};

const jsonResponse = (body: unknown, status = 200, origin: string | null = null, isAdmin = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(origin, isAdmin),
      'content-type': 'application/json; charset=utf-8',
    },
  });

// Path sanitization: removes query params, hashes, email addresses, UUIDs, and limits length
const sanitizePath = (raw: unknown): string => {
  if (typeof raw !== 'string') return '/';
  const clean = raw.trim().split('?')[0].split('#')[0];
  const withoutMultiSlash = clean.replace(/\/+/g, '/');
  // Mask email addresses
  const maskedEmail = withoutMultiSlash.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
  // Mask long hex/UUID strings
  const maskedId = maskedEmail.replace(/[0-9a-fA-F-]{24,}/g, '[id]');
  const finalPath = maskedId.startsWith('/') ? maskedId : `/${maskedId}`;
  return finalPath.slice(0, 80);
};

const BOT_UA_REGEX = /bot|spider|crawl|slurp|googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkshare|w3c_validator|headlesschrome|playwright|puppeteer|lighthouse|pagespeed/i;

const ensureAggregateTable = (database: D1Database) => database.prepare(
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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');
  const now = Date.now();

  // OPTIONS preflight handler
  if (request.method === 'OPTIONS') {
    const isGet = request.headers.get('access-control-request-method') === 'GET';
    const allowedSet = isGet ? ALLOWED_ADMIN_ORIGINS : ALLOWED_COLLECTION_ORIGINS;
    if (origin && !allowedSet.has(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin, isGet),
    });
  }

  if (request.method !== 'POST' && request.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, origin, false);
  }

  // POST: Record aggregate count ping
  if (request.method === 'POST') {
    // Check monitoring timeframe
    if (now < MONITORING_START || now > MONITORING_EXPIRY) {
      return new Response(null, { status: 204, headers: getCorsHeaders(origin, false) });
    }

    // Browser telemetry must carry an allowlisted Origin. This is one abuse signal,
    // not authentication; edge rate limiting provides an independent control.
    if (!origin || !ALLOWED_COLLECTION_ORIGINS.has(origin)) {
      return jsonResponse({ ok: false, error: 'Origin not permitted' }, 403, origin, false);
    }

    // Payload size guard: Max 1024 bytes
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 1024) {
      return jsonResponse({ ok: false, error: 'Payload too large' }, 413, origin, false);
    }

    let body: Record<string, unknown>;
    try {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).byteLength > 1024) {
        return jsonResponse({ ok: false, error: 'Payload too large' }, 413, origin, false);
      }
      body = JSON.parse(rawBody) as Record<string, unknown>;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonResponse({ ok: false, error: 'Invalid payload structure' }, 400, origin, false);
      }
    } catch {
      return jsonResponse({ ok: false, error: 'Malformed JSON payload' }, 400, origin, false);
    }

    // Site parameter validation
    if (typeof body.site !== 'string' || !SITES.has(body.site)) {
      return jsonResponse({ ok: false, error: 'Invalid or unregistered site parameter' }, 400, origin, false);
    }
    const site = body.site;

    // Cross-site origin anti-forgery validation
    if (origin) {
      const permittedOrigins = SITE_PERMITTED_ORIGINS[site];
      if (permittedOrigins && !permittedOrigins.includes(origin)) {
        return jsonResponse({ ok: false, error: 'Origin mismatch for site identifier' }, 403, origin, false);
      }
    }

    // Path validation & sanitization
    if (body.path !== undefined && typeof body.path !== 'string') {
      return jsonResponse({ ok: false, error: 'Invalid path format' }, 400, origin, false);
    }
    const path = sanitizePath(body.path);

    // Hybrid server-authoritative bot classification
    const ua = request.headers.get('user-agent') || '';
    const cf = (request as any).cf;
    const isServerBot =
      BOT_UA_REGEX.test(ua) ||
      cf?.botManagement?.verifiedBot === true ||
      (typeof cf?.botManagement?.score === 'number' && cf.botManagement.score < 30);
    const isClientBot = body.is_bot === true || body.is_bot === 1;
    const isBot = (isServerBot || isClientBot) ? 1 : 0;

    const day = new Date(now).toISOString().slice(0, 10);
    const country = String(cf?.country || 'XX').slice(0, 4);

    if (!env.CANSU_ANALYTICS_DB) {
      return jsonResponse({ ok: false, error: 'Database service unavailable' }, 503, origin);
    }

    try {
      await ensureAggregateTable(env.CANSU_ANALYTICS_DB);
    } catch {
      return jsonResponse({ ok: false, error: 'Database initialisation error' }, 500, origin);
    }

    try {
      await env.CANSU_ANALYTICS_DB.prepare(
        `INSERT INTO privacy_traffic_7d (site, day, path, country, is_bot, hits)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(site, day, path, country, is_bot) DO UPDATE SET hits = hits + 1`
      ).bind(site, day, path, country, isBot).run();

      return jsonResponse({ ok: true }, 200, origin, false);
    } catch {
      return jsonResponse({ ok: false, error: 'Database record failed' }, 500, origin, false);
    }
  }

  // GET: Administrative Reporting (Strict Header-only Authentication)
  if (request.method === 'GET') {
    const url = new URL(request.url);

    // Reject query string authentication tokens explicitly
    if (url.searchParams.has('token') || url.searchParams.has('key') || url.searchParams.has('auth')) {
      return jsonResponse({ ok: false, error: 'Query parameter authentication prohibited. Use Authorization header.' }, 401, origin, true);
    }

    // Fail closed: Missing or misconfigured server secret
    const serverSecret = env.COUNTER_AUTH_SECRET ? env.COUNTER_AUTH_SECRET.trim() : '';
    if (!serverSecret || serverSecret.length < 16) {
      return jsonResponse({ ok: false, error: 'Authentication service unavailable' }, 503, origin, true);
    }

    // Header extraction: Bearer token or X-API-Key
    const authHeader = request.headers.get('authorization') || '';
    const apiKeyHeader = request.headers.get('x-api-key') || '';
    const provided = authHeader.replace(/^Bearer\s+/i, '').trim() || apiKeyHeader.trim();

    if (!provided || provided !== serverSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized: valid credentials required' }, 401, origin, true);
    }

    // Filter by site if requested
    const site = (url.searchParams.get('site') || '').trim();
    if (site && !SITES.has(site)) {
      return jsonResponse({ ok: false, error: 'Invalid site parameter' }, 400, origin, true);
    }

    const detail = url.searchParams.get('detail') || '';
    const isExpired = now > MONITORING_EXPIRY;

    if (!env.CANSU_ANALYTICS_DB) {
      return jsonResponse({ ok: false, error: 'Database service unavailable' }, 503, origin, true);
    }

    try {
      await ensureAggregateTable(env.CANSU_ANALYTICS_DB);
    } catch {
      return jsonResponse({ ok: false, error: 'Database initialisation error' }, 500, origin, true);
    }

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

        return jsonResponse({
          ok: true,
          monitoring: {
            start: new Date(MONITORING_START).toISOString(),
            expiry: new Date(MONITORING_EXPIRY).toISOString(),
            isExpired,
            now: new Date(now).toISOString(),
          },
          paths: res.results || [],
        }, 200, origin, true);
      }

      // Default aggregate overview
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

      return jsonResponse({
        ok: true,
        monitoring: {
          start: new Date(MONITORING_START).toISOString(),
          expiry: new Date(MONITORING_EXPIRY).toISOString(),
          isExpired,
          now: new Date(now).toISOString(),
        },
        rows: results.results || [],
      }, 200, origin, true);
    } catch {
      return jsonResponse({ ok: false, error: 'Database query execution failed' }, 500, origin, true);
    }
  }

};
