import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'https://growth-api-production-4917.up.railway.app';
const LAST_AUDIT_PROJECT_COOKIE = 'growth-last-audit-project';

function normalizedHost(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const routePath = path.join('/');
  const target = `${API_BASE.replace(/\/$/, '')}/${routePath}${request.nextUrl.search}`;

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

  let requestBody = '';
  if (!['GET', 'HEAD'].includes(request.method)) {
    requestBody = await request.text();
    init.body = requestBody;
  }

  try {
    const upstream = await fetch(target, init);
    let body = await upstream.text();

    if (routePath === 'audit' && request.method === 'POST' && upstream.ok) {
      try {
        const requested = JSON.parse(requestBody || '{}') as { domain?: string };
        const payload = JSON.parse(body) as { project?: { id?: string; domain?: string }; audit?: { domain?: string } };
        const requestedHost = normalizedHost(requested.domain);
        const returnedHost = normalizedHost(payload.audit?.domain || payload.project?.domain);
        if (requestedHost && returnedHost && requestedHost !== returnedHost) {
          return NextResponse.json({
            error: `Audit hedefi başka bir domaine yönlendi (${returnedHost}). Growth OS farklı bir projeye otomatik geçiş yapmadı.`,
          }, { status: 409, headers: { 'cache-control': 'no-store' } });
        }

        const response = new NextResponse(body, {
          status: upstream.status,
          headers: {
            'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
        if (payload.project?.id) {
          response.cookies.set(LAST_AUDIT_PROJECT_COOKIE, payload.project.id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: request.nextUrl.protocol === 'https:',
            path: '/',
            maxAge: 30,
          });
        }
        return response;
      } catch {
        // Upstream response shape was unexpected. Preserve the original response.
      }
    }

    if (routePath === 'projects' && request.method === 'GET' && upstream.ok) {
      const preferredProjectId = request.cookies.get(LAST_AUDIT_PROJECT_COOKIE)?.value;
      if (preferredProjectId) {
        try {
          const projects = JSON.parse(body) as Array<{ id?: string }>;
          if (Array.isArray(projects)) {
            const preferredIndex = projects.findIndex((project) => project.id === preferredProjectId);
            if (preferredIndex > 0) {
              const [preferred] = projects.splice(preferredIndex, 1);
              projects.unshift(preferred);
              body = JSON.stringify(projects);
            }
          }
        } catch {
          // Preserve upstream payload if it is not the expected project list JSON.
        }
      }
    }

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
