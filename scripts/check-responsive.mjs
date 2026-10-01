import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const executablePath = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);

if (!executablePath) throw new Error('Chrome/Chromium/Edge executable was not found.');

const dist = resolve('dist');
if (!existsSync(dist)) throw new Error('dist/ not found. Run npm run build first.');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
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

await new Promise((resolvePromise) => server.listen(4323, '127.0.0.1', resolvePromise));

const locales = [
  { code: 'tr', lang: 'tr', dir: 'ltr', path: '/' },
  { code: 'en', lang: 'en', dir: 'ltr', path: '/en/' },
  { code: 'ru', lang: 'ru', dir: 'ltr', path: '/ru/' },
  { code: 'mk', lang: 'mk', dir: 'ltr', path: '/mk/' },
  { code: 'sr', lang: 'sr', dir: 'ltr', path: '/sr/' },
  { code: 'sq', lang: 'sq', dir: 'ltr', path: '/sq/' },
  { code: 'fa', lang: 'fa', dir: 'rtl', path: '/fa/' },
  { code: 'zh', lang: 'zh-CN', dir: 'ltr', path: '/zh/' },
  { code: 'vi', lang: 'vi-VN', dir: 'ltr', path: '/vi/' },
];
const widths = [320, 390, 768, 1024, 1440];
const failures = [];
const results = [];

let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });

  for (const locale of locales) {
    for (const width of widths) {
      const page = await browser.newPage({
        viewport: { width, height: width <= 390 ? 900 : 1000 },
        reducedMotion: 'reduce',
      });

      const response = await page.goto(`http://127.0.0.1:4323${locale.path}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.hero-media img').evaluate((img) =>
        img.complete ? true : new Promise((resolvePromise) => img.addEventListener('load', () => resolvePromise(true), { once: true }))
      );

      const state = await page.evaluate(({ expectedLang, expectedDir, width }) => {
        const box = (selector) => document.querySelector(selector)?.getBoundingClientRect();
        const visible = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const headings = [...document.querySelectorAll('h1,h2')].map((el) => {
          const rect = el.getBoundingClientRect();
          return { text: el.textContent?.trim().slice(0, 80), left: rect.left, right: rect.right, width: rect.width };
        });
        const heroImage = document.querySelector('.hero-media img');
        const links = [...document.querySelectorAll('.core-card')].map((el) => el.href);
        const rootDirection = getComputedStyle(document.documentElement).direction;
        const bodyDirection = getComputedStyle(document.body).direction;
        return {
          ready: document.readyState === 'complete' || document.readyState === 'interactive',
          lang: document.documentElement.lang,
          dir: document.documentElement.dir || 'ltr',
          rootDirection,
          bodyDirection,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          h1Count: document.querySelectorAll('h1').length,
          headings,
          headerVisible: visible('.site-header'),
          footerVisible: visible('.tg-footer'),
          heroVisible: visible('.hero'),
          heroImageLoaded: Boolean(heroImage?.complete && heroImage.naturalWidth > 0),
          heroImageBox: box('.hero-media img'),
          coreCards: document.querySelectorAll('.core-card').length,
          assetCards: document.querySelectorAll('.asset-card').length,
          collabCards: document.querySelectorAll('.collab-card').length,
          methodSteps: document.querySelectorAll('.method-grid > li').length,
          contactLinks: document.querySelectorAll('.contact-links > a').length,
          coreLinks: links,
          mobileToggleVisible: visible('[data-menu-toggle]'),
          desktopNavVisible: visible('.desktop-nav'),
          expectedLang,
          expectedDir,
          width,
        };
      }, { expectedLang: locale.lang, expectedDir: locale.dir, width });

      const headingOverflow = state.headings.some((item) => item.left < -1 || item.right > width + 1 || item.width > width + 2);
      const expectedCoreLinks = ['https://qctstudio.com/', 'https://qctcommerce.com/', 'https://ctseg.com.tr/'];
      const coreLinksOk = expectedCoreLinks.every((url) => state.coreLinks.includes(url));
      const mobile = width <= 900;

      const bad =
        response?.status() !== 200 ||
        !state.ready ||
        state.lang !== locale.lang ||
        state.dir !== locale.dir ||
        state.rootDirection !== locale.dir ||
        state.bodyDirection !== locale.dir ||
        state.overflow > 1 ||
        state.h1Count !== 1 ||
        headingOverflow ||
        !state.headerVisible ||
        !state.footerVisible ||
        !state.heroVisible ||
        !state.heroImageLoaded ||
        !state.heroImageBox?.height ||
        state.coreCards !== 3 ||
        state.assetCards !== 2 ||
        state.collabCards !== 1 ||
        state.methodSteps !== 4 ||
        state.contactLinks !== 3 ||
        !coreLinksOk ||
        (mobile ? !state.mobileToggleVisible || state.desktopNavVisible : state.mobileToggleVisible || !state.desktopNavVisible);

      if (bad) failures.push(`${locale.code}-${width}: ${JSON.stringify(state)}`);

      if (mobile) {
        await page.locator('[data-menu-toggle]').click();
        const openState = await page.evaluate(() => {
          const menu = document.querySelector('[data-mobile-menu]');
          const button = document.querySelector('[data-menu-toggle]');
          if (!(menu instanceof HTMLElement) || !(button instanceof HTMLElement)) return { visible: false, expanded: false, locked: false };
          const rect = menu.getBoundingClientRect();
          return {
            visible: !menu.hidden && rect.width > 0 && rect.height > 0,
            expanded: button.getAttribute('aria-expanded') === 'true',
            locked: document.documentElement.classList.contains('menu-open'),
          };
        });
        if (!openState.visible || !openState.expanded || !openState.locked) {
          failures.push(`${locale.code}-${width}: mobile menu did not open correctly ${JSON.stringify(openState)}`);
        }
        await page.locator('[data-mobile-close]').click();
        const closed = await page.evaluate(() => {
          const menu = document.querySelector('[data-mobile-menu]');
          return Boolean(menu?.hasAttribute('hidden')) && !document.documentElement.classList.contains('menu-open');
        });
        if (!closed) failures.push(`${locale.code}-${width}: mobile menu did not close correctly`);
      }

      results.push(`${locale.code}-${width}: overflow=${state.overflow}px, cards=${state.coreCards}/${state.assetCards}, dir=${state.dir}`);
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolvePromise) => server.close(resolvePromise));
}

if (failures.length) {
  console.error(`Responsive regression failures (${failures.length}):`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(results.join('\n'));
console.log(`Responsive regression passed: ${locales.length * widths.length} scenarios across 9 locales and 5 viewport widths.`);
