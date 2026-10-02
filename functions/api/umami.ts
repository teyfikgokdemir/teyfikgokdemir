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

async function getWebsites(base: string, apiKey: string) {
  const response = await fetch(apiUrl(base, 'websites'), {
    headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
    cf: { cacheTtl: 300, cacheEverything: false },
  });
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
  const response = await fetch(url.toString(), {
    headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
    cf: { cacheTtl: days === 1 ? 120 : 600, cacheEverything: false },
  });
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

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const base = env.UMAMI_BASE_URL ? cleanBase(env.UMAMI_BASE_URL) : '';
  const apiKey = env.UMAMI_API_KEY?.trim() || '';

  if (!base || !apiKey) {
    return json({
      ok: true,
      configured: false,
      source: 'Umami',
      message: 'UMAMI_BASE_URL / UMAMI_API_KEY bekleniyor',
      sites: PORTFOLIO.map((site) => ({ ...site, connected: false })),
    });
  }

  try {
    const websites = await getWebsites(base, apiKey);
    const sites = await Promise.all(PORTFOLIO.map(async (site) => {
      const website = findWebsite(websites, site.host);
      if (!website) return { ...site, connected: false, reason: 'Umami website kaydı bulunamadı' };
      const websiteId = String(website.id ?? '');
      if (!websiteId) return { ...site, connected: false, reason: 'Umami website ID bulunamadı' };
      try {
        const [oneDay, sevenDays, thirtyDays] = await Promise.all([
          getStats(base, apiKey, websiteId, 1),
          getStats(base, apiKey, websiteId, 7),
          getStats(base, apiKey, websiteId, 30),
        ]);
        return {
          ...site,
          connected: true,
          websiteId,
          umamiName: String(website.name ?? site.name),
          domain: String(website.domain ?? site.host),
          periods: { oneDay, sevenDays, thirtyDays },
        };
      } catch (error) {
        return {
          ...site,
          connected: false,
          websiteId,
          reason: error instanceof Error ? error.message : 'Umami stats alınamadı',
        };
      }
    }));

    return json({
      ok: true,
      configured: true,
      generatedAt: new Date().toISOString(),
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
      error: error instanceof Error ? error.message : 'Umami API erişilemedi',
    }, 502);
  }
};
