// Growth OS migration probe: no application data or credentials.
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const headers = {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff'
    };
    if ((request.method === 'GET' || request.method === 'HEAD') && path === '/health') {
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({
        service: 'growth-os-cloudflare-preview',
        status: 'migration-infrastructure-only',
        applicationReady: false
      }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ error: 'PREVIEW_NOT_CONFIGURED' }), { status: 403, headers });
  }
};
