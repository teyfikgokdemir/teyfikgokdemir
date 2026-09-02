interface Env {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  GITHUB_TOKEN?: string;
  CANSU_ANALYTICS_DB?: D1Database;
}

type Site = {
  key: string;
  name: string;
  url: string;
  repo: string;
  actions: string;
  zoneTag?: string;
};

const sites: Site[] = [
  { key: 'teyfikgokdemir', name: 'teyfikgokdemir', url: 'https://teyfikgokdemir.com/', repo: 'teyfikgokdemir', actions: 'https://github.com/teyfikgokdemir/teyfikgokdemir/actions', zoneTag: 'db88586009be5a14e565581ef22e23ed' },
  { key: 'ctseg', name: 'ctseg', url: 'https://ctseg.com.tr/', repo: 'ctseg', actions: 'https://github.com/teyfikgokdemir/ctseg/actions', zoneTag: '0b834d9e86bbda2d06ecbc19ca17ef12' },
  { key: 'mythborn', name: 'mythborn', url: 'https://mythborn.co/', repo: 'mythborn', actions: 'https://github.com/teyfikgokdemir/mythborn/actions', zoneTag: '34c09ccff54518baf27771540dc7801a' },
  { key: 'qct-studio', name: 'qct-studio', url: 'https://qctstudio.com/', repo: 'qct-studio', actions: 'https://github.com/teyfikgokdemir/qct-studio/actions', zoneTag: '44ba26775a815ed1d94f1655e8b830dd' },
  { key: 'qct-commerce-tr', name: 'qct-commerce-tr', url: 'https://qctcommerce.com/', repo: 'qct-commerce-tr', actions: 'https://github.com/teyfikgokdemir/qct-commerce-tr/actions', zoneTag: '851672489bf8dd324e518cf18d3af4c6' },
  { key: 'iran-ahli', name: 'iran-ahli', url: 'https://atelierpersia.com/', repo: 'iran-ahli', actions: 'https://github.com/teyfikgokdemir/iran-ahli/actions' },
];

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function checkSite(site: Site) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(site.url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);
    const isHttps = site.url.startsWith('https://');
    return {
      ok: response.ok,
      status: response.status,
      ms: Date.now() - started,
      checkedAt: new Date().toISOString(),
      ssl: { valid: isHttps && response.ok, protocol: isHttps ? 'https' : 'http' },
    };
  } catch (error) {
    clearTimeout(timer);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      checkedAt: new Date().toISOString(),
      ssl: { valid: false, protocol: site.url.startsWith('https://') ? 'https' : 'http', error: isTimeout ? 'Zaman aşımı (15s)' : 'Bağlantı hatası' },
    };
  }
}

async function githubRun(repo: string, env: Env) {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'cansu-dashboard',
    ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const [runsResponse, commitsResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/teyfikgokdemir/${repo}/actions/runs?per_page=10`, { headers, signal: controller.signal }),
      fetch(`https://api.github.com/repos/teyfikgokdemir/${repo}/commits?per_page=1`, { headers, signal: controller.signal }),
    ]);
    clearTimeout(timer);
    if (!runsResponse.ok) {
      if (runsResponse.status === 401 || runsResponse.status === 403) return { ok: false, error: 'GitHub authentication failed', errorType: 'authentication' as const, status: runsResponse.status };
      if (runsResponse.status === 404) return { ok: false, error: 'Repository unavailable', errorType: 'repository' as const, status: runsResponse.status };
      return { ok: false, error: `GitHub ${runsResponse.status}`, errorType: 'api' as const, status: runsResponse.status };
    }
    const data = await runsResponse.json() as { workflow_runs?: Array<Record<string, unknown>> };
    const runs = data.workflow_runs ?? [];
    const latest = runs[0];
    const failed24h = runs.filter((run) => {
      const created = Date.parse(String(run.created_at ?? ''));
      return Date.now() - created < 24 * 60 * 60 * 1000 && run.conclusion === 'failure';
    }).length;
    let latestCommit: { sha: string; message: string; author: string; date: string; url: string } | null = null;
    if (commitsResponse.ok) {
      const commits = await commitsResponse.json() as Array<{ sha?: string; commit?: { message?: string; author?: { name?: string; date?: string } }; html_url?: string }>;
      const first = commits[0];
      if (first) {
        latestCommit = {
          sha: first.sha?.slice(0, 7) ?? '',
          message: first.commit?.message?.split('\n')[0] ?? '',
          author: first.commit?.author?.name ?? '',
          date: first.commit?.author?.date ?? '',
          url: first.html_url ?? '',
        };
      }
    }
    return {
      ok: true,
      latest: latest ? { name: latest.name, status: latest.status, conclusion: latest.conclusion, updated_at: latest.updated_at, html_url: latest.html_url } : null,
      failed24h,
      latestCommit,
    };
  } catch {
    clearTimeout(timer);
    return { ok: false, error: 'GitHub erişilemedi', errorType: 'network' as const };
  }
}

async function cloudflareTraffic(site: Site, env: Env) {
  if (!env.CF_API_TOKEN || !site.zoneTag) return { ok: false, available: false, reason: 'Cloudflare secret yapılandırılmadı' };
  const query = `query($zoneTag:String!, $date:Date!, $date7:Date!, $date30:Date!, $since:Time!, $until:Time!) { viewer { zones(filter:{zoneTag:$zoneTag}) { daily:httpRequests1dGroups(limit:1, filter:{date_geq:$date}) { sum { requests bytes cachedBytes } uniq { uniques } } sevenDays:httpRequests1dGroups(limit:7, filter:{date_geq:$date7}) { uniq { uniques } } thirtyDays:httpRequests1dGroups(limit:30, filter:{date_geq:$date30}) { uniq { uniques } } hourly:httpRequests1hGroups(limit:24, filter:{datetime_geq:$since, datetime_leq:$until}, orderBy:[datetime_ASC]) { dimensions { datetime } sum { requests countryMap { clientCountryName requests bytes } } uniq { uniques } } } } }`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const until = new Date();
    const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
    const since7 = new Date(until.getTime() - 6 * 24 * 60 * 60 * 1000);
    const since30 = new Date(until.getTime() - 29 * 24 * 60 * 60 * 1000);
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: { zoneTag: site.zoneTag, date: since.toISOString().slice(0, 10), date7: since7.toISOString().slice(0, 10), date30: since30.toISOString().slice(0, 10), since: since.toISOString(), until: until.toISOString() } }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const payload = await response.json() as { data?: { viewer?: { zones?: Array<{ daily?: Array<{ sum?: { requests?: number; bytes?: number; cachedBytes?: number }; uniq?: { uniques?: number } }>; sevenDays?: Array<{ uniq?: { uniques?: number } }>; thirtyDays?: Array<{ uniq?: { uniques?: number } }>; hourly?: Array<{ sum?: { requests?: number; countryMap?: Array<{ clientCountryName?: string; requests?: number; bytes?: number }> }; uniq?: { uniques?: number }; dimensions?: { datetime?: string } }> }> } }; errors?: Array<{ message?: string }> };
    if (!response.ok || payload.errors?.length) return { ok: false, available: false, reason: payload.errors?.[0]?.message || `Cloudflare ${response.status}` };
    const zone = payload.data?.viewer?.zones?.[0];
    const groups = zone?.hourly || [];
    const daily = zone?.daily?.[0];
    const countryTotals = new Map<string, { requests: number; bytes: number }>();
    for (const group of groups) {
      for (const country of group.sum?.countryMap || []) {
        const name = country.clientCountryName || 'Bilinmiyor';
        const current = countryTotals.get(name) || { requests: 0, bytes: 0 };
        current.requests += country.requests || 0;
        current.bytes += country.bytes || 0;
        countryTotals.set(name, current);
      }
    }
    const totalCountryRequests = Array.from(countryTotals.values()).reduce((sum, item) => sum + item.requests, 0);
    const totalCountryBytes = Array.from(countryTotals.values()).reduce((sum, item) => sum + item.bytes, 0);
    const countries = Array.from(countryTotals, ([country, metrics]) => ({
      country,
      ...metrics,
      requestShare: totalCountryRequests ? (metrics.requests / totalCountryRequests) * 100 : 0,
      bytesShare: totalCountryBytes ? (metrics.bytes / totalCountryBytes) * 100 : 0,
    })).sort((a, b) => b.requests - a.requests).slice(0, 15);
    const uniqueVisitors7d = (zone?.sevenDays || []).reduce((sum, group) => sum + (group.uniq?.uniques || 0), 0);
    const uniqueVisitors30d = (zone?.thirtyDays || []).reduce((sum, group) => sum + (group.uniq?.uniques || 0), 0);
    let sources: Array<{ host: string; requests: number; visits: number; bytes: number }> = [];
    if (env.CANSU_ANALYTICS_DB) {
      const previousDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const sourceRows = await env.CANSU_ANALYTICS_DB.prepare(
        'SELECT source, SUM(views) AS views FROM source_events WHERE site = ? AND day >= ? GROUP BY source ORDER BY views DESC LIMIT 12',
      ).bind(site.key, previousDay).all<{ source: string; views: number }>();
      sources = (sourceRows.results ?? []).map((item) => ({
        host: item.source || 'Doğrudan / bilinmiyor',
        requests: Number(item.views || 0),
        visits: Number(item.views || 0),
        bytes: 0,
      }));
    }
    return {
      ok: true,
      available: true,
      last24h: {
        requests: daily?.sum?.requests || groups.reduce((sum, group) => sum + (group.sum?.requests || 0), 0),
        bytes: daily?.sum?.bytes || 0,
        cachedBytes: daily?.sum?.cachedBytes || 0,
        uniqueVisitors: daily?.uniq?.uniques || 0,
        uniqueVisitors7d,
        uniqueVisitors30d,
      },
      automationSignal: (() => {
        const requests = daily?.sum?.requests || groups.reduce((sum, group) => sum + (group.sum?.requests || 0), 0);
        const visitors = daily?.uniq?.uniques || 0;
        const requestPerVisitor = visitors ? requests / visitors : 0;
        const topCountryShare = countries[0]?.requestShare || 0;
        const score = requestPerVisitor >= 15 || topCountryShare >= 45 ? 'high' : requestPerVisitor >= 8 || topCountryShare >= 25 ? 'medium' : 'low';
        return { level: score, requestPerVisitor: Number(requestPerVisitor.toFixed(1)), topCountryShare: Number(topCountryShare.toFixed(1)), note: 'Heuristik sinyaldir; kesin bot tespiti değildir.' };
      })(),
      countries,
      sources,
      hourly: groups.map((group) => ({ at: group.dimensions?.datetime, requests: group.sum?.requests || 0, uniqueVisitors: group.uniq?.uniques || 0 })),
    };
  } catch {
    clearTimeout(timer);
    return { ok: false, available: false, reason: 'Cloudflare Analytics erişilemedi' };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [health, github, traffic] = await Promise.all([
    Promise.all(sites.map(checkSite)),
    Promise.all(sites.map((site) => githubRun(site.repo, env))),
    Promise.all(sites.map((site) => cloudflareTraffic(site, env))),
  ]);
  const result = sites.map((site, index) => ({ ...site, health: health[index], github: github[index], cloudflare: traffic[index] }));
  return json({ generatedAt: new Date().toISOString(), source: { github: true, health: true, cloudflareAnalytics: traffic.some((item) => item.available) }, sites: result });
};

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, {
  status: 204,
  headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' },
});
