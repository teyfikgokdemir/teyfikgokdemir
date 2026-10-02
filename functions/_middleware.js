const CANSU_HOST = 'cansu.teyfikgokdemir.com';

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === CANSU_HOST && (url.pathname === '/' || url.pathname === '')) {
    const target = new URL('/cansu', url);
    return Response.redirect(target.toString(), 302);
  }

  return context.next();
}
