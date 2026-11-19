interface Env {
  CANSU_ANALYTICS_DB: D1Database;
}

const SITE_ORDER = ['qct-commerce-tr', 'ctseg', 'qct-studio', 'teyfikgokdemir', 'mythborn', 'qctone'] as const;
const SITES = new Set<string>(SITE_ORDER);
const SITE_LABELS: Record<string, string> = {
  'qct-commerce-tr': 'QCT Commerce',
  ctseg: 'CTSEG',
  'qct-studio': 'QCT Studio',
  teyfikgokdemir: 'Teyfik Gökdemir',
  mythborn: 'Mythborn',
  qctone: 'QCT One',
};
const ORIGINS = new Set([
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
const SITE_ORIGINS: Record<string, string[]> = {
  teyfikgokdemir: ['https://teyfikgokdemir.com', 'https://www.teyfikgokdemir.com'],
  ctseg: ['https://ctseg.com.tr', 'https://www.ctseg.com.tr'],
  mythborn: ['https://mythborn.co', 'https://www.mythborn.co'],
  'qct-studio': ['https://qctstudio.com', 'https://www.qctstudio.com'],
  'qct-commerce-tr': ['https://qctcommerce.com', 'https://www.qctcommerce.com'],
  qctone: ['https://qctone.com', 'https://www.qctone.com'],
};
const CONSENT_ACTIONS = new Set(['banner_shown', 'accept', 'reject', 'dismiss', 'ignored']);
const BOT_UA = /bot|spider|crawl|slurp|headlesschrome|playwright|puppeteer|lighthouse|pagespeed/i;
const RETENTION_DAYS = 450; // Preserves lossless aggregate history well past 2027-01-01
const TRACKING_UNTIL = '2027-01-01';
const SAFE_PATH_BUCKETS = new Set(['about', 'blog', 'contact', 'en', 'tr', 'de', 'it', 'fa', 'ru', 'zh', 'vi', 'uk', 'ro', 'bg', 'he', 'ar', 'sq', 'mk', 'sr', 'az', 'services', 'solutions', 'insights', 'work', 'markets', 'trade-products', 'privacy-policy', 'cookie-policy', 'terms', 'kvkk']);
let retentionCleanupDay = '';

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

const cleanPath = (value: unknown) => {
  const raw = clean(value, 220).split(/[?#]/)[0].replace(/\/{2,}/g, '/');
  const first = raw.split('/').filter(Boolean)[0]?.toLowerCase() || '';
  return first && SAFE_PATH_BUCKETS.has(first) ? `/${first}` : first ? '/other' : '/';
};

const allowedOrigin = (origin: string | null) => Boolean(origin && ORIGINS.has(origin));

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

const ensureConsentTable = async (env: Env) => {
  await env.CANSU_ANALYTICS_DB.prepare(
    `CREATE TABLE IF NOT EXISTS consent_actions_daily (
      site TEXT NOT NULL,
      day TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (site, day, action)
    )`
  ).run();
};

const ensureCountryTable = async (env: Env) => {
  await env.CANSU_ANALYTICS_DB.prepare(
    `CREATE TABLE IF NOT EXISTS privacy_country_daily (
      site TEXT NOT NULL,
      day TEXT NOT NULL,
      country TEXT NOT NULL,
      is_bot INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (site, day, country, is_bot)
    )`
  ).run();
};

const ensureFirstPartyV2 = async (env: Env) => {
  await env.CANSU_ANALYTICS_DB.prepare(
    `CREATE TABLE IF NOT EXISTS first_party_sessions_v2 (
      site TEXT NOT NULL,
      session_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      day TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'Doğrudan / bilinmiyor',
      landing_path TEXT NOT NULL DEFAULT '/',
      country TEXT NOT NULL DEFAULT 'Bilinmiyor',
      region TEXT NOT NULL DEFAULT 'Bilinmiyor',
      city TEXT NOT NULL DEFAULT 'Bilinmiyor',
      PRIMARY KEY (site, session_id)
    )`
  ).run();
  await env.CANSU_ANALYTICS_DB.prepare(
    'CREATE INDEX IF NOT EXISTS idx_first_party_sessions_v2_day_site ON first_party_sessions_v2(day, site)'
  ).run();
};

type RequestWithCf = Request & {
  cf?: {
    country?: string;
    region?: string;
    city?: string;
    botManagement?: { verifiedBot?: boolean; score?: number };
  };
};

const recordGeo = async (env: Env, request: Request, site: string, day: string) => {
  const cf = (request as RequestWithCf).cf;
  const country = clean(cf?.country, 80) || 'Bilinmiyor';
  const region = clean(cf?.region, 120) || 'Bilinmiyor';
  const city = clean(cf?.city, 120) || 'Bilinmiyor';

  await env.CANSU_ANALYTICS_DB.prepare(
    `CREATE TABLE IF NOT EXISTS geo_events (
      site TEXT NOT NULL,
      day TEXT NOT NULL,
      country TEXT NOT NULL,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (site, day, country, region, city)
    )`,
  ).run();

  await env.CANSU_ANALYTICS_DB.prepare(
    'INSERT INTO geo_events (site, day, country, region, city, views) VALUES (?, ?, ?, ?, ?, 1) ON CONFLICT(site, day, country, region, city) DO UPDATE SET views = views + 1',
  ).bind(site, day, country, region, city).run();
};

const periodSinceDay = (period: string): string => {
  const now = Date.now();
  if (period === 'today') return new Date(now).toISOString().slice(0, 10);
  if (period === '7d' || period === 'sevendays') return new Date(now - 6 * 86400000).toISOString().slice(0, 10);
  if (period === '30d' || period === 'thirtydays') return new Date(now - 29 * 86400000).toISOString().slice(0, 10);
  if (period === 'all' || period === '2027') return '2026-01-01';
  return new Date(now - 6 * 86400000).toISOString().slice(0, 10);
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (!env.CANSU_ANALYTICS_DB) return response({ ok: false, error: 'Analytics database is not configured' }, 503, origin);

  if (request.method === 'POST') {
    if (!allowedOrigin(origin)) return response({ ok: false, error: 'Origin not allowed' }, 403, origin);
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > 1024) return response({ ok: false, error: 'Payload too large' }, 413, origin);
      const body = JSON.parse(raw) as Record<string, unknown>;
      const site = clean(body.site, 40);
      if (!SITES.has(site)) return response({ ok: false, error: 'Unknown site' }, 400, origin);
      if (!origin || !SITE_ORIGINS[site]?.includes(origin)) {
        return response({ ok: false, error: 'Origin mismatch for site identifier' }, 403, origin);
      }
      const collectorVersion = clean(body.collector_version, 16);
      const day = new Date().toISOString().slice(0, 10);

      // Anonymous cookie-banner decision counter: zero cookies, zero IP, zero identity.
      if (collectorVersion === 'consent-v1') {
        const action = clean(body.action, 20).toLowerCase();
        if (!CONSENT_ACTIONS.has(action)) return response({ ok: false, error: 'Invalid consent action' }, 400, origin);
        await ensureConsentTable(env);
        await env.CANSU_ANALYTICS_DB.prepare(
          'INSERT INTO consent_actions_daily (site, day, action, count) VALUES (?, ?, ?, 1) ON CONFLICT(site, day, action) DO UPDATE SET count = count + 1'
        ).bind(site, day, action).run();
        return response({ ok: true, collector: 'consent-actions-v1', trackingUntil: TRACKING_UNTIL }, 202, origin);
      }

      const path = cleanPath(body.landing_path);

      // Persistent consent-free aggregate: no IP, user agent, referrer, session or visitor identifier is stored.
      if (collectorVersion === '5') {
        const cf = (request as RequestWithCf).cf;
        const userAgent = request.headers.get('user-agent') || '';
        const isBot = BOT_UA.test(userAgent) || cf?.botManagement?.verifiedBot === true || (typeof cf?.botManagement?.score === 'number' && cf.botManagement.score < 30) ? 1 : 0;
        if (retentionCleanupDay !== day) {
          retentionCleanupDay = day;
          const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
          await env.CANSU_ANALYTICS_DB.prepare('DELETE FROM privacy_pageviews_daily WHERE day < ?').bind(cutoff).run();
        }
        await env.CANSU_ANALYTICS_DB.prepare(
          'INSERT INTO privacy_pageviews_daily (site, day, path, is_bot, views) VALUES (?, ?, ?, ?, 1) ON CONFLICT(site, day, path, is_bot) DO UPDATE SET views = views + 1'
        ).bind(site, day, path, isBot).run();

        // Anonymous aggregate country bucket (no IP or personal identifier stored)
        const country = clean(cf?.country, 4).toUpperCase() || 'XX';
        try {
          await ensureCountryTable(env);
          await env.CANSU_ANALYTICS_DB.prepare(
            'INSERT INTO privacy_country_daily (site, day, country, is_bot, views) VALUES (?, ?, ?, ?, 1) ON CONFLICT(site, day, country, is_bot) DO UPDATE SET views = views + 1'
          ).bind(site, day, country, isBot).run();
        } catch {
          /* Best-effort country aggregate must not block primary pageview recording */
        }

        return response({ ok: true, collector: 'privacy-pageviews-v5', retentionDays: RETENTION_DAYS, trackingUntil: TRACKING_UNTIL }, 202, origin);
      }

      // Consent-free QCTONE aggregate: no session ID, identity, referrer, geo or UTM is stored.
      if (site === 'qctone' && collectorVersion === '4') {
        await env.CANSU_ANALYTICS_DB.prepare(
          `CREATE TABLE IF NOT EXISTS qctone_cookieless_daily (
            day TEXT NOT NULL,
            path TEXT NOT NULL,
            views INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (day, path)
          )`
        ).run();
        await env.CANSU_ANALYTICS_DB.prepare(
          'INSERT INTO qctone_cookieless_daily (day, path, views) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET views = views + 1'
        ).bind(day, path).run();
        return response({ ok: true, collector: 'qctone-anonymous-v4' }, 202, origin);
      }

      const source = sourceName(body);
      if (collectorVersion === '3') {
        const sessionId = clean(body.session_id, 80);
        if (!/^[a-zA-Z0-9_-]{12,80}$/.test(sessionId)) return response({ ok: false, error: 'Invalid session id' }, 400, origin);
        await ensureFirstPartyV2(env);
        const cf = (request as RequestWithCf).cf;
        const country = clean(cf?.country, 80) || 'Bilinmiyor';
        const region = clean(cf?.region, 120) || 'Bilinmiyor';
        const city = clean(cf?.city, 120) || 'Bilinmiyor';
        await env.CANSU_ANALYTICS_DB.prepare(
          `INSERT OR IGNORE INTO first_party_sessions_v2
           (site, session_id, occurred_at, day, source, landing_path, country, region, city)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(site, sessionId, new Date().toISOString(), day, source, path, country, region, city).run();
        return response({ ok: true, collector: 'v3' }, 202, origin);
      }

      await env.CANSU_ANALYTICS_DB.prepare(
        'INSERT INTO source_events (site, day, source, landing_path, views) VALUES (?, ?, ?, ?, 1) ON CONFLICT(site, day, source, landing_path) DO UPDATE SET views = views + 1',
      ).bind(site, day, source, path).run();
      await recordGeo(env, request, site, day);
      return response({ ok: true, collector: 'legacy' }, 202, origin);
    } catch {
      return response({ ok: false, error: 'Invalid analytics event' }, 400, origin);
    }
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'clean_test') return response({ ok: false, error: 'Maintenance action disabled' }, 405, origin);
    const eventSite = clean(url.searchParams.get('event_site'), 40);
    if (eventSite) {
      let refererOrigin = '';
      try { refererOrigin = new URL(request.headers.get('referer') || '').origin; } catch {}
      if (!allowedOrigin(refererOrigin)) return response({ ok: false, error: 'Legacy source origin not allowed' }, 403, origin);
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
      await recordGeo(env, request, eventSite, day);
      return response({ ok: true }, 202, origin);
    }

    const version = clean(url.searchParams.get('version'), 16).toLowerCase();
    const period = clean(url.searchParams.get('period'), 20).toLowerCase();

    // Unified lossless 6-site summary for Cansu Operations Center (through 2027-01-01)
    if (version === 'summary') {
      const requestedSite = clean(url.searchParams.get('site'), 40);
      if (requestedSite && !SITES.has(requestedSite)) return response({ ok: false, error: 'Unknown site' }, 400, origin);
      const activePeriod = ['today', '7d', '30d', 'all'].includes(period) ? period : '7d';
      const since = periodSinceDay(activePeriod);
      const todayDay = new Date().toISOString().slice(0, 10);

      await Promise.all([ensureConsentTable(env), ensureCountryTable(env)]).catch(() => {});

      const siteFilterSql = requestedSite ? ' AND site = ?' : '';
      const bindBase = requestedSite ? [since, requestedSite] : [since];

      const [siteTotalsRes, allTimeTotalsRes, consentRes, dailyPvRes, dailyConsentRes, pathsRes, countriesRes] = await Promise.all([
        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT site,
                  SUM(CASE WHEN is_bot = 0 THEN views ELSE 0 END) AS human_views,
                  SUM(CASE WHEN is_bot = 1 THEN views ELSE 0 END) AS bot_views,
                  SUM(CASE WHEN day = ? AND is_bot = 0 THEN views ELSE 0 END) AS today_human,
                  SUM(CASE WHEN day = ? AND is_bot = 1 THEN views ELSE 0 END) AS today_bot,
                  MIN(day) AS first_day,
                  MAX(day) AS last_day
           FROM privacy_pageviews_daily
           WHERE day >= ?${siteFilterSql}
           GROUP BY site`
        ).bind(todayDay, todayDay, ...bindBase).all<{ site: string; human_views: number; bot_views: number; today_human: number; today_bot: number; first_day: string; last_day: string }>(),

        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT site,
                  SUM(CASE WHEN is_bot = 0 THEN views ELSE 0 END) AS human_views,
                  SUM(CASE WHEN is_bot = 1 THEN views ELSE 0 END) AS bot_views
           FROM privacy_pageviews_daily
           WHERE day >= '2026-01-01' AND day <= '${TRACKING_UNTIL}'${siteFilterSql}
           GROUP BY site`
        ).bind(...(requestedSite ? [requestedSite] : [])).all<{ site: string; human_views: number; bot_views: number }>(),

        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT site, action, SUM(count) AS total
           FROM consent_actions_daily
           WHERE day >= ?${siteFilterSql}
           GROUP BY site, action`
        ).bind(...bindBase).all<{ site: string; action: string; total: number }>().catch(() => ({ results: [] })),

        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT day,
                  SUM(CASE WHEN is_bot = 0 THEN views ELSE 0 END) AS human_views,
                  SUM(CASE WHEN is_bot = 1 THEN views ELSE 0 END) AS bot_views
           FROM privacy_pageviews_daily
           WHERE day >= ?${siteFilterSql}
           GROUP BY day
           ORDER BY day ASC`
        ).bind(...bindBase).all<{ day: string; human_views: number; bot_views: number }>(),

        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT day, action, SUM(count) AS total
           FROM consent_actions_daily
           WHERE day >= ?${siteFilterSql}
           GROUP BY day, action
           ORDER BY day ASC`
        ).bind(...bindBase).all<{ day: string; action: string; total: number }>().catch(() => ({ results: [] })),

        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT path,
                  SUM(CASE WHEN is_bot = 0 THEN views ELSE 0 END) AS human_views,
                  SUM(CASE WHEN is_bot = 1 THEN views ELSE 0 END) AS bot_views
           FROM privacy_pageviews_daily
           WHERE day >= ?${siteFilterSql}
           GROUP BY path
           ORDER BY human_views DESC, bot_views DESC
           LIMIT 12`
        ).bind(...bindBase).all<{ path: string; human_views: number; bot_views: number }>(),

        env.CANSU_ANALYTICS_DB.prepare(
          `SELECT country,
                  SUM(CASE WHEN is_bot = 0 THEN views ELSE 0 END) AS human_views,
                  SUM(CASE WHEN is_bot = 1 THEN views ELSE 0 END) AS bot_views
           FROM privacy_country_daily
           WHERE day >= ?${siteFilterSql}
           GROUP BY country
           ORDER BY human_views DESC, bot_views DESC
           LIMIT 12`
        ).bind(...bindBase).all<{ country: string; human_views: number; bot_views: number }>().catch(() => ({ results: [] })),
      ]);

      const siteMap = new Map((siteTotalsRes.results || []).map((r) => [r.site, r]));
      const allTimeMap = new Map((allTimeTotalsRes.results || []).map((r) => [r.site, r]));
      const consentMap = new Map<string, { banner_shown: number; accept: number; reject: number; dismiss: number; ignored: number }>();
      for (const s of SITE_ORDER) consentMap.set(s, { banner_shown: 0, accept: 0, reject: 0, dismiss: 0, ignored: 0 });
      for (const row of consentRes.results || []) {
        const bucket = consentMap.get(row.site);
        if (bucket && row.action in bucket) {
          (bucket as Record<string, number>)[row.action] = Number(row.total || 0);
        }
      }

      const targetSites = requestedSite ? [requestedSite] : [...SITE_ORDER];
      const sites = targetSites.map((key) => {
        const r = siteMap.get(key);
        const allR = allTimeMap.get(key);
        const c = consentMap.get(key) || { banner_shown: 0, accept: 0, reject: 0, dismiss: 0, ignored: 0 };
        const humanViews = Number(r?.human_views || 0);
        const botViews = Number(r?.bot_views || 0);
        const decided = c.accept + c.reject + c.dismiss;
        return {
          key,
          name: SITE_LABELS[key] || key,
          humanViews,
          botViews,
          totalViews: humanViews + botViews,
          todayHuman: Number(r?.today_human || 0),
          todayBot: Number(r?.today_bot || 0),
          allTimeHuman: Number(allR?.human_views || 0),
          allTimeBot: Number(allR?.bot_views || 0),
          firstDay: r?.first_day || null,
          lastDay: r?.last_day || null,
          consent: {
            ...c,
            decided,
            acceptRate: decided > 0 ? Number(((c.accept / decided) * 100).toFixed(1)) : null,
            rejectRate: decided > 0 ? Number(((c.reject / decided) * 100).toFixed(1)) : null,
          },
        };
      });

      const totals = sites.reduce((acc, s) => {
        acc.humanViews += s.humanViews;
        acc.botViews += s.botViews;
        acc.totalViews += s.totalViews;
        acc.allTimeHuman += s.allTimeHuman;
        acc.allTimeBot += s.allTimeBot;
        acc.consent.banner_shown += s.consent.banner_shown;
        acc.consent.accept += s.consent.accept;
        acc.consent.reject += s.consent.reject;
        acc.consent.dismiss += s.consent.dismiss;
        acc.consent.ignored += s.consent.ignored;
        return acc;
      }, {
        humanViews: 0,
        botViews: 0,
        totalViews: 0,
        allTimeHuman: 0,
        allTimeBot: 0,
        consent: { banner_shown: 0, accept: 0, reject: 0, dismiss: 0, ignored: 0 },
      });
      const totalDecided = totals.consent.accept + totals.consent.reject + totals.consent.dismiss;

      const dailyConsentByDay = new Map<string, { accept: number; reject: number; dismiss: number; ignored: number }>();
      for (const row of dailyConsentRes.results || []) {
        const cur = dailyConsentByDay.get(row.day) || { accept: 0, reject: 0, dismiss: 0, ignored: 0 };
        if (row.action in cur) (cur as Record<string, number>)[row.action] = Number(row.total || 0);
        dailyConsentByDay.set(row.day, cur);
      }
      const dailySeries = (dailyPvRes.results || []).map((row) => {
        const dc = dailyConsentByDay.get(row.day) || { accept: 0, reject: 0, dismiss: 0, ignored: 0 };
        return {
          day: row.day,
          humanViews: Number(row.human_views || 0),
          botViews: Number(row.bot_views || 0),
          ...dc,
        };
      });

      return response({
        ok: true,
        collector: 'lossless-summary-v5',
        period: activePeriod,
        since,
        trackingUntil: TRACKING_UNTIL,
        retentionDays: RETENTION_DAYS,
        generatedAt: new Date().toISOString(),
        totals: {
          ...totals,
          consent: {
            ...totals.consent,
            decided: totalDecided,
            acceptRate: totalDecided > 0 ? Number(((totals.consent.accept / totalDecided) * 100).toFixed(1)) : null,
            rejectRate: totalDecided > 0 ? Number(((totals.consent.reject / totalDecided) * 100).toFixed(1)) : null,
          },
        },
        sites,
        dailySeries,
        topPaths: (pathsRes.results || []).map((r) => ({
          path: r.path,
          humanViews: Number(r.human_views || 0),
          botViews: Number(r.bot_views || 0),
        })),
        topCountries: (countriesRes.results || []).map((r) => ({
          country: r.country,
          humanViews: Number(r.human_views || 0),
          botViews: Number(r.bot_views || 0),
        })),
      }, 200, origin);
    }

    const site = clean(url.searchParams.get('site'), 40);
    if (!SITES.has(site)) return response({ ok: false, error: 'Unknown site' }, 400, origin);

    if (version === 'anonymous') {
      const since = period === 'today'
        ? new Date().toISOString().slice(0, 10)
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const totals = await env.CANSU_ANALYTICS_DB.prepare(
        'SELECT SUM(views) AS views, SUM(CASE WHEN is_bot = 1 THEN views ELSE 0 END) AS bot_views FROM privacy_pageviews_daily WHERE site = ? AND day >= ?'
      ).bind(site, since).first<{ views: number | null; bot_views: number | null }>();
      return response({ ok: true, site, collector: 'anonymous-pageviews-v5', period: period === 'today' ? 'today' : 'rolling-day-buckets', retentionDays: RETENTION_DAYS, pageviews: Number(totals?.views || 0), botPageviews: Number(totals?.bot_views || 0), uniqueVisitors: null, sessions: null }, 200, origin);
    }

    if (version === 'v2') {
      await ensureFirstPartyV2(env);
      const since = period === 'today'
        ? new Date().toISOString().slice(0, 10)
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const result = await env.CANSU_ANALYTICS_DB.prepare(
        'SELECT source, COUNT(*) AS views FROM first_party_sessions_v2 WHERE site = ? AND day >= ? GROUP BY source ORDER BY views DESC LIMIT 12'
      ).bind(site, since).all<{ source: string; views: number }>();
      return response({ ok: true, collector: 'v2-clean', site, period: period === 'today' ? 'today' : 'rolling-day-buckets', since, sources: result.results ?? [] }, 200, origin);
    }
    const since = period === 'today'
      ? new Date().toISOString().slice(0, 10)
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = await env.CANSU_ANALYTICS_DB.prepare(
      'SELECT source, SUM(views) AS views FROM source_events WHERE site = ? AND day >= ? GROUP BY source ORDER BY views DESC LIMIT 12',
    ).bind(site, since).all<{ source: string; views: number }>();
    return response({ ok: true, site, period: period === 'today' ? 'today' : 'rolling-day-buckets', since, sources: result.results ?? [] }, 200, origin);
  }

  return response({ ok: false, error: 'Method not allowed' }, 405, origin);
};
