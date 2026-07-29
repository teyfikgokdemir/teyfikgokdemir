import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const origin = 'https://teyfikgokdemir.com';
const errors = [];
const warnings = [];
const htmlFiles = [];

const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name === 'index.html') htmlFiles.push(target);
  }
};
const routeFor = (file) => {
  const relative = path.relative(dist, path.dirname(file)).split(path.sep).join('/');
  return relative ? `/${relative}/` : '/';
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
const attribute = (tag, name) => tag?.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
const selectedTag = (html, name, attrName, attrValue) =>
  tags(html, name).find((tag) => attribute(tag, attrName)?.toLowerCase() === attrValue.toLowerCase());
const titleText = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/<[^>]+>/g, '').trim();
const routeFromUrl = (value) => {
  try { return decodeURI(new URL(value, origin).pathname); } catch { return undefined; }
};
const normalizedUrl = (value) => {
  try { return new URL(value, origin).href; } catch { return value; }
};

if (!fs.existsSync(dist)) throw new Error('dist/ bulunamadı. Önce npm run build çalıştırın.');
walk(dist);

const redirectFile = path.join(dist, '_redirects');
const redirectLines = fs.existsSync(redirectFile)
  ? fs.readFileSync(redirectFile, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
  : [];
const redirects = new Map();
for (const line of redirectLines) {
  const [source, target, status] = line.split(/\s+/);
  if (!source || !target || !['301', '308'].includes(status)) errors.push(`Geçersiz redirect kuralı: ${line}`);
  else redirects.set(decodeURI(source), decodeURI(target));
}
for (const [source, target] of redirects) {
  if (redirects.has(target)) errors.push(`Redirect zinciri: ${source} -> ${target}`);
  if (source === target) errors.push(`Redirect döngüsü: ${source}`);
}

const pageByRoute = new Map();
const canonicalOwners = new Map();
const titleOwners = new Map();
const descriptionOwners = new Map();
for (const file of htmlFiles) {
  const route = routeFor(file);
  const html = fs.readFileSync(file, 'utf8');
  const robots = attribute(selectedTag(html, 'meta', 'name', 'robots'), 'content') ?? '';
  const redirected = redirects.has(route);
  const indexable = !redirected && !/noindex/i.test(robots);
  const canonicalTags = tags(html, 'link').filter((tag) => attribute(tag, 'rel')?.toLowerCase() === 'canonical');
  const canonical = attribute(canonicalTags[0], 'href');
  const title = titleText(html);
  const description = attribute(selectedTag(html, 'meta', 'name', 'description'), 'content');
  const lang = attribute(tags(html, 'html')[0], 'lang');
  const alternates = new Map(tags(html, 'link')
    .filter((tag) => attribute(tag, 'rel')?.toLowerCase() === 'alternate' && attribute(tag, 'hreflang'))
    .map((tag) => [attribute(tag, 'hreflang'), attribute(tag, 'href')]));
  pageByRoute.set(route, { route, html, indexable, canonical, alternates, lang });

  if (!indexable) continue;
  if (!/^index,follow(?:,|$)/i.test(robots)) errors.push(`${route}: index,follow robots meta eksik.`);
  if (!title) errors.push(`${route}: title eksik.`);
  if (!description) errors.push(`${route}: meta description eksik.`);
  if (!canonical || !canonical.startsWith(`${origin}/`) || canonical.includes('www.')) errors.push(`${route}: canonical HTTPS/non-www değil.`);
  if (canonical && routeFromUrl(canonical) !== route) errors.push(`${route}: self-canonical değil (${canonical}).`);
  if (canonicalOwners.has(canonical)) errors.push(`${route}: canonical tekrar ediyor (${canonical}).`);
  else canonicalOwners.set(canonical, route);
  if (titleOwners.has(title)) errors.push(`${route}: title tekrar ediyor (${title}).`);
  else titleOwners.set(title, route);
  if (descriptionOwners.has(description)) errors.push(`${route}: description tekrar ediyor.`);
  else descriptionOwners.set(description, route);
  if (!['tr', 'en', 'mk', 'sr', 'sq', 'fa'].includes(lang)) errors.push(`${route}: geçersiz html lang (${lang}).`);
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) errors.push(`${route}: tam bir H1 bekleniyor.`);
  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch { errors.push(`${route}: geçersiz JSON-LD.`); }
  }
  if (!/application\/ld\+json/i.test(html)) errors.push(`${route}: JSON-LD eksik.`);
  if (/<script\b[^>]*src=["'][^"']*googletagmanager\.com\/gtag/i.test(html)) {
    errors.push(`${route}: analitik scripti izin alınmadan HTML içinde yükleniyor.`);
  }
  if (title && (title.length < 15 || title.length > 90)) warnings.push(`${route}: title uzunluğu ${title.length}.`);
}

for (const page of pageByRoute.values()) {
  if (!page.indexable || page.alternates.size === 0) continue;
  if (!page.alternates.has(page.lang)) errors.push(`${page.route}: self hreflang (${page.lang}) eksik.`);
  if (!page.alternates.has('x-default')) errors.push(`${page.route}: x-default eksik.`);
  for (const [language, href] of page.alternates) {
    const targetRoute = routeFromUrl(href);
    const target = pageByRoute.get(targetRoute);
    if (!target?.indexable) errors.push(`${page.route}: hreflang hedefi indexlenebilir değil (${language}: ${href}).`);
    if (language !== 'x-default' && target && normalizedUrl(target.alternates.get(page.lang)) !== normalizedUrl(page.canonical)) {
      errors.push(`${page.route}: hreflang karşılığı yok (${language}: ${targetRoute}).`);
    }
  }
}

const internalAssetPrefixes = ['/images/', '/_astro/', '/favicon-', '/apple-touch-icon', '/site.webmanifest'];
for (const page of pageByRoute.values()) {
  if (!page.indexable) continue;
  for (const tag of tags(page.html, 'a')) {
    const href = attribute(tag, 'href');
    if (!href || /^(?:mailto:|tel:|https?:\/\/|#)/i.test(href) || internalAssetPrefixes.some((prefix) => href.startsWith(prefix))) continue;
    const targetRoute = routeFromUrl(href);
    if (redirects.has(targetRoute)) errors.push(`${page.route}: iç bağlantı redirect kaynağına gidiyor (${href}).`);
    else if (!pageByRoute.has(targetRoute)) errors.push(`${page.route}: kırık iç bağlantı (${href}).`);
  }
}

const sitemapPath = path.join(dist, 'sitemap.xml');
const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
const expected = [...pageByRoute.values()].filter((page) => page.indexable).map((page) => page.canonical).sort();
const actual = [...new Set(locations)].sort();
if (locations.length !== actual.length) errors.push('Sitemap içinde yinelenen URL var.');
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  for (const url of expected.filter((url) => !actual.includes(url))) errors.push(`Sitemap URL eksik: ${url}`);
  for (const url of actual.filter((url) => !expected.includes(url))) errors.push(`Sitemap URL fazlalığı: ${url}`);
}
for (const url of actual) {
  if (!url.startsWith(`${origin}/`) || url.includes('www.') || !url.endsWith('/')) errors.push(`Sitemap URL standardı hatalı: ${url}`);
}

const robotsPath = path.join(dist, 'robots.txt');
const robotsText = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : '';
if (!/^User-agent:\s*\*$/mi.test(robotsText) || !/^Allow:\s*\/$/mi.test(robotsText)) errors.push('robots.txt genel taramaya izin vermiyor.');
if (!robotsText.includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt canonical sitemap adresini göstermiyor.');
const headersText = fs.existsSync(path.join(dist, '_headers')) ? fs.readFileSync(path.join(dist, '_headers'), 'utf8') : '';
if (/X-Robots-Tag:\s*noindex/i.test(headersText)) errors.push('_headers içinde genel noindex X-Robots-Tag bulundu.');
const cloudflareDoc = fs.existsSync(path.resolve('docs/cloudflare-canonical-host.md')) ? fs.readFileSync(path.resolve('docs/cloudflare-canonical-host.md'), 'utf8') : '';
if (!/www\.teyfikgokdemir\.com/i.test(cloudflareDoc) || !/301|308/.test(cloudflareDoc) || !/query/i.test(cloudflareDoc)) {
  errors.push('Cloudflare www/HTTPS redirect beklentileri belgelenmemiş.');
}

console.log(`Sayfalar: ${pageByRoute.size}; indexlenebilir: ${expected.length}; sitemap: ${actual.length}; redirect: ${redirects.size}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  console.error(`BAŞARISIZ: ${errors.length} hata, ${warnings.length} uyarı.`);
  process.exit(1);
}
console.log(`BAŞARILI: canonical, hreflang, schema, sitemap, robots, redirect ve iç bağlantılar doğrulandı (${warnings.length} uyarı).`);
