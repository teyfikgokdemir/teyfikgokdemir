import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const expectedPageCount = 20;
const expectedLanguages = [
  'en',
  'tr',
  'sq',
  'mk',
  'sr',
  'x-default',
];

const errors = [];
const warnings = [];

const normalizeSlashes = (value) =>
  value.replaceAll('\\', '/');

const decodeHtml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const stripTags = (value) =>
  decodeHtml(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const collectFiles = (directory, filename) => {
  const files = [];

  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath, filename));
    } else if (entry.name === filename) {
      files.push(absolutePath);
    }
  }

  return files;
};

const htmlFiles = collectFiles(distDir, 'index.html');

if (htmlFiles.length !== expectedPageCount) {
  errors.push(
    `Beklenen ${expectedPageCount} sayfa yerine ` +
    `${htmlFiles.length} sayfa bulundu.`
  );
}

const routeFromFile = (filePath) => {
  const relative = normalizeSlashes(
    path.relative(distDir, filePath)
  );

  if (relative === 'index.html') {
    return '/';
  }

  return `/${relative.replace(/\/index\.html$/, '/')}`;
};

const routeToFile = (route) => {
  let pathname = route;

  try {
    pathname = new URL(
      route,
      'https://teyfikgokdemir.com'
    ).pathname;
  } catch {
    return null;
  }

  if (pathname === '/') {
    return path.join(distDir, 'index.html');
  }

  const cleanPath = pathname
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return path.join(distDir, cleanPath, 'index.html');
};

const canonicalValues = new Map();

for (const filePath of htmlFiles) {
  const route = routeFromFile(filePath);
  const html = fs.readFileSync(filePath, 'utf8');

  const titleMatches = [
    ...html.matchAll(/<title>([\s\S]*?)<\/title>/gi),
  ];

  if (titleMatches.length !== 1) {
    errors.push(
      `${route}: ${titleMatches.length} adet title bulundu.`
    );
  } else {
    const title = stripTags(titleMatches[0][1]);

    if (title.length < 20 || title.length > 70) {
      warnings.push(
        `${route}: title uzunluğu ${title.length} karakter.`
      );
    }
  }

  const descriptionMatches = [
    ...html.matchAll(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/gi
    ),
  ];

  if (descriptionMatches.length !== 1) {
    errors.push(
      `${route}: ${descriptionMatches.length} adet ` +
      `meta description bulundu.`
    );
  } else {
    const description = decodeHtml(
      descriptionMatches[0][1]
    ).trim();

    if (
      description.length < 70 ||
      description.length > 180
    ) {
      warnings.push(
        `${route}: description uzunluğu ` +
        `${description.length} karakter.`
      );
    }
  }

  const canonicalMatches = [
    ...html.matchAll(
      /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi
    ),
  ];

  if (canonicalMatches.length !== 1) {
    errors.push(
      `${route}: ${canonicalMatches.length} adet canonical bulundu.`
    );
  } else {
    const canonical = canonicalMatches[0][1];

    if (!canonical.startsWith(
      'https://teyfikgokdemir.com/'
    )) {
      errors.push(
        `${route}: geçersiz canonical: ${canonical}`
      );
    }

    if (canonicalValues.has(canonical)) {
      errors.push(
        `${route}: canonical başka sayfada da kullanılıyor: ` +
        `${canonical}`
      );
    }

    canonicalValues.set(canonical, route);
  }

  const h1Matches = [
    ...html.matchAll(/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi),
  ];

  if (h1Matches.length !== 1) {
    errors.push(
      `${route}: ${h1Matches.length} adet H1 bulundu.`
    );
  }

  const htmlLangMatch = html.match(
    /<html\s+[^>]*lang=["']([^"']+)["']/i
  );

  if (!htmlLangMatch) {
    errors.push(`${route}: html lang bulunamadı.`);
  }

  const alternateMatches = [
    ...html.matchAll(
      /<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["'][^>]*>/gi
    ),
  ];

  const alternateMap = new Map(
    alternateMatches.map((match) => [
      match[1],
      match[2],
    ])
  );

  for (const language of expectedLanguages) {
    if (!alternateMap.has(language)) {
      errors.push(
        `${route}: hreflang eksik: ${language}`
      );
    }
  }

  const jsonLdMatches = [
    ...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  if (jsonLdMatches.length === 0) {
    errors.push(`${route}: JSON-LD bulunamadı.`);
  }

  jsonLdMatches.forEach((match, index) => {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(
        `${route}: JSON-LD ${index + 1} geçersiz JSON: ` +
        `${error.message}`
      );
    }
  });

  const hrefMatches = [
    ...html.matchAll(
      /<a\s+[^>]*href=["']([^"'#][^"']*)["'][^>]*>/gi
    ),
  ];

  for (const match of hrefMatches) {
    const href = decodeHtml(match[1]).trim();

    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('https://wa.me/') ||
      href.startsWith('http://') ||
      href.startsWith('https://')
    ) {
      continue;
    }

    if (!href.startsWith('/')) {
      continue;
    }

    const internalFile = routeToFile(href);

    if (!internalFile || !fs.existsSync(internalFile)) {
      errors.push(
        `${route}: kırık iç bağlantı: ${href}`
      );
    }
  }
}

const sitemapPath = path.join(
  distDir,
  'sitemap.xml'
);

if (!fs.existsSync(sitemapPath)) {
  errors.push('dist/sitemap.xml bulunamadı.');
} else {
  const sitemap = fs.readFileSync(
    sitemapPath,
    'utf8'
  );

  const locations = [
    ...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((match) => match[1].trim());

  if (locations.length !== expectedPageCount) {
    errors.push(
      `Sitemap içinde ${locations.length} URL var; ` +
      `${expectedPageCount} bekleniyordu.`
    );
  }

  const uniqueLocations = new Set(locations);

  if (uniqueLocations.size !== locations.length) {
    errors.push(
      'Sitemap içinde yinelenen URL bulundu.'
    );
  }

  for (const location of locations) {
    const builtFile = routeToFile(location);

    if (!builtFile || !fs.existsSync(builtFile)) {
      errors.push(
        `Sitemap URL'sinin build çıktısı yok: ${location}`
      );
    }
  }

  for (const canonical of canonicalValues.keys()) {
    if (!uniqueLocations.has(canonical)) {
      errors.push(
        `Canonical sitemap içinde bulunmuyor: ${canonical}`
      );
    }
  }
}

const robotsPath = path.join(
  distDir,
  'robots.txt'
);

if (!fs.existsSync(robotsPath)) {
  errors.push('dist/robots.txt bulunamadı.');
} else {
  const robots = fs.readFileSync(
    robotsPath,
    'utf8'
  );

  if (!robots.includes(
    'Sitemap: https://teyfikgokdemir.com/sitemap.xml'
  )) {
    errors.push(
      'robots.txt içinde doğru sitemap adresi yok.'
    );
  }
}

const llmsPath = path.join(
  distDir,
  'llms.txt'
);

if (!fs.existsSync(llmsPath)) {
  errors.push('dist/llms.txt bulunamadı.');
} else {
  const llms = fs.readFileSync(
    llmsPath,
    'utf8'
  );

  const requiredLlmsUrls = [
    '/',
    '/ai-search-visibility/',
    '/tr/yapay-zeka-arama-gorunurlugu/',
    '/sq/dukshmeria-ne-kerkimin-ai/',
    '/mk/vidlivost-vo-ai-prebaruvanje/',
    '/sr/vidljivost-u-ai-pretrazi/',
    '/blog/',
    '/tr/blog/',
    '/sq/blog/',
    '/mk/blog/',
    '/sr/blog/',
    '/blog/seo-vs-geo-vs-aeo-vs-aio/',
    '/tr/blog/seo-geo-aeo-aio-farklari/',
    '/sq/blog/dallimet-seo-geo-aeo-aio/',
    '/mk/blog/razliki-seo-geo-aeo-aio/',
    '/sr/blog/razlike-seo-geo-aeo-aio/',
    '/sitemap.xml',
    '/robots.txt',
    '/llms.txt',
  ];

  for (const route of requiredLlmsUrls) {
    if (!llms.includes(
      `https://teyfikgokdemir.com${route}`
    )) {
      errors.push(
        `llms.txt içinde URL eksik: ${route}`
      );
    }
  }
}

console.log('');
console.log('QCT / Teyfik Gökdemir Build Audit');
console.log('----------------------------------');
console.log(`Sayfa sayısı: ${htmlFiles.length}`);
console.log(`Canonical sayısı: ${canonicalValues.size}`);
console.log(`Uyarı sayısı: ${warnings.length}`);
console.log(`Hata sayısı: ${errors.length}`);

if (warnings.length > 0) {
  console.log('');
  console.log('Uyarılar:');

  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('');
  console.error('Hatalar:');

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log('');
console.log(
  'BAŞARILI: 20 sayfa, sitemap, hreflang, schema, ' +
  'canonical ve iç bağlantılar doğrulandı.'
);