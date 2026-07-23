import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
let source = await readFile(path, 'utf8');
const legacyAnalytics = `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52GXBGWHFJ"></script>
    <script is:inline>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-52GXBGWHFJ');
    </script>
`;

if (source.includes(legacyAnalytics)) {
  source = source.replace(legacyAnalytics, '');
} else if (source.includes('googletagmanager.com/gtag/js?id=G-52GXBGWHFJ')) {
  throw new Error('Analytics loader exists but did not match the audited block. Refusing an unsafe partial patch.');
}

const alternateNeedle = 'const alternateLinks = alternates ?? defaultAlternates;';
const alternateReplacement = 'const alternateLinks = alternates ?? (pathname ? {} : defaultAlternates);';
if (source.includes(alternateNeedle)) source = source.replace(alternateNeedle, alternateReplacement);

const studioNeedle = `      url: site.links.qctStudio,\n      founder: { '@id': site.origin + '/#person' },`;
const studioReplacement = `      url: site.links.qctStudio,\n      foundingDate: '2025',\n      founder: { '@id': site.origin + '/#person' },`;
if (source.includes(studioNeedle)) source = source.replace(studioNeedle, studioReplacement);

const commerceNeedle = `      url: site.links.qctCommerce,\n      founder: { '@id': site.origin + '/#person' },`;
const commerceReplacement = `      url: site.links.qctCommerce,\n      foundingDate: '2025',\n      founder: { '@id': site.origin + '/#person' },`;
if (source.includes(commerceNeedle)) source = source.replace(commerceNeedle, commerceReplacement);

await writeFile(path, source, 'utf8');
console.log('Applied consent-safe analytics, hreflang and founding-date fixes.');
