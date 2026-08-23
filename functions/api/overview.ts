interface Env {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  GITHUB_TOKEN?: string;
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
  { key: 'iran-ahli', name: 'iran-ahli', url: 'https://iran-ahli.pages.dev/', repo: 'iran-ahli', actions: 'https://github.com/teyfikgokdemir/iran-ahli/actions' },
];

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function checkSite(site: Site) {
  const started = Date.now();
  try {
    const response = await fetch(site.url, { method: 'HEAD', redirect: 'follow' });
    return { ok: response.ok, status: response.status, ms: Date.now() - started, checkedAt: new Date().toISOString() };
  } catch {
    return { ok: false, status: 0, ms: Date.now() - started, checkedAt: new Date().toISOString() };
  }
}

async function githubRun(repo: string, env: Env) {
  try {
    const response = await fetch(`https://api.github.com/repos/teyfikgokdemir/${repo}/actions/runs?per_page=10`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'cansu-dashboard', ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}) },
    });
    if (!response.ok) return { ok: false, error: `GitHub ${response.status}` };
    const data = await response.json() as { workflow_runs?: Array<Record<string, unknown>> };
    const runs = data.workflow_runs ?? [];
    const latest = runs[0];
    const failed24h = runs.filter((run) => {
      const created = Date.parse(String(run.created_at ?? ''));
      return Date.now() - created < 24 * 60 * 60 * 1000 && run.conclusion === 'failure';
    }).length;
    return {
      ok: true,
      latest: latest ? { name: latest.name, status: latest.status, conclusion: latest.conclusion, updated_at: latest.updated_at, html_url: latest.html_url } : null,
      failed24h,
    };
  } catch {
    return { ok: false, error: 'GitHub erişilemedi' };
  }
}

async function cloudflareTraffic(site: Site, env: Env) {
  if (!env.CF_API_TOKEN || !site.zoneTag) return { ok: false, available: false, reason: 'Cloudflare secret yapılandırılmadı' };
  const query = `query($zoneTag:String!, $since:Time!, $until:Time!) { viewer { zones(filter:{zoneTag:$zoneTag}) { httpRequests1hGroups(limit:24, filter:{datetime_geq:$since, datetime_leq:$until}, orderBy:[datetime_ASC]) { dimensions { datetime } sum { requests bytes cachedBytes } uniq { uniques } } } } }`;
  try {
    const until = new Date();
    const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: { zoneTag: site.zoneTag, since: since.toISOString(), until: until.toISOString() } }),
    });
    const payload = await response.json() as { data?: { viewer?: { zones?: Array<{ httpRequests1hGroups?: Array<{ sum?: { requests?: number; bytes?: number; cachedBytes?: number }; uniq?: { uniques?: number }; dimensions?: { datetime?: string } }> }> } }; errors?: Array<{ message?: string }> };
    if (!response.ok || payload.errors?.length) return { ok: false, available: false, reason: payload.errors?.[0]?.message || `Cloudflare ${response.status}` };
    const groups = payload.data?.viewer?.zones?.[0]?.httpRequests1hGroups || [];
    return {
      ok: true,
      available: true,
      last24h: {
        requests: groups.reduce((sum, group) => sum + (group.sum?.requests || 0), 0),
        bytes: groups.reduce((sum, group) => sum + (group.sum?.bytes || 0), 0),
        cachedBytes: groups.reduce((sum, group) => sum + (group.sum?.cachedBytes || 0), 0),
        uniqueVisitors: groups.reduce((sum, group) => sum + (group.uniq?.uniques || 0), 0),
      },
      hourly: groups.map((group) => ({ at: group.dimensions?.datetime, requests: group.sum?.requests || 0, uniqueVisitors: group.uniq?.uniques || 0 })),
    };
  } catch {
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
