// Migration infrastructure probe. Does not expose business records or API credentials.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const headers = {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff'
    };
    if ((request.method === 'GET' || request.method === 'HEAD') && path === '/health') {
      let database = 'unavailable';
      try {
        const row = await env.PREVIEW_DB.prepare("SELECT value FROM migration_meta WHERE key = 'state'").first();
        if (row?.value === 'preview-infrastructure-only') database = 'ready';
      } catch { /* Do not expose database details in public health results. */ }
      const result = {
        service: 'growth-os-cloudflare-preview',
        status: 'migration-infrastructure-only',
        applicationReady: false,
        database
      };
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(result), {
        status: database === 'ready' ? 200 : 503, headers
      });
    }
    return new Response(JSON.stringify({ error: 'PREVIEW_NOT_CONFIGURED' }), { status: 403, headers });
  }
};
