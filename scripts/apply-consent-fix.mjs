import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const source = await readFile(path, 'utf8');
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
  await writeFile(path, source.replace(legacyAnalytics, ''), 'utf8');
  console.log('Removed pre-consent Google Analytics loader from BaseLayout.');
} else if (source.includes('googletagmanager.com/gtag/js?id=G-52GXBGWHFJ')) {
  throw new Error('Analytics loader exists but did not match the audited block. Refusing an unsafe partial patch.');
} else {
  console.log('Pre-consent Google Analytics loader is already absent.');
}
