const CANSU_HOST = 'cansu.teyfikgokdemir.com';

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === CANSU_HOST && (url.pathname === '/' || url.pathname === '')) {
    const target = new URL('/cansu/', url);
    const response = await context.env.ASSETS.fetch(new Request(target, context.request));
    const headers = new Headers(response.headers);
    headers.set('content-location', '/');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  return context.next();
}
