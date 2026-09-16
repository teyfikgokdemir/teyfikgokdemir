import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const origin = 'https://teyfikgokdemir.com';
const errors = [];
const warnings = [];
const htmlFiles = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name === 'index.html') htmlFiles.push(target);
  }
};
const routeFor = (file) => {
  const relative = path.relative(dist, path.dirname(file)).split(path.sep).join('/');
  return relative ? `/${relative}/` : '/';
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
const attr = (tag, name) => tag?.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
const selectedTag = (html, name, attrName, value) => tags(html, name).find((tag) => attr(tag, attrName)?.toLowerCase() === value.toLowerCase());
const titleText = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/<[^>]+>/g, '').trim();
const pathnameFor = (value) => { try { return decodeURI(new URL(value, origin).pathname); } catch { return undefined; } };
const normalize = (value) => { try { return new URL(value, origin).href; } catch { return value; } };

if (!fs.existsSync(dist)) throw new Error('dist/ bulunamadı. Önce npm run build çalıştırın.');
walk(dist);

for (const asset of [
  'brand/teyfik-gokdemir-primary.webp',
  'brand/teyfik-gokdemir-primary.png',
  'brand/teyfik-gokdemir-signature.webp',
  'brand/teyfik-gokdemir-signature.png',
  'brand/teyfik-gokdemir-monogram.webp',
  'brand/teyfik-gokdemir-monogram.png',
  'brand/teyfik-gokdemir-og.webp',
]) {
  const file = path.join(dist, ...asset.split('/'));
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) errors.push(`Marka varlığı eksik veya boş: /${asset}`);
}

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
  if (source === target) errors.push(`Redirect döngüsü: ${source}`);
  if (redirects.has(target)) errors.push(`Redirect zinciri: ${source} -> ${target}`);
}

const pageByRoute = new Map();
const canonicalOwners = new Map();
const titleOwners = new Map();
const descriptionOwners = new Map();

for (const file of htmlFiles) {
  const route = routeFor(file);
  const html = fs.readFileSync(file, 'utf8');
  const robots = attr(selectedTag(html, 'meta', 'name', 'robots'), 'content') ?? '';
  const indexable = !/noindex/i.test(robots) && !redirects.has(route);
  const canonical = attr(tags(html, 'link').find((tag) => attr(tag, 'rel')?.toLowerCase() === 'canonical'), 'href');
  const title = titleText(html);
  const description = attr(selectedTag(html, 'meta', 'name', 'description'), 'content');
  const lang = attr(tags(html, 'html')[0], 'lang');
  const alternates = new Map(tags(html, 'link')
    .filter((tag) => attr(tag, 'rel')?.toLowerCase() === 'alternate' && attr(tag, 'hreflang'))
    .map((tag) => [attr(tag, 'hreflang'), attr(tag, 'href')]));

  pageByRoute.set(route, { route, html, indexable, canonical, alternates, lang });
  if (!indexable) continue;

  if (!/^index,follow(?:,|$)/i.test(robots)) errors.push(`${route}: index,follow robots meta eksik.`);
  if (!title) errors.push(`${route}: title eksik.`);
  if (!description) errors.push(`${route}: meta description eksik.`);
  if (!canonical || !canonical.startsWith(`${origin}/`) || canonical.includes('www.')) errors.push(`${route}: canonical HTTPS/non-www değil.`);
  if (canonical && pathnameFor(canonical) !== route) errors.push(`${route}: self-canonical değil (${canonical}).`);
  if (canonicalOwners.has(canonical)) errors.push(`${route}: canonical tekrar ediyor (${canonical}).`); else canonicalOwners.set(canonical, route);
  if (titleOwners.has(title)) errors.push(`${route}: title tekrar ediyor (${title}).`); else titleOwners.set(title, route);
  if (descriptionOwners.has(description)) warnings.push(`${route}: meta description başka bir sayfayla aynı.`); else descriptionOwners.set(description, route);
  if (!['tr','en','ru','mk','sr','sq','fa','zh-CN','zh','vi-VN','vi'].includes(lang)) errors.push(`${route}: geçersiz html lang (${lang}).`);
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) errors.push(`${route}: tam bir H1 bekleniyor.`);
  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch { errors.push(`${route}: geçersiz JSON-LD.`); }
  }
  if (!/application\/ld\+json/i.test(html)) errors.push(`${route}: JSON-LD eksik.`);
  const ogImage = attr(selectedTag(html, 'meta', 'property', 'og:image'), 'content');
  const ogWidth = attr(selectedTag(html, 'meta', 'property', 'og:image:width'), 'content');
  const ogHeight = attr(selectedTag(html, 'meta', 'property', 'og:image:height'), 'content');
  const twitterCard = attr(selectedTag(html, 'meta', 'name', 'twitter:card'), 'content');
  const twitterImage = attr(selectedTag(html, 'meta', 'name', 'twitter:image'), 'content');
  if (ogImage !== `${origin}/brand/teyfik-gokdemir-og.webp`) errors.push(`${route}: marka OG görseli yanlış.`);
  if (ogWidth !== '1200' || ogHeight !== '630') errors.push(`${route}: OG görsel boyutları 1200x630 değil.`);
  if (twitterCard !== 'summary_large_image' || twitterImage !== ogImage) errors.push(`${route}: Twitter card marka görseliyle eşleşmiyor.`);
  if (/<script\b[^>]*src=["'][^"']*googletagmanager\.com\/gtag/i.test(html)) errors.push(`${route}: analitik scripti izin alınmadan HTML içinde yükleniyor.`);
  if (title && (title.length < 15 || title.length > 90)) warnings.push(`${route}: title uzunluğu ${title.length}.`);
}

for (const page of pageByRoute.values()) {
  if (!page.indexable || page.alternates.size === 0) continue;
  const self = page.lang === 'zh-CN' ? 'zh' : page.lang === 'vi-VN' ? 'vi' : page.lang;
  if (!page.alternates.has(self)) errors.push(`${page.route}: self hreflang (${self}) eksik.`);
  if (!page.alternates.has('x-default')) errors.push(`${page.route}: x-default eksik.`);
  for (const [language, href] of page.alternates) {
    const target = pageByRoute.get(pathnameFor(href));
    if (!target?.indexable) errors.push(`${page.route}: hreflang hedefi indexlenebilir değil (${language}: ${href}).`);
    if (language !== 'x-default' && target) {
      const back = target.alternates.get(self);
      if (normalize(back) !== normalize(page.canonical)) errors.push(`${page.route}: hreflang karşılığı yok (${language}: ${pathnameFor(href)}).`);
    }
  }
}

const homeRoutes = ['/', '/en/', '/ru/', '/mk/', '/sr/', '/sq/', '/fa/', '/zh/', '/vi/'];
const ecosystemMarkers = [
  'QCT Studio',
  'QCT Commerce',
  'CTSEG',
  'Growth OS',
  'Mythborn',
  'Olivon',
  'https://qctstudio.com',
  'https://qctcommerce.com',
  'https://ctseg.com.tr',
  'https://growth.teyfikgokdemir.com',
  'https://mythborn.co',
  'https://olivon.com.tr',
];
for (const route of homeRoutes) {
  const page = pageByRoute.get(route);
  if (!page?.indexable) { errors.push(`${route}: locale ana sayfası eksik veya indexlenebilir değil.`); continue; }
  for (const marker of ecosystemMarkers) if (!page.html.includes(marker)) errors.push(`${route}: ekosistem işareti eksik (${marker}).`);
  if (/data-trade-focus-link|data-specialist-link|data-commercial-evaluations/.test(page.html)) errors.push(`${route}: eski CTSEG ürün-katalog ana sayfa blokları hâlâ mevcut.`);
}

const trHome = pageByRoute.get('/');
if (trHome && !trHome.html.includes('Dijital sistemler kuruyor')) errors.push('/: yeni Türkçe konumlandırma başlığı eksik.');
const enHome = pageByRoute.get('/en/');
if (enHome && !enHome.html.includes('I build digital systems')) errors.push('/en/: yeni İngilizce konumlandırma başlığı eksik.');

for (const required of [
  ['/reflex/', 'https://ctseg.com.tr/tr/ticari-urunler/reflex-tek-kullanimlik-eldivenler/'],
  ['/iran-antep-fistigi-tedarik-stratejisi/', 'https://ctseg.com.tr/tr/ticari-urunler/'],
]) {
  if (redirects.get(required[0]) !== required[1]) errors.push(`${required[0]}: beklenen 301 hedefi eksik veya yanlış.`);
}

const sitemapFile = path.join(dist, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) errors.push('sitemap.xml eksik.');
else {
  const sitemap = fs.readFileSync(sitemapFile, 'utf8');
  for (const page of pageByRoute.values()) {
    if (!page.indexable) continue;
    if (!sitemap.includes(`<loc>${page.canonical}</loc>`)) errors.push(`${page.route}: sitemap içinde yok.`);
  }
  for (const source of redirects.keys()) {
    if (!source.includes('*') && sitemap.includes(`<loc>${origin}${source}</loc>`)) errors.push(`${source}: redirect kaynağı sitemap içinde kalmış.`);
  }
}

const staticAssetPrefixes = ['/brand/','/images/','/styles/','/_astro/','/favicon','/apple-touch-icon','/site.webmanifest','/robots.txt','/sitemap'];
for (const page of pageByRoute.values()) {
  if (!page.indexable) continue;
  for (const match of page.html.matchAll(/<a\b[^>]*href=["']([^"'#]+)(?:#[^"']*)?["'][^>]*>/gi)) {
    const href = match[1];
    let url;
    try { url = new URL(href, `${origin}${page.route}`); } catch { continue; }
    if (url.origin !== origin) continue;
    const route = decodeURI(url.pathname);
    if (staticAssetPrefixes.some((prefix) => route.startsWith(prefix))) continue;
    if (!pageByRoute.has(route) && !redirects.has(route) && route !== '/') errors.push(`${page.route}: kırık dahili bağlantı (${href}).`);
  }
  for (const tag of page.html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    const rel = attr(tag[0], 'rel') ?? '';
    if (!/noopener/i.test(rel) || !/noreferrer/i.test(rel)) errors.push(`${page.route}: target=_blank bağlantısında noopener noreferrer eksik.`);
  }
}

if (warnings.length) {
  console.warn(`\nSEO audit uyarıları (${warnings.length}):`);
  for (const warning of warnings.slice(0, 80)) console.warn(`- ${warning}`);
  if (warnings.length > 80) console.warn(`- ... ${warnings.length - 80} ek uyarı`);
}
if (errors.length) {
  console.error(`\nSEO audit hataları (${errors.length}):`);
  for (const error of errors.slice(0, 160)) console.error(`- ${error}`);
  if (errors.length > 160) console.error(`- ... ${errors.length - 160} ek hata`);
  process.exit(1);
}
console.log(`SEO audit passed: ${pageByRoute.size} route, ${homeRoutes.length} localized homepages, ecosystem and 301 contracts verified.`);
