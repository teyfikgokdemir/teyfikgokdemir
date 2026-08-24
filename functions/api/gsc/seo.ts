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
];

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

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

function topRows(rows: SearchRow[], type: 'query' | 'page') {
  return rows.slice(0, 10).map((row) => ({
    value: row.keys?.[0] || (type === 'query' ? 'Bilinmeyen sorgu' : 'Bilinmeyen sayfa'),
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET || !env.CANSU_GSC_TOKENS) return json({ ok: false, connected: false, error: 'Search Console OAuth yapılandırması eksik' }, 503);
  const refreshToken = await env.CANSU_GSC_TOKENS.get('gsc_refresh_token');
  if (!refreshToken) return json({ ok: true, connected: false, error: 'Search Console henüz yetkilendirilmedi' });
  try {
    const token = await accessToken(env, refreshToken);
    const endDate = isoDate(3);
    const periods = { sevenDays: { startDate: isoDate(9), endDate }, thirtyDays: { startDate: isoDate(32), endDate } };
    const sites = await Promise.all(properties.map(async (property) => {
      try {
        const [sevenSummaryRows, thirtySummaryRows, queries, pages] = await Promise.all([
          queryProperty(property, token, periods.sevenDays.startDate, periods.sevenDays.endDate, []),
          queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, []),
          queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, ['query']),
          queryProperty(property, token, periods.thirtyDays.startDate, periods.thirtyDays.endDate, ['page']),
        ]);
        return { ...property, ok: true, periods: { sevenDays: summary(sevenSummaryRows), thirtyDays: summary(thirtySummaryRows) }, topQueries: topRows(queries, 'query'), topPages: topRows(pages, 'page') };
      } catch (error) {
        return { ...property, ok: false, error: error instanceof Error ? error.message : 'Search Console verisi alınamadı' };
      }
    }));
    return json({ ok: true, connected: true, generatedAt: new Date().toISOString(), dataThrough: endDate, sites });
  } catch (error) {
    return json({ ok: false, connected: false, error: error instanceof Error ? error.message : 'Search Console erişilemedi' }, 502);
  }
};
