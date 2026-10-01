interface Env {
  UMAMI_BASE_URL?: string;
  UMAMI_API_KEY?: string;
}

const HOSTS: Record<string, string> = {
  teyfikgokdemir: 'teyfikgokdemir.com',
  ctseg: 'ctseg.com.tr',
  mythborn: 'mythborn.co',
  'qct-studio': 'qctstudio.com',
  'qct-commerce-tr': 'qctcommerce.com',
  'olivon-agency': 'olivon.com.tr',
};

const ORIGINS = new Set([
  'https://teyfikgokdemir.com',
  'https://ctseg.com.tr',
  'https://mythborn.co',
  'https://qctstudio.com',
  'https://qctcommerce.com',
  'https://olivon.com.tr',
]);

const cleanBase = (value: string) => value.trim().replace(/\/+$/, '');
const cors = (origin: string | null) => ({
  'access-control-allow-origin': origin && ORIGINS.has(origin) ? origin : 'null',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'origin',
});

const respond = (body: unknown, status: number, origin: string | null, cache = 'public, max-age=300') =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
    },
  });

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== 'GET') return respond({ ok: false }, 405, origin, 'no-store');

  const url = new URL(request.url);
  const site = (url.searchParams.get('site') || '').trim();
  const host = HOSTS[site];
  if (!host) return respond({ ok: false, enabled: false, reason: 'unknown-site' }, 400, origin);

  const base = env.UMAMI_BASE_URL ? cleanBase(env.UMAMI_BASE_URL) : '';
  const apiKey = env.UMAMI_API_KEY?.trim() || '';
  if (!base || !apiKey) return respond({ ok: true, enabled: false, reason: 'not-configured' }, 200, origin);

  try {
    const response = await fetch(`${base}/api/websites`, {
      headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
      cf: { cacheTtl: 600, cacheEverything: false },
    });
    if (!response.ok) return respond({ ok: false, enabled: false, reason: `umami-${response.status}` }, 502, origin, 'no-store');

    const payload = await response.json() as unknown;
    const websites = Array.isArray(payload)
      ? payload as Array<Record<string, unknown>>
      : (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)
        ? (payload as { data: Array<Record<string, unknown>> }).data
        : []);

    const website = websites.find((row) => String(row.domain ?? '').toLowerCase().replace(/^www\./, '') === host);
    const websiteId = website ? String(website.id ?? '') : '';
    if (!websiteId) return respond({ ok: true, enabled: false, reason: 'website-not-created' }, 200, origin);

    return respond({
      ok: true,
      enabled: true,
      websiteId,
      scriptUrl: `${base}/script.js`,
      hostUrl: base,
      domain: host,
      performance: true,
    }, 200, origin, 'public, max-age=900');
  } catch {
    return respond({ ok: false, enabled: false, reason: 'network' }, 502, origin, 'no-store');
  }
};
