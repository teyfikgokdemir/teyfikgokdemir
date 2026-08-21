import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const origin = 'https://teyfikgokdemir.com';

if (!fs.existsSync(dist)) {
  throw new Error('dist/ bulunamadı. Önce npm run build çalıştırın.');
}

const htmlFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name === 'index.html') htmlFiles.push(target);
  }
};
walk(dist);

const routeFor = (file) => {
  const relative = path.relative(dist, path.dirname(file)).split(path.sep).join('/');
  return relative ? `/${relative}/` : '/';
};
const attr = (tag, name) => tag?.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
const redirectSource = new Set(['/tr/']);
const pages = [];

for (const file of htmlFiles) {
  const route = routeFor(file);
  const html = fs.readFileSync(file, 'utf8');
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const robots = attr(metaTags.find((tag) => attr(tag, 'name')?.toLowerCase() === 'robots'), 'content') ?? '';
  if (redirectSource.has(route) || /noindex/i.test(robots)) continue;
  const canonicalTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) ?? [])[0];
  const canonical = canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (!canonical) throw new Error(`${route}: canonical bulunamadı.`);
  pages.push({ route, canonical });
}

pages.sort((a, b) => a.canonical.localeCompare(b.canonical, 'en'));
const xmlEscape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(({ canonical }) => `  <url><loc>${xmlEscape(canonical)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(dist, 'sitemap-index.xml'), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  `  <sitemap><loc>${origin}/sitemap.xml</loc></sitemap>`,
  '</sitemapindex>',
  '',
].join('\n'), 'utf8');
const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${origin}/sitemap.xml</loc></sitemap>`,
    '</sitemapindex>',
    '',
  ].join('\n'), 'utf8');
}

const manualRedirects = fs.existsSync(path.join(root, 'public', '_redirects'))
  ? fs.readFileSync(path.join(root, 'public', '_redirects'), 'utf8').trim().split(/\r?\n/).filter(Boolean)
  : [];
const slashRedirects = pages
  .filter(({ route }) => route !== '/')
  .map(({ route }) => `${encodeURI(route.slice(0, -1))} ${encodeURI(route)} 301`);
fs.writeFileSync(path.join(dist, '_redirects'), [...new Set([...manualRedirects, ...slashRedirects]), ''].join('\n'), 'utf8');

console.log(`SEO artifacts: ${pages.length} indexlenebilir URL, ${slashRedirects.length + manualRedirects.length} kalıcı yönlendirme.`);
