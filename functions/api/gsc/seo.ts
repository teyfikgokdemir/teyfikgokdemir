interface Env {
  GSC_CLIENT_ID?: string;
  GSC_CLIENT_SECRET?: string;
  CANSU_GSC_TOKENS?: KVNamespace;
}

type SearchRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
type PropertyConfig = { key: string; name: string; property: string };

const properties: PropertyConfig[] = [
  { key: 'teyfikgokdemir', name: 'teyfikgokdemir', property: 'sc-domain:teyfikgokdemir.com' },
  { key: 'ctseg', name: 'ctseg', property: 'sc-domain:ctseg.com.tr' },
  { key: 'mythborn', name: 'mythborn', property: 'sc-domain:mythborn.co' },
  { key: 'qct-studio', name: 'qct-studio', property: 'sc-domain:qctstudio.com' },
  { key: 'qct-commerce-tr', name: 'qct-commerce-tr', property: 'sc-domain:qctcommerce.com' },
  { key: 'olivon-agency', name: 'olivon-agency', property: 'sc-domain:olivon.com.tr' },
];

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
});

function sameOriginBrowser(request: Request) {
  const url = new URL(request.url);
  const secFetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (secFetchSite && !['same-origin', 'none'].includes(secFetchSite)) return false;
  if (origin && origin !== url.origin) return false;
  if (referer) {
    try { if (new URL(referer).origin !== url.origin) return false; } catch { return false; }
  }
  return true;
}

function isoDate(daysAgo: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function accessToken(env: Env, refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GSC_CLIENT_ID || '', client_secret: env.GSC_CLIENT_SECRET || '', refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const payload = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || `Google token ${response.status}`);
  return payload.access_token;
}

async function queryProperty(property: PropertyConfig, token: string, startDate: string, endDate: string, dimensions: string[]) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property.property)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25_000, dataState: 'final' }),
  });
  const payload = await response.json() as { rows?: SearchRow[]; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `Search Console ${response.status}`);
  return payload.rows || [];
}

function summary(rows: SearchRow[]) {
  const clicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const ctr = impressions ? clicks / impressions : 0;
  const positionWeight = rows.reduce((sum, row) => sum + (row.position || 0) * (row.impressions || 0), 0);
  return { clicks, impressions, ctr, position: impressions ? positionWeight / impressions : 0 };
}


function opportunityRows(rows: SearchRow[]) {
  return rows
    .filter((row) => {
      const impressions = row.impressions || 0;
      const position = row.position || 0;
      return impressions >= 10 && position >= 4 && position <= 20 && Boolean(row.keys?.[0]);
    })
    .map((row) => {
      const impressions = row.impressions || 0;
      const position = row.position || 0;
      const ctr = row.ctr || 0;
      const opportunityScore = impressions * Math.max(1, 21 - position) * Math.max(0.2, 1 - ctr);
      return {
        value: row.keys?.[0] || 'Bilinmeyen sorgu',
        clicks: row.clicks || 0,
        impressions,
        ctr,
        position,
        opportunityScore,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10);
}

function topRows(rows: SearchRow[], type: 'query' | 'page') {
  const sorted = [...rows].sort((a, b) => {
    const clickDiff = (b.clicks || 0) - (a.clicks || 0);
    if (clickDiff !== 0) return clickDiff;
    const impDiff = (b.impressions || 0) - (a.impressions || 0);
    if (impDiff !== 0) return impDiff;
    const ctrDiff = (b.ctr || 0) - (a.ctr || 0);
    if (ctrDiff !== 0) return ctrDiff;
    const posA = a.position || 999;
    const posB = b.position || 999;
    return posA - posB;
  });
  return sorted.slice(0, 10).map((row) => ({
    value: row.keys?.[0] || (type === 'query' ? 'Bilinmeyen sorgu' : 'Bilinmeyen sayfa'),
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}


function glassSeoInsights(rows: SearchRow[]) {
  const glassRows = rows.filter((row) => {
    const page = String(row.keys?.[1] || '');
    try {
      const pathname = new URL(page).pathname;
      return /\/(?:[a-z]{2}\/)?glass\//i.test(pathname);
    } catch {
      return /\/glass\//i.test(page);
    }
  });

  const byQuery = new Map<string, {
    clicks:number; impressions:number; positionWeight:number;
    pages: Map<string,{clicks:number;impressions:number;positionWeight:number}>;
  }>();
  const byPage = new Map<string,{clicks:number;impressions:number;positionWeight:number}>();

  for (const row of glassRows) {
    const query = String(row.keys?.[0] || '').trim();
    const page = String(row.keys?.[1] || '').trim();
    if (!query || !page) continue;
    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const position = row.position || 0;

    const q = byQuery.get(query) || { clicks:0, impressions:0, positionWeight:0, pages:new Map() };
    q.clicks += clicks;
    q.impressions += impressions;
    q.positionWeight += position * impressions;
    const qp = q.pages.get(page) || { clicks:0, impressions:0, positionWeight:0 };
    qp.clicks += clicks;
    qp.impressions += impressions;
    qp.positionWeight += position * impressions;
    q.pages.set(page, qp);
    byQuery.set(query, q);

    const p = byPage.get(page) || { clicks:0, impressions:0, positionWeight:0 };
    p.clicks += clicks;
    p.impressions += impressions;
    p.positionWeight += position * impressions;
    byPage.set(page, p);
  }

  const queries = [...byQuery.entries()].map(([query, value]) => {
    const position = value.impressions ? value.positionWeight / value.impressions : 0;
    const ctr = value.impressions ? value.clicks / value.impressions : 0;
    const pages = [...value.pages.entries()]
      .map(([page, stats]) => ({
        page,
        clicks: stats.clicks,
        impressions: stats.impressions,
        position: stats.impressions ? stats.positionWeight / stats.impressions : 0,
      }))
      .sort((a,b) => b.impressions - a.impressions);
    return { query, clicks:value.clicks, impressions:value.impressions, ctr, position, pages };
  });

  const opportunities = queries
    .filter((row) => row.impressions >= 5 && row.position >= 4 && row.position <= 30)
    .map((row) => ({
      ...row,
      score: row.impressions * Math.max(1, 31 - row.position) * Math.max(.2, 1 - row.ctr),
      page: row.pages[0]?.page || '',
    }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 15);

  const lowCtr = queries
    .filter((row) => row.impressions >= 10 && row.position > 0 && row.position <= 10 && row.ctr < .04)
    .map((row) => ({ ...row, page: row.pages[0]?.page || '' }))
    .sort((a,b) => b.impressions - a.impressions)
    .slice(0, 10);

  const cannibalization = queries
    .filter((row) => row.impressions >= 5 && row.pages.filter((page) => page.impressions > 0).length >= 2)
    .map((row) => ({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
      pages: row.pages.slice(0, 4),
    }))
    .sort((a,b) => b.impressions - a.impressions)
    .slice(0, 10);

  const topPages = [...byPage.entries()]
    .map(([page, value]) => ({
      page,
      clicks:value.clicks,
      impressions:value.impressions,
      ctr:value.impressions ? value.clicks / value.impressions : 0,
      position:value.impressions ? value.positionWeight / value.impressions : 0,
    }))
    .sort((a,b) => b.impressions - a.impressions)
    .slice(0, 15);

  return { rows: glassRows.length, opportunities, lowCtr, cannibalization, topPages };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!sameOriginBrowser(request)) return new Response('Forbidden', { status: 403, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
  if (!env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET || !env.CANSU_GSC_TOKENS) return json({ ok: false, connected: false, error: 'Search Console OAuth yapılandırması eksik' }, 503);
  const refreshToken = await env.CANSU_GSC_TOKENS.get('gsc_refresh_token');
  if (!refreshToken) return json({ ok: true, connected: false, error: 'Search Console henüz yetkilendirilmedi' });
  try {
    const token = await accessToken(env, refreshToken);
    const endDate = isoDate(3);
    const periods = { sevenDays: { startDate: isoDate(9), endDate }, thirtyDays: { startDate: isoDate(32), endDate } };
    const sites = await Promise.all(properties.map(async (property) => {
      try {
        const [sevenSummaryRows, thirtySummaryRows, queries, pages, queryPages] = await Promise.all([
          queryProperty(property, token, periods.sevenDays.startDate, periods.sevenDays.endDate, []),
          queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, []),
          queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, ['query']),
          queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, ['page']),
          property.key === 'ctseg'
            ? queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, ['query','page'])
            : Promise.resolve([] as SearchRow[]),
        ]);
        return {
          ...property,
          ok: true,
          periods: { sevenDays: summary(sevenSummaryRows), thirtyDays: summary(thirtySummaryRows) },
          topQueries: topRows(queries, 'query'),
          topPages: topRows(pages, 'page'),
          opportunities: opportunityRows(queries),
          ...(property.key === 'ctseg' ? { glassSeo: glassSeoInsights(queryPages) } : {}),
        };
      } catch (error) {
        return { ...property, ok: false, error: error instanceof Error ? error.message : 'Search Console verisi alınamadı' };
      }
    }));
    return json({ ok: true, connected: true, generatedAt: new Date().toISOString(), dataThrough: endDate, sites }, 200);
  } catch (error) {
    return json({ ok: false, connected: false, error: error instanceof Error ? error.message : 'Search Console erişilemedi' }, 200);
  }
};
