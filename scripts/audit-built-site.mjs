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

const requiredBrandAssets = [
  'brand/teyfik-gokdemir-primary.webp',
  'brand/teyfik-gokdemir-primary.png',
  'brand/teyfik-gokdemir-signature.webp',
  'brand/teyfik-gokdemir-signature.png',
  'brand/teyfik-gokdemir-monogram.webp',
  'brand/teyfik-gokdemir-monogram.png',
  'brand/teyfik-gokdemir-og.webp',
];
for (const asset of requiredBrandAssets) {
  const assetPath = path.join(dist, ...asset.split('/'));
  if (!fs.existsSync(assetPath) || fs.statSync(assetPath).size === 0) {
    errors.push(`Marka varlığı eksik veya boş: /${asset}`);
  }
}
const astroAssetDirectory = path.join(dist, '_astro');
const builtCss = fs.existsSync(astroAssetDirectory)
  ? fs.readdirSync(astroAssetDirectory)
      .filter((file) => file.endsWith('.css'))
      .map((file) => fs.readFileSync(path.join(astroAssetDirectory, file), 'utf8'))
      .join('\n')
  : '';
if (!builtCss.includes('ventureMarqueeFlow')) errors.push('Marquee keyframe derlenmiş CSS içinde eksik.');
if (!builtCss.includes('venture-marquee__group') || !builtCss.includes('prefers-reduced-motion:reduce')) errors.push('Marquee reduced-motion stili derlenmiş CSS içinde eksik.');

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
  const ogImage = attribute(selectedTag(html, 'meta', 'property', 'og:image'), 'content');
  const ogWidth = attribute(selectedTag(html, 'meta', 'property', 'og:image:width'), 'content');
  const ogHeight = attribute(selectedTag(html, 'meta', 'property', 'og:image:height'), 'content');
  const twitterCard = attribute(selectedTag(html, 'meta', 'name', 'twitter:card'), 'content');
  const twitterImage = attribute(selectedTag(html, 'meta', 'name', 'twitter:image'), 'content');
  if (ogImage !== `${origin}/brand/teyfik-gokdemir-og.webp`) errors.push(`${route}: marka OG görseli yanlış.`);
  if (ogWidth !== '1200' || ogHeight !== '630') errors.push(`${route}: OG görsel boyutları 1200x630 değil.`);
  if (twitterCard !== 'summary_large_image' || twitterImage !== ogImage) errors.push(`${route}: Twitter card marka görseliyle eşleşmiyor.`);
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

const faHome = pageByRoute.get('/fa/');
if (!faHome) errors.push('/fa/: sayfa bulunamadı.');
else {
  const requiredPersianStrategy = [
    'برای تولیدکنندگان و صادرکنندگان ایرانی',
    'ترکیه، اروپا، آمریکا و سایر بازارهای هدف',
    'کارگاه‌های فرش دستباف','تولیدکنندگان فرش ابریشم دستباف','تولیدکنندگان فرش ماشینی','صادرکنندگان فرش',
    'تولیدکنندگان پارچه','تولیدکنندگان حوله و حوله تن‌پوش','تولیدکنندگان منسوجات خانگی','تولیدکنندگان پوشاک','برندهای دارای تولید با نام تجاری اختصاصی',
    'ارزیابی تجاری محصول','تعیین بازار هدف','آماده‌سازی پیشنهاد تجاری','ارتباط و مذاکره اولیه با خریداران','مدیریت RFQ','هماهنگی نمونه',
    'بررسی قیمت، MOQ و ظرفیت تولید','هماهنگی بسته‌بندی و برچسب‌گذاری','بررسی آمادگی اسناد صادراتی','هماهنگی ورود به بازار و توسعه کانال فروش',
    'هر محصول پیش از معرفی به بازار باید از نظر کیفیت، ظرفیت تولید، قیمت‌گذاری، حداقل سفارش، بسته‌بندی، اسناد و امکان اجرای تجاری بررسی شود.',
    'معرفی محصول برای ارزیابی تجاری','آغاز گفت‌وگو درباره بازارهای بین‌المللی'
  ];
  for (const text of requiredPersianStrategy) if (!faHome.html.includes(text)) errors.push(`/fa/: محتوای راهبردی فارسی eksik (${text}).`);
  const expectedSectorLinks = [
    'https://ctseg.com.tr/fa/sourcing/فرش-ایرانی/',
    'https://ctseg.com.tr/fa/sourcing/فرش-ابریشم-دستباف/',
    'https://ctseg.com.tr/fa/sourcing/تامین-عمده-منسوجات/'
  ];
  for (const href of expectedSectorLinks) if (!faHome.html.includes(`href="${encodeURI(href)}"`) && !faHome.html.includes(`href="${href}"`)) errors.push(`/fa/: CTSEG sektör bağlantısı eksik (${href}).`);
  if ((faHome.html.match(/data-fa-sector-link=/g) ?? []).length !== 3) errors.push('/fa/: üç ayrı CTSEG sektör bağlantısı bekleniyor.');
  if (!titleText(faHome.html)?.includes('هماهنگ‌کننده تجاری تولیدکنندگان و صادرکنندگان ایرانی')) errors.push('/fa/: title üretici/ihracatçı hedefini yansıtmıyor.');
  const faDescription = attribute(selectedTag(faHome.html, 'meta', 'name', 'description'), 'content') ?? '';
  if (!faDescription.includes('تولیدکنندگان و صادرکنندگان ایرانی') || !faDescription.includes('ترکیه، اروپا، آمریکا')) errors.push('/fa/: meta description üretici/ihracatçı ve hedef pazarları yansıtmıyor.');
  if (!/<html\b[^>]*lang="fa"[^>]*dir="rtl"/i.test(faHome.html)) errors.push('/fa/: lang=fa ve dir=rtl eksik.');
  const schemaText = [...faHome.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((match)=>match[1]).join('\n');
  for (const expertise of ['هماهنگی تجاری بین‌المللی','ورود تولیدکنندگان ایرانی به بازار','ارتباط تولیدکننده و خریدار','توسعه کانال فروش']) {
    if (!schemaText.includes(expertise)) errors.push(`/fa/: Person schema expertise eksik (${expertise}).`);
  }
}

const tradeEntryContracts = {
  tr:{title:'İran halısı ve tekstilde uluslararası ticari koordinasyon',links:['https://ctseg.com.tr/tr/sourcing/iran-halisi/','https://ctseg.com.tr/tr/sourcing/el-dokumasi-ipek-hali/','https://ctseg.com.tr/tr/sourcing/toptan-tekstil-tedariki/']},
  en:{title:'International commercial coordination for Iranian carpets and textiles',links:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  mk:{title:'Меѓународна трговска координација за ирански теписи и текстил',links:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  sr:{title:'Međunarodna komercijalna koordinacija za iranske tepihe i tekstil',links:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  sq:{title:'Koordinim tregtar ndërkombëtar për qilimat iranianë dhe tekstilet',links:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  fa:{title:'هماهنگی تجاری بین‌المللی برای فرش ایرانی و منسوجات',links:['https://ctseg.com.tr/fa/sourcing/فرش-ایرانی/','https://ctseg.com.tr/fa/sourcing/فرش-ابریشم-دستباف/','https://ctseg.com.tr/fa/sourcing/تامین-عمده-منسوجات/']}
};
for (const [lang,route] of [['tr','/tr/'],['en','/en/'],['mk','/mk/'],['sr','/sr/'],['sq','/sq/'],['fa','/fa/']]) {
  const page = pageByRoute.get(route);
  if (!page) { errors.push(`${route}: locale ana sayfası eksik.`); continue; }
  const tradeContract = tradeEntryContracts[lang];
  if (!page.html.includes(tradeContract.title)) errors.push(`${route}: halı/tekstil uzmanlık başlığı eksik.`);
  if ((page.html.match(/data-sector-link=/g) ?? []).length !== 3) errors.push(`${route}: üç ayrı sektör CTA bağlantısı bekleniyor.`);
  for (const href of tradeContract.links) if (!page.html.includes(`href="${encodeURI(href)}"`) && !page.html.includes(`href="${href}"`)) errors.push(`${route}: sektör CTA hedefi eksik (${href}).`);
  if (!page.html.includes('/images/ctseg-iranian-carpets-editorial.webp')) errors.push(`${route}: kontrollü editoryal görsel eksik.`);
  const localeLinks = tags(page.html,'a').filter((tag)=>attribute(tag,'hreflang') && ['tr','en','mk','sr','sq','fa'].includes(attribute(tag,'hreflang')));
  if (localeLinks.length < 6) errors.push(`${route}: global dil menüsü altı dili göstermiyor.`);
  for (const code of ['tr','en','mk','sr','sq','fa']) {
    const link = localeLinks.find((tag)=>attribute(tag,'hreflang')===code);
    if (routeFromUrl(attribute(link,'href')) !== `/${code}/`) errors.push(`${route}: ${code} locale hedefi yanlış.`);
    if ((code===lang) !== (attribute(link,'aria-current')==='page')) errors.push(`${route}: ${code} aktif locale durumu yanlış.`);
  }
  if (!new RegExp(`<a\\b[^>]*class="brand"[^>]*href="${route}"[^>]*aria-label="Teyfik Gökdemir"`, 'i').test(page.html)) errors.push(`${route}: header logo bağlantısı locale ana sayfasına gitmiyor.`);
  if (!page.html.includes('/brand/teyfik-gokdemir-primary.webp') || !page.html.includes('/brand/teyfik-gokdemir-monogram.webp')) errors.push(`${route}: responsive kişisel marka kaynakları eksik.`);
  if (!/<img\b[^>]*src="\/brand\/teyfik-gokdemir-primary\.png"[^>]*alt="Teyfik Gökdemir"/i.test(page.html)) errors.push(`${route}: header logo alt metni veya PNG fallback yanlış.`);
  if ((page.html.match(/\/brand\/teyfik-gokdemir-signature\.webp/g) ?? []).length !== 1) errors.push(`${route}: imza logosu tam bir görünür yerde bulunmalı.`);
  if (!/<img\b[^>]*src="\/brand\/teyfik-gokdemir-signature\.png"[^>]*alt="Teyfik Gökdemir"/i.test(page.html)) errors.push(`${route}: footer imza fallback veya alt metni yanlış.`);
  const marqueeLinks = tags(page.html, 'a').filter((tag) => /\bventure-marquee__item\b/.test(attribute(tag, 'class') ?? ''));
  const marqueeTargets = ['https://ctseg.com.tr', 'https://qctstudio.com', 'https://qctcommerce.com', 'https://mythborn.co'];
  if (marqueeLinks.length !== 8) errors.push(`${route}: marquee iki eş marka grubu içermiyor.`);
  for (const target of marqueeTargets) {
    if (marqueeLinks.filter((tag) => normalizedUrl(attribute(tag, 'href')) === normalizedUrl(target)).length !== 2) errors.push(`${route}: marquee marka hedefi eksik veya yinelenme sayısı yanlış (${target}).`);
  }
  if (marqueeLinks.filter((tag) => attribute(tag, 'tabindex') === '-1').length !== 4) errors.push(`${route}: marquee dekoratif tekrarları klavye sırasından çıkarılmamış.`);
  if ((page.html.match(/class="venture-marquee__group"/g) ?? []).length !== 2 || !/class="venture-marquee__group" aria-hidden="true"/i.test(page.html)) errors.push(`${route}: marquee erişilebilir tekrar grubu yanlış.`);
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
