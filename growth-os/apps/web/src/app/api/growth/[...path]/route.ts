import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'https://growth-api-production-4917.up.railway.app';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${API_BASE.replace(/\/$/, '')}/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  // Production identity must come from Cloudflare Access only. Never forward
  // the client-controlled x-growth-user-email header to the API.
  const accessEmail = request.headers.get('cf-access-authenticated-user-email');
  if (accessEmail) headers.set('cf-access-authenticated-user-email', accessEmail);
  const accessJwt = request.headers.get('cf-access-jwt-assertion');
  if (accessJwt) headers.set('cf-access-jwt-assertion', accessJwt);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Growth API bağlantısı başarısız';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
