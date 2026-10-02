import fs from 'node:fs';

const blog = fs.readFileSync('src/data/blog.ts', 'utf8');
const longform = fs.readFileSync('src/data/blog-longform.ts', 'utf8');

const locales = ['tr','en','ru','mk','sr','sq','fa','zh','vi'];
const slugs = [
  'chatgpt-ads-2026-ai-native-reklamcilik',
  'agentic-ai-operasyonlari-2026',
  'ai-arama-gorunurlugu-2026-seo-geo-aeo-aio',
  'whatsapp-commerce-2026-mesajdan-siparise',
  'tedarik-stratejisi-2026-coklu-kaynak',
  'landed-cost-2026-gumruk-tarife-marj',
  'nearshoring-balkanlar-turkiye-2026',
  'cross-border-ecommerce-2026-operasyon-sistemi',
  'first-party-measurement-2026-ga4-server-side-ai',
  'b2b-dijital-guven-supplier-verification-rfq',
];

const errors = [];

function sliceObject(source, marker, nextMarkers) {
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const next = nextMarkers
    .map((m) => source.indexOf(m, start + marker.length))
    .filter((i) => i > start);
  const end = next.length ? Math.min(...next) : source.length;
  return source.slice(start, end);
}

for (const slug of slugs) {
  const blogBlock = sliceObject(
    blog,
    `slug: '${slug}'`,
    slugs.filter((s) => s !== slug).map((s) => `slug: '${s}'`),
  );
  const longBlock = sliceObject(
    longform,
    `'${slug}': {`,
    slugs.filter((s) => s !== slug).map((s) => `'${s}': {`),
  );

  if (!blogBlock) {
    errors.push(`Missing trend article: ${slug}`);
    continue;
  }
  if (!longBlock) {
    errors.push(`Missing long-form layer: ${slug}`);
    continue;
  }

  for (const locale of locales) {
    if (!blogBlock.includes(`'${locale}'`) && !blogBlock.includes(`${locale}:`)) {
      errors.push(`${slug}: missing locale ${locale} in base article`);
    }
    if (!longBlock.includes(`${locale}:`)) {
      errors.push(`${slug}: missing long-form locale ${locale}`);
      continue;
    }

    const localeStart = longBlock.indexOf(`${locale}:`);
    const nextLocale = locales
      .filter((l) => l !== locale)
      .map((l) => longBlock.indexOf(`${l}:`, localeStart + locale.length + 1))
      .filter((i) => i > localeStart);
    const localeEnd = nextLocale.length ? Math.min(...nextLocale) : longBlock.length;
    const localeBlock = longBlock.slice(localeStart, localeEnd);

    const headingCount = (localeBlock.match(/["']?heading["']?\s*:/g) || []).length;
    if (headingCount < 4) {
      errors.push(`${slug}/${locale}: expected at least 4 long-form sections, found ${headingCount}`);
    }
    if (!/["']?faq["']?\s*:/.test(localeBlock)) {
      errors.push(`${slug}/${locale}: missing FAQ section`);
    }
    if (!/["']?table["']?\s*:/.test(localeBlock)) {
      errors.push(`${slug}/${locale}: missing decision/measurement table`);
    }
  }

  for (const locale of locales.filter((l) => l !== 'tr')) {
    if (!blogBlock.includes(`${locale}:`) || !blogBlock.includes('slugs:')) {
      errors.push(`${slug}: missing localized slug metadata for ${locale}`);
    }
  }
}

if (errors.length) {
  console.error('\nTrend blog parity audit failed:\n');
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Trend blog parity audit passed: ${slugs.length} topics × ${locales.length} locales, long-form + FAQ + table coverage complete.`,
);
