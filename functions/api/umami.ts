interface Env {
  UMAMI_BASE_URL?: string;
  UMAMI_API_KEY?: string;
}

type PortfolioSite = { key: string; host: string; name: string };

const PORTFOLIO: PortfolioSite[] = [
  { key: 'teyfikgokdemir', host: 'teyfikgokdemir.com', name: 'teyfikgokdemir' },
  { key: 'ctseg', host: 'ctseg.com.tr', name: 'ctseg' },
  { key: 'mythborn', host: 'mythborn.co', name: 'mythborn' },
  { key: 'qct-studio', host: 'qctstudio.com', name: 'qct-studio' },
  { key: 'qct-commerce-tr', host: 'qctcommerce.com', name: 'qct-commerce-tr' },
  { key: 'olivon-agency', host: 'olivon.com.tr', name: 'olivon-agency' },
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

const cleanBase = (value: string) => value.trim().replace(/\/+$/, '');

const apiBase = (value: string) => {
  const base = cleanBase(value);
  if (/api\.umami\.is\/v1(?:\/|$)/i.test(base)) return base;
  if (/api\.umami\.is$/i.test(base)) return `${base}/v1`;
  if (/cloud\.umami\.is$/i.test(base)) return 'https://api.umami.is/v1';
  return `${base}/api`;
};

const apiUrl = (base: string, path: string) => `${apiBase(base)}/${path.replace(/^\/+/, '')}`;

const metricValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'value' in value) {
    const nested = Number((value as { value?: unknown }).value ?? 0);
    return Number.isFinite(nested) ? nested : 0;
  }
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const dateRange = (days: number) => {
  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  return { startAt, endAt };
};

const FETCH_TIMEOUT_MS = 12000;

// One controlled retry for transient failures (cold start, 5xx, network/timeout).
async function umamiFetch(url: string, apiKey: string, cacheTtl: number, label: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
        cf: { cacheTtl, cacheEverything: false },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (response.status >= 500 && attempt === 0) { lastError = new Error(`${label} HTTP ${response.status}`); continue; }
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  const timedOut = lastError instanceof Error && (lastError.name === 'TimeoutError' || lastError.name === 'AbortError');
  throw new Error(timedOut ? `${label} zaman aÅŸÄ±mÄ± (${FETCH_TIMEOUT_MS / 1000}s)` : `${label} eriÅŸilemedi`);
}

const LAST_OK_KEY = 'https://cansu.internal/umami-last-success';

async function readLastSuccess(): Promise<Record<string, string>> {
  try {
    const hit = await caches.default.match(LAST_OK_KEY);
    return hit ? await hit.json() as Record<string, string> : {};
  } catch { return {}; }
}

async function writeLastSuccess(map: Record<string, string>) {
  try {
    await caches.default.put(LAST_OK_KEY, new Response(JSON.stringify(map), {
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=2592000' },
    }));
  } catch { /* cache is best-effort */ }
}

async function getWebsites(base: string, apiKey: string) {
  const response = await umamiFetch(apiUrl(base, 'websites'), apiKey, 300, 'Umami websites');
  if (!response.ok) throw new Error(`Umami websites HTTP ${response.status}`);
  const payload = await response.json() as unknown;
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: Array<Record<string, unknown>> }).data;
  }
  return [];
}

const findWebsite = (rows: Array<Record<string, unknown>>, host: string) => rows.find((row) => {
  const domain = String(row.domain ?? row.hostname ?? '').toLowerCase().replace(/^www\./, '');
  return domain === host || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`);
});

async function getStats(base: string, apiKey: string, websiteId: string, days: number) {
  const { startAt, endAt } = dateRange(days);
  const url = new URL(apiUrl(base, `websites/${websiteId}/stats`));
  url.searchParams.set('startAt', String(startAt));
  url.searchParams.set('endAt', String(endAt));
  const response = await umamiFetch(url.toString(), apiKey, days === 1 ? 120 : 600, 'Umami stats');
  if (!response.ok) throw new Error(`Umami stats HTTP ${response.status}`);
  const stats = await response.json() as Record<string, unknown>;
  return {
    pageviews: metricValue(stats.pageviews),
    visitors: metricValue(stats.visitors),
    visits: metricValue(stats.visits),
    bounces: metricValue(stats.bounces),
    totaltime: metricValue(stats.totaltime),
  };
}

type Health = 'healthy' | 'degraded' | 'unavailable';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const startedAt = Date.now();
  const base = env.UMAMI_BASE_URL ? cleanBase(env.UMAMI_BASE_URL) : '';
  const apiKey = env.UMAMI_API_KEY?.trim() || '';

  if (!base || !apiKey) {
    return json({
      ok: true,
      configured: false,
      source: 'Umami',
      message: 'Umami environment eksik',
      missing: [!base ? 'UMAMI_BASE_URL' : '', !apiKey ? 'UMAMI_API_KEY' : ''].filter(Boolean),
      generatedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      websiteCount: PORTFOLIO.length,
      connectedCount: 0,
      health: 'unavailable' satisfies Health,
      sites: PORTFOLIO.map((site) => ({
        ...site,
        connected: false,
        websiteId: null,
        domain: site.host,
        lastSuccessfulFetch: null,
        latencyMs: null,
        reason: 'Umami environment eksik',
      })),
    });
  }

  const lastSuccess = await readLastSuccess();

  try {
    const websites = await getWebsites(base, apiKey);
    const sites = await Promise.all(PORTFOLIO.map(async (site) => {
      const siteStart = Date.now();
      const website = findWebsite(websites, site.host);
      const common = { ...site, domain: site.host, lastSuccessfulFetch: lastSuccess[site.key] || null };
      if (!website) return { ...common, connected: false, websiteId: null, latencyMs: Date.now() - siteStart, reason: 'Umami website kaydÄ± bulunamadÄ±' };
      const websiteId = String(website.id ?? '');
      if (!websiteId) return { ...common, connected: false, websiteId: null, latencyMs: Date.now() - siteStart, reason: 'Umami website ID bulunamadÄ±' };
      try {
        const [oneDay, sevenDays, thirtyDays] = await Promise.all([
          getStats(base, apiKey, websiteId, 1),
          getStats(base, apiKey, websiteId, 7),
          getStats(base, apiKey, websiteId, 30),
        ]);
        const fetchedAt = new Date().toISOString();
        lastSuccess[site.key] = fetchedAt;
        return {
          ...site,
          connected: true,
          websiteId,
          umamiName: String(website.name ?? site.name),
          domain: String(website.domain ?? site.host),
          lastSuccessfulFetch: fetchedAt,
          latencyMs: Date.now() - siteStart,
          reason: null,
          periods: { oneDay, sevenDays, thirtyDays },
        };
      } catch (error) {
        return {
          ...common,
          connected: false,
          websiteId,
          domain: String(website.domain ?? site.host),
          latencyMs: Date.now() - siteStart,
          reason: error instanceof Error ? error.message : 'Umami stats alÄ±namadÄ±',
        };
      }
    }));

    const connectedCount = sites.filter((site) => site.connected).length;
    const health: Health = connectedCount === sites.length ? 'healthy' : connectedCount > 0 ? 'degraded' : 'unavailable';
    if (connectedCount > 0) await writeLastSuccess(lastSuccess);

    return json({
      ok: true,
      configured: true,
      generatedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      websiteCount: sites.length,
      connectedCount,
      health,
      source: 'Umami API',
      baseUrl: base,
      apiBaseUrl: apiBase(base),
      sites,
    });
  } catch (error) {
    return json({
      ok: false,
      configured: true,
      source: 'Umami API',
      generatedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      websiteCount: PORTFOLIO.length,
      connectedCount: 0,
      health: 'unavailable' satisfies Health,
      error: error instanceof Error ? error.message : 'Umami API eriÅŸilemedi',
      sites: PORTFOLIO.map((site) => ({
        ...site,
        connected: false,
        websiteId: null,
        domain: site.host,
        lastSuccessfulFetch: lastSuccess[site.key] || null,
        latencyMs: null,
        reason: error instanceof Error ? error.message : 'Umami API eriÅŸilemedi',
      })),
    }, 502);
  }
};
