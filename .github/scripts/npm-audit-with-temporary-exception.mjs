import { spawnSync } from 'node:child_process';

const ALLOWED_ADVISORY = 'GHSA-ch52-4w7c-c8xp';
const EXPIRES = new Date('2026-11-15T00:00:00Z');
const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

if (Date.now() >= EXPIRES.getTime()) {
  console.error(`Temporary audit exception for ${ALLOWED_ADVISORY} has expired. Reassess upstream packages.`);
  process.exit(1);
}

const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: process.platform === 'win32' });
const raw = (result.stdout || '').trim();

if (!raw) {
  console.error(result.stderr || 'npm audit produced no JSON output');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw);
} catch (error) {
  console.error('Unable to parse npm audit JSON output.');
  console.error(raw.slice(0, 2000));
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities || {};
const blocking = [];
const accepted = [];

const viaIsAllowed = (via) => {
  if (typeof via === 'string') return via === 'http-cache-semantics';
  if (!via || typeof via !== 'object') return false;
  const url = String(via.url || '');
  const source = String(via.source || '');
  const title = String(via.title || '');
  return url.includes(ALLOWED_ADVISORY) || source.includes(ALLOWED_ADVISORY) || title.includes('max-stale handling can disclose cross-user cached responses');
};

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  const severity = String(vuln?.severity || 'low');
  if ((severityRank[severity] ?? 0) < severityRank.high) continue;

  const via = Array.isArray(vuln?.via) ? vuln.via : [];
  const isKnownHttpCache = name === 'http-cache-semantics' && via.length > 0 && via.every(viaIsAllowed);
  const isAstroTransitivelyAffected = name === 'astro' && via.length > 0 && via.every(viaIsAllowed);

  if (isKnownHttpCache || isAstroTransitivelyAffected) {
    accepted.push({ name, severity, via });
  } else {
    blocking.push({ name, severity, via });
  }
}

if (accepted.length) {
  console.warn(`Accepted temporary upstream exception: ${ALLOWED_ADVISORY} (expires 2026-11-15).`);
  console.warn('Reason: http-cache-semantics has no fixed npm release yet and is pulled transitively by Astro.');
  for (const item of accepted) console.warn(` - ${item.name}: ${item.severity}`);
}

if (blocking.length) {
  console.error('Blocking high/critical vulnerabilities remain:');
  for (const item of blocking) console.error(` - ${item.name}: ${item.severity}`);
  process.exit(1);
}

console.log('Security audit passed: no unapproved high/critical vulnerabilities.');
