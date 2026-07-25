import { readFile, writeFile } from 'node:fs/promises';

const files = [
  'src/pages/ai-search-visibility.astro',
  'src/pages/tr/yapay-zeka-arama-gorunurlugu.astro',
  'src/pages/sq/dukshmeria-ne-kerkimin-ai.astro',
  'src/pages/mk/vidlivost-vo-ai-prebaruvanje.astro',
  'src/pages/sr/vidljivost-u-ai-pretrazi.astro',
];

const faLine = "  fa: site.origin + '/fa/مشاهده-پذیری-در-جستجوی-هوش-مصنوعی/',";

for (const file of files) {
  let source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  if (!source.includes(faLine)) {
    const needle = "  sr: site.origin + '/sr/vidljivost-u-ai-pretrazi/',";
    if (!source.includes(needle)) throw new Error(`Alternate insertion point missing in ${file}`);
    source = source.replace(needle, `${needle}\n${faLine}`);
    await writeFile(new URL(`../${file}`, import.meta.url), source, 'utf8');
  }
}

const sitemapPath = new URL('../public/sitemap.xml', import.meta.url);
let sitemap = await readFile(sitemapPath, 'utf8');
const faUrl = 'https://teyfikgokdemir.com/fa/مشاهده-پذیری-در-جستجوی-هوش-مصنوعی/';

if (!sitemap.includes(`<loc>${faUrl}</loc>`)) {
  const close = '</urlset>';
  const entry = `  <url>\n    <loc>${faUrl}</loc>\n    <lastmod>2026-07-25</lastmod>\n    <priority>0.9</priority>\n    <xhtml:link rel="alternate" hreflang="en" href="https://teyfikgokdemir.com/ai-search-visibility/" />\n    <xhtml:link rel="alternate" hreflang="tr" href="https://teyfikgokdemir.com/tr/yapay-zeka-arama-gorunurlugu/" />\n    <xhtml:link rel="alternate" hreflang="sq" href="https://teyfikgokdemir.com/sq/dukshmeria-ne-kerkimin-ai/" />\n    <xhtml:link rel="alternate" hreflang="mk" href="https://teyfikgokdemir.com/mk/vidlivost-vo-ai-prebaruvanje/" />\n    <xhtml:link rel="alternate" hreflang="sr" href="https://teyfikgokdemir.com/sr/vidljivost-u-ai-pretrazi/" />\n    <xhtml:link rel="alternate" hreflang="fa" href="${faUrl}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="https://teyfikgokdemir.com/ai-search-visibility/" />\n  </url>\n`;
  if (!sitemap.includes(close)) throw new Error('sitemap.xml is missing </urlset>');
  sitemap = sitemap.replace(close, `${entry}${close}`);
}

const aiPaths = [
  'https://teyfikgokdemir.com/ai-search-visibility/',
  'https://teyfikgokdemir.com/tr/yapay-zeka-arama-gorunurlugu/',
  'https://teyfikgokdemir.com/sq/dukshmeria-ne-kerkimin-ai/',
  'https://teyfikgokdemir.com/mk/vidlivost-vo-ai-prebaruvanje/',
  'https://teyfikgokdemir.com/sr/vidljivost-u-ai-pretrazi/',
];
for (const loc of aiPaths) {
  const marker = `<loc>${loc}</loc>`;
  const start = sitemap.indexOf(marker);
  if (start < 0) continue;
  const end = sitemap.indexOf('</url>', start);
  const block = sitemap.slice(start, end);
  if (!block.includes('hreflang="fa"')) {
    const updated = block.replace(
      '<xhtml:link rel="alternate" hreflang="x-default"',
      `<xhtml:link rel="alternate" hreflang="fa" href="${faUrl}" />\n    <xhtml:link rel="alternate" hreflang="x-default"`,
    );
    sitemap = sitemap.slice(0, start) + updated + sitemap.slice(end);
  }
}

await writeFile(sitemapPath, sitemap, 'utf8');
console.log('Connected Persian AI visibility page, hreflang and sitemap entries.');
