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
  if (!['tr', 'en', 'ru', 'mk', 'sr', 'sq', 'fa', 'zh-CN', 'zh', 'vi-VN', 'vi'].includes(lang)) errors.push(`${route}: geçersiz html lang (${lang}).`);
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
  const selfHreflang = page.lang === 'zh-CN' ? 'zh' : page.lang === 'vi-VN' ? 'vi' : page.lang;
  if (!page.alternates.has(selfHreflang)) errors.push(`${page.route}: self hreflang (${selfHreflang}) eksik.`);
  if (!page.alternates.has('x-default')) errors.push(`${page.route}: x-default eksik.`);
  for (const [language, href] of page.alternates) {
    const targetRoute = routeFromUrl(href);
    const target = pageByRoute.get(targetRoute);
    if (!target?.indexable) errors.push(`${page.route}: hreflang hedefi indexlenebilir değil (${language}: ${href}).`);
    const expectedSelfHreflang = target?.lang === 'zh-CN' ? 'zh' : target?.lang === 'vi-VN' ? 'vi' : target?.lang;
    const targetAlternateHref = target?.alternates.get(selfHreflang);
    if (language !== 'x-default' && target && normalizedUrl(targetAlternateHref) !== normalizedUrl(page.canonical)) {
      errors.push(`${page.route}: hreflang karşılığı yok (${language}: ${targetRoute}).`);
    }
  }
}

const faHome = pageByRoute.get('/fa/');
if (!faHome) errors.push('/fa/: sayfa bulunamadı.');
else {
  const requiredPersianFocus = [
    'تأمین روغن آفتابگردان',
    'خشکبار و میوه خشک',
    'مشخصات محصول و کاربرد هدف',
    'COA'
  ];
  for (const text of requiredPersianFocus) if (!faHome.html.includes(text)) errors.push(`/fa/: محتوای تجاری فارسی eksik (${text}).`);
  const expectedFocusLinks = [
    'https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/',
    'https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'
  ];
  const expectedSpecialistLinks = [
    'https://ctseg.com.tr/fa/sourcing/فرش-ایرانی/',
    'https://ctseg.com.tr/fa/sourcing/فرش-ابریشم-دستباف/',
    'https://ctseg.com.tr/fa/sourcing/تامین-عمده-منسوجات/'
  ];
  for (const href of [...expectedFocusLinks, ...expectedSpecialistLinks]) if (!faHome.html.includes(`href="${encodeURI(href)}"`) && !faHome.html.includes(`href="${href}"`)) errors.push(`/fa/: CTSEG bağlantısı eksik (${href}).`);
  if ((faHome.html.match(/data-trade-focus-link=/g) ?? []).length !== 2) errors.push('/fa/: iki ticari odak bağlantısı bekleniyor.');
  if ((faHome.html.match(/data-specialist-link=/g) ?? []).length !== 3) errors.push('/fa/: üç ikincil uzmanlık bağlantısı bekleniyor.');
  if (!/<html\b[^>]*lang="fa"[^>]*dir="rtl"/i.test(faHome.html)) errors.push('/fa/: lang=fa ve dir=rtl eksik.');
  const schemaText = [...faHome.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((match)=>match[1]).join('\n');
  for (const expertise of ['هماهنگی تجاری بین‌المللی','ورود تولیدکنندگان ایرانی به بازار','ارتباط تولیدکننده و خریدار','توسعه کانال فروش']) {
    if (!schemaText.includes(expertise)) errors.push(`/fa/: Person schema expertise eksik (${expertise}).`);
  }
}

const tradeEntryContracts = {
  tr:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/tr/sourcing/iran-halisi/','https://ctseg.com.tr/tr/sourcing/el-dokumasi-ipek-hali/','https://ctseg.com.tr/tr/sourcing/toptan-tekstil-tedariki/']},
  en:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  ru:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  mk:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  sr:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  sq:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  fa:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/fa/sourcing/فرش-ایرانی/','https://ctseg.com.tr/fa/sourcing/فرش-ابریشم-دستباف/','https://ctseg.com.tr/fa/sourcing/تامین-عمده-منسوجات/']},
  zh:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']},
  vi:{focusLinks:['https://ctseg.com.tr/en/insights/vegetable-oil-sourcing-rfq-checklist/','https://ctseg.com.tr/en/insights/nuts-dried-fruit-quality-document-check/'],specialistLinks:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/']}
};
const commercialEvaluationContracts = {
  tr: 'Bu bölüm sonuçlanmış anlaşma, garanti edilen tedarik veya kamuya açıklanmış müşteri listesi değildir.',
  en: 'This section is not a list of concluded agreements, guaranteed supply or publicly disclosed customers.',
  ru: 'Этот раздел не является перечнем заключённых соглашений, гарантированных поставок или публично раскрытых клиентов.',
  mk: 'Овој дел не е листа на склучени договори, гарантирани набавки или јавно објавени клиенти.',
  sr: 'Ovaj odeljak nije lista zaključenih ugovora, garantovanog snabdevanja ili javno objavljenih klijenata.',
  sq: 'Ky seksion nuk është listë marrëveshjesh të përfunduara, furnizimesh të garantuara ose klientësh të publikuar.',
  fa: 'این بخش فهرست قراردادهای نهایی، تأمین تضمین‌شده یا مشتریان اعلام‌شده عمومی نیست.',
  zh: '本部分内容不构成已签署的确定协议、保证供货承诺或公开披露的客户名录。',
  vi: 'Bu bölüm sonuçlanmış anlaşma, garanti edilen tedarik veya kamuya açıklanmış müşteri listesi değildir.'
};
const mythbornContracts = {
  tr:{status:'Aktif girişim',region:'Uluslararası',description:'Tarot, Katina, astroloji ve kişisel keşif deneyimlerini çok dilli dijital bir platformda birleştiren bağımsız tüketici markası.'},
  en:{status:'Active venture',region:'International',description:'An independent multilingual consumer brand bringing together Tarot, Katina, astrology and personal discovery experiences in one digital platform.'},
  ru:{status:'Активный проект',region:'Международный',description:'Независимый потребительский бренд, объединяющий Таро, Катину, астрологию и самопознание на многоязычной цифровой платформе.'},
  mk:{status:'Активен потфат',region:'Меѓународно',description:'Независен повеќејазичен потрошувачки бренд што на една дигитална платформа ги обединува искуствата со тарот, Катина, астрологија и лично самооткривање.'},
  sr:{status:'Aktivan poduhvat',region:'Međunarodno',description:'Nezavisan višejezični potrošački brend koji na jednoj digitalnoj platformi objedinjuje iskustva tarota, Katine, astrologije i ličnog otkrivanja.'},
  sq:{status:'Sipërmarrje aktive',region:'Ndërkombëtare',description:'Një markë e pavarur shumëgjuhëshe për konsumatorët, që bashkon në një platformë digjitale përvoja të Tarotit, Katinës, astrologjisë dhe zbulimit personal.'},
  fa:{status:'برند فعال و مستقل',region:'بین‌المللی',description:'یک برند مستقل و چندزبانه برای تجربه‌های تاروت، کاتینا، طالع‌بینی و خودشناسی در یک پلتفرم دیجیتال.'},
  zh:{status:'在运营项目',region:'全球化',description:'融合塔罗、卡蒂娜、占星与象征符号探索的多语言独立数字产品与消费者品牌。'},
  vi:{status:'Đang hoạt động',region:'Quốc tế',description:'Thương hiệu tiêu dùng số độc lập kết hợp các trải nghiệm Tarot, Katina, chiêm tinh và khám phá cá nhân trên nền tảng kỹ thuật số đa ngôn ngữ.'}
};
const obsoleteMythbornCopy = [
  'Uluslararası pazara yönelik marka, ürün ve dijital ticaret ekosistemi',
  'A new venture in development as a brand, product and digital commerce ecosystem',
  'Нов потфат во развој како екосистем',
  'Novi poduhvat u razvoju kao ekosistem',
  'Sipërmarrje e re në zhvillim si ekosistem',
  'برند و اکوسیستم محصول و تجارت بین‌المللی در حال توسعه'
];
for (const [lang,route] of [['tr','/'],['en','/en/'],['ru','/ru/'],['mk','/mk/'],['sr','/sr/'],['sq','/sq/'],['fa','/fa/'],['vi','/vi/']]) {
  const page = pageByRoute.get(route);
  if (!page) { errors.push(`${route}: locale ana sayfası eksik.`); continue; }
  const tradeContract = tradeEntryContracts[lang];
  if ((page.html.match(/data-trade-focus-link=/g) ?? []).length !== 2) errors.push(`${route}: iki ticari odak CTA bağlantısı bekleniyor.`);
  if ((page.html.match(/data-specialist-link=/g) ?? []).length !== 3) errors.push(`${route}: üç ikincil uzmanlık CTA bağlantısı bekleniyor.`);
  for (const href of [...tradeContract.focusLinks, ...tradeContract.specialistLinks]) if (!page.html.includes(`href="${encodeURI(href)}"`) && !page.html.includes(`href="${href}"`)) errors.push(`${route}: ticari CTA hedefi eksik (${href}).`);
  for (const image of ['/images/ctseg-vegetable-oils-food-editorial.webp','/images/ctseg-iranian-pistachios-premium.webp']) if (!page.html.includes(image)) errors.push(`${route}: ticari odak görseli eksik (${image}).`);
  if (!page.html.includes('data-commercial-evaluations')) errors.push(`${route}: devam eden ticari değerlendirmeler bölümü eksik.`);
  if ((page.html.match(/data-commercial-evaluation(?=\s|=|>)/g) ?? []).length !== 5) errors.push(`${route}: beş anonim ticari değerlendirme kartı bekleniyor.`);
  if (!page.html.includes('data-commercial-disclaimer') || !page.html.includes(commercialEvaluationContracts[lang])) errors.push(`${route}: ticari gizlilik notu eksik.`);
  if (route === '/' && /120[.,]000|100\s*ton|Güney Kore|İspanya/i.test(page.html)) errors.push(`${route}: hassas ticari ayrıntı kamuya açık metne sızmış.`);
  const mythbornContract = mythbornContracts[lang];
  for (const expected of [mythbornContract.status,mythbornContract.region,mythbornContract.description]) if (!page.html.includes(expected)) errors.push(`${route}: Mythborn yerelleştirmesi eksik (${expected}).`);
  if (!page.html.includes('href="https://mythborn.co/"')) errors.push(`${route}: Mythborn kartı canlı trailing-slash hedefini kullanmıyor.`);
  for (const obsolete of obsoleteMythbornCopy) if (page.html.includes(obsolete)) errors.push(`${route}: eski Mythborn konumlandırması hâlâ görünüyor (${obsolete}).`);
  const localeLinks = tags(page.html,'a').filter((tag)=>attribute(tag,'hreflang') && ['tr','en','ru','mk','sr','sq','fa'].includes(attribute(tag,'hreflang')));
  if (localeLinks.length < 7) errors.push(`${route}: global dil menüsü yedi dili göstermiyor.`);
  for (const code of ['tr','en','ru','mk','sr','sq','fa']) {
    const link = localeLinks.find((tag)=>attribute(tag,'hreflang')===code);
    if (routeFromUrl(attribute(link,'href')) !== (code === 'tr' ? '/' : `/${code}/`)) errors.push(`${route}: ${code} locale hedefi yanlış.`);
    if ((code===lang) !== (attribute(link,'aria-current')==='page')) errors.push(`${route}: ${code} aktif locale durumu yanlış.`);
  }
  if (!new RegExp(`<a\\b[^>]*class="brand"[^>]*href="${route}"[^>]*aria-label="Teyfik Gökdemir"`, 'i').test(page.html)) errors.push(`${route}: header logo bağlantısı locale ana sayfasına gitmiyor.`);
  if (!page.html.includes('/brand/teyfik-gokdemir-primary.webp') || !page.html.includes('/brand/teyfik-gokdemir-monogram.webp')) errors.push(`${route}: responsive kişisel marka kaynakları eksik.`);
  if (!/<img\b[^>]*src="\/brand\/teyfik-gokdemir-primary\.png"[^>]*alt="Teyfik Gökdemir"/i.test(page.html)) errors.push(`${route}: header logo alt metni veya PNG fallback yanlış.`);
  if ((page.html.match(/\/brand\/teyfik-gokdemir-signature\.webp/g) ?? []).length !== 1) errors.push(`${route}: imza logosu tam bir görünür yerde bulunmalı.`);
  if (!/<img\b[^>]*src="\/brand\/teyfik-gokdemir-signature\.png"[^>]*alt="Teyfik Gökdemir"/i.test(page.html)) errors.push(`${route}: footer imza fallback veya alt metni yanlış.`);
  const marqueeLinks = tags(page.html, 'a').filter((tag) => /\bventure-marquee__item\b/.test(attribute(tag, 'class') ?? ''));
  const marqueeTargets = ['https://ctseg.com.tr', 'https://qctstudio.com', 'https://qctcommerce.com', 'https://mythborn.co/'];
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
