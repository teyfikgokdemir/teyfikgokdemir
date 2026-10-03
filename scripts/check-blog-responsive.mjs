import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const executablePath = [
  process.env.CHROME_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  'C:\\Users\\teyfi\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1243\\chrome-headless-shell-win64\\chrome-headless-shell.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean).find(existsSync);

if (!executablePath) throw new Error('Chrome/Chromium executable was not found.');

const dist = resolve('dist');
if (!existsSync(dist)) throw new Error('dist/ not found. Run npm run build first.');

const mime = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.webp':'image/webp',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml',
  '.json':'application/json; charset=utf-8',
};

const server = createServer(async (request, response) => {
  const pathname = decodeURI(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
  let file = join(dist, pathname.replace(/^\/+/, ''));
  if (!extname(file)) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise((resolvePromise) => server.listen(4324, '127.0.0.1', resolvePromise));

const routes = [
  { code:'tr', path:'/blog/ai-arama-gorunurlugu-2026-seo-geo-aeo-aio/' },
  { code:'en', path:'/en/blog/ai-search-visibility-2026-seo-geo-aeo-aio/' },
  { code:'ru', path:'/ru/blog/ai-poisk-2026-seo-geo-aeo-aio/' },
  { code:'mk', path:'/mk/blog/ai-prebaruvanje-2026-seo-geo-aeo-aio/' },
  { code:'sr', path:'/sr/blog/ai-pretraga-2026-seo-geo-aeo-aio/' },
  { code:'sq', path:'/sq/blog/ai-search-2026-seo-geo-aeo-aio/' },
  { code:'fa', path:'/fa/blog/جستجوی-ai-2026-seo-geo-aeo-aio/' },
  { code:'zh', path:'/zh/blog/ai搜索可见性-2026-seo-geo-aeo-aio/' },
  { code:'vi', path:'/vi/blog/ai-search-2026-seo-geo-aeo-aio/' },
];

const widths = [390, 1440];
const failures = [];
const results = [];

let browser;
try {
  browser = await chromium.launch({ executablePath, headless:true, args:['--no-sandbox'] });

  for (const route of routes) {
    for (const width of widths) {
      const height = width === 390 ? 844 : 900;
      const page = await browser.newPage({ viewport:{ width, height }, reducedMotion:'reduce' });
      const response = await page.goto(`http://127.0.0.1:4324${route.path}`, { waitUntil:'domcontentloaded' });

      const state = await page.evaluate(({ width, height }) => {
        const h1 = document.querySelector('.article-head h1');
        const head = document.querySelector('.article-head');
        const content = document.querySelector('.article-content');
        const tableWrappers = [...document.querySelectorAll('.article-table-wrapper')];
        const faqItems = document.querySelectorAll('.article-faq-item');
        const h1Rect = h1?.getBoundingClientRect();
        const headRect = head?.getBoundingClientRect();
        return {
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          h1Count: document.querySelectorAll('h1').length,
          h2Count: document.querySelectorAll('.article-content h2').length,
          faqCount: faqItems.length,
          contentWidth: content?.getBoundingClientRect().width ?? 0,
          h1Left: h1Rect?.left ?? 0,
          h1Right: h1Rect?.right ?? 0,
          h1Width: h1Rect?.width ?? 0,
          headHeight: headRect?.height ?? 0,
          headBottom: headRect?.bottom ?? 0,
          tablesContained: tableWrappers.every((el) => el.scrollWidth >= el.clientWidth && el.getBoundingClientRect().right <= width + 1),
          width,
          height,
        };
      }, { width, height });

      const bad =
        response?.status() !== 200 ||
        state.overflow > 1 ||
        state.h1Count !== 1 ||
        state.h2Count < 8 ||
        state.faqCount < 3 ||
        state.contentWidth > 722 ||
        state.h1Left < -1 ||
        state.h1Right > width + 1 ||
        !state.tablesContained ||
        state.headHeight > height;

      if (bad) failures.push(`${route.code}-${width}: ${JSON.stringify(state)}`);
      results.push(`${route.code}-${width}: sections=${state.h2Count}, faq=${state.faqCount}, overflow=${state.overflow}px, hero=${Math.round(state.headHeight)}px`);
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolvePromise) => server.close(resolvePromise));
}

if (failures.length) {
  console.error(`Blog responsive failures (${failures.length}):`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(results.join('\n'));
console.log(`Blog responsive check passed: ${routes.length * widths.length} scenarios across 9 locales.`);
