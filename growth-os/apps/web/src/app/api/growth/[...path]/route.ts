import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'https://growth-api-production-4917.up.railway.app';
const LAST_AUDIT_PROJECT_COOKIE = 'growth-last-audit-project';
const PROXY_TIMEOUT_MS = 30_000;
const PROXY_RESPONSE_MAX_BYTES = 8 * 1024 * 1024;

function normalizedHost(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function normalizePassingAuditEvidence(value: unknown) {
  if (!value || typeof value !== 'object') return;
  const audit = value as { issues?: Array<{ status?: string; evidence?: Array<{ problem?: string }> }> };
  if (!Array.isArray(audit.issues)) return;
  for (const issue of audit.issues) {
    if (issue.status !== 'pass' || !Array.isArray(issue.evidence)) continue;
    for (const evidence of issue.evidence) {
      if (evidence.problem === 'too_short' || evidence.problem === 'too_long') evidence.problem = 'valid';
    }
  }
}

type ComparisonIssue = { key?: string; title?: string; severity?: string; status?: string };
type ComparisonAudit = {
  overallScore?: number;
  scores?: { adsReadiness?: number };
  issues?: ComparisonIssue[];
};

function normalizeFinalCheckComparison(value: unknown) {
  if (!value || typeof value !== 'object') return;
  const payload = value as { current?: ComparisonAudit; previous?: ComparisonAudit | null; comparison?: unknown };
  const current = payload.current;
  const previous = payload.previous;
  if (!current || !previous || !Array.isArray(current.issues) || !Array.isArray(previous.issues)) return;

  const previousByKey = new Map(previous.issues.map((issue) => [issue.key, issue]));
  const currentByKey = new Map(current.issues.map((issue) => [issue.key, issue]));
  const fixed = current.issues.filter((issue) => issue.status === 'pass' && previousByKey.get(issue.key)?.status === 'fail');
  const stillOpen = current.issues.filter((issue) => issue.status === 'fail' && previousByKey.get(issue.key)?.status === 'fail');
  const newIssues = current.issues.filter((issue) => issue.status === 'fail' && previousByKey.get(issue.key)?.status !== 'fail');
  const regressed = previous.issues.filter((issue) => issue.status !== 'fail' && currentByKey.get(issue.key)?.status === 'fail');
  const previousScore = Number(previous.overallScore || 0);
  const currentScore = Number(current.overallScore || 0);
  const criticalOpen = current.issues.filter((issue) => issue.status === 'fail' && ['critical', 'high'].includes(issue.severity || ''));
  const ready = criticalOpen.length === 0 && Number(current.scores?.adsReadiness || 0) >= 80 && currentScore >= 80;

  payload.comparison = {
    previousScore,
    currentScore,
    scoreDelta: currentScore - previousScore,
    fixed: fixed.map((issue) => ({ key: issue.key, title: issue.title })),
    stillOpen: stillOpen.map((issue) => ({ key: issue.key, title: issue.title, severity: issue.severity })),
    newIssues: newIssues.map((issue) => ({ key: issue.key, title: issue.title, severity: issue.severity })),
    regressed: regressed.map((issue) => ({ key: issue.key, title: issue.title })),
    readiness: ready ? 'ready' : 'not_ready',
    verdict: ready
      ? 'Final kontrolden geçti. Reklam hazırlık aşamasına geçilebilir.'
      : `Final kontrol tamamlanmadı. ${criticalOpen.length} kritik/yüksek öncelikli madde açık.`,
  };
}

function normalizeAuditPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return payload;
  const record = payload as Record<string, unknown>;
  normalizePassingAuditEvidence(record.audit);
  normalizePassingAuditEvidence(record.current);
  normalizePassingAuditEvidence(record.previous);
  return payload;
}

async function readLimitedResponseText(response: Response, maxBytes = PROXY_RESPONSE_MAX_BYTES) {
  const contentLength = Number(response.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel();
    throw new Error('Growth API yanıtı boyut limitini aştı.');
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Growth API yanıtı boyut limitini aştı.');
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Growth API isteği zaman aşımına uğradı.')), PROXY_TIMEOUT_MS);
  try {
    const upstream = await fetch(target, { ...init, signal: controller.signal });
    let body = await readLimitedResponseText(upstream);

    if (upstream.ok && (routePath === 'audit' || routePath.endsWith('/final-check'))) {
      try {
        const parsed = JSON.parse(body);
        normalizeAuditPayload(parsed);
        if (routePath.endsWith('/final-check')) normalizeFinalCheckComparison(parsed);
        body = JSON.stringify(parsed);
      } catch {
        // Preserve upstream payload if it is not the expected audit JSON.
      }
    }

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
  } finally {
    clearTimeout(timeout);
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
