import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const executablePath = ['/usr/bin/chromium', '/usr/bin/google-chrome'].find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('Chrome or Chromium executable was not found.');

const dist = resolve('dist');
const server = createServer(async (request, response) => {
  const pathname = decodeURI(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
  let file = join(dist, pathname.replace(/^\/+/, ''));
  if (!extname(file)) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    const extension = extname(file);
    const type = extension === '.html' ? 'text/html; charset=utf-8' : extension === '.css' ? 'text/css' : 'application/octet-stream';
    response.writeHead(200, { 'content-type': type });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((resolvePromise) => server.listen(4324, '127.0.0.1', resolvePromise));

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 1100 },
];
const failures = [];
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
    await page.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });
    await page.locator('.venture-marquee').scrollIntoViewIfNeeded();
    const result = await page.evaluate(async () => {
      const root = document.querySelector('.venture-marquee');
      const track = document.querySelector('.venture-marquee__track');
      const style = getComputedStyle(track);
      const first = style.transform;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1200));
      const secondStyle = getComputedStyle(track);
      return {
        width: innerWidth,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        animationName: secondStyle.animationName,
        animationDuration: secondStyle.animationDuration,
        animationPlayState: secondStyle.animationPlayState,
        transformBefore: first,
        transformAfter: secondStyle.transform,
        moved: first !== secondStyle.transform,
        rootWidth: root.getBoundingClientRect().width,
        rootScrollWidth: root.scrollWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        trackWidth: track.getBoundingClientRect().width,
        groupCount: document.querySelectorAll('.venture-marquee__group').length,
        linkCount: document.querySelectorAll('.venture-marquee__item').length,
      };
    });
    console.log(`${viewport.name}: ${JSON.stringify(result)}`);
    if (result.reducedMotion || result.animationName !== 'ventureMarqueeFlow' || result.animationPlayState !== 'running' || !result.moved || result.documentScrollWidth !== result.width || result.groupCount !== 2 || result.linkCount !== 8) {
      failures.push(`${viewport.name}: ${JSON.stringify(result)}`);
    }
    await page.close();
  }

  const reducedPage = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reducedPage.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });
  const reduced = await reducedPage.evaluate(() => {
    const track = document.querySelector('.venture-marquee__track');
    const hiddenGroup = document.querySelector('.venture-marquee__group[aria-hidden="true"]');
    const style = getComputedStyle(track);
    return { animationName: style.animationName, animationPlayState: style.animationPlayState, hiddenGroupDisplay: getComputedStyle(hiddenGroup).display, trackWidth: track.getBoundingClientRect().width, viewportWidth: innerWidth };
  });
  console.log(`reduced-motion: ${JSON.stringify(reduced)}`);
  if (reduced.animationName !== 'none' || reduced.hiddenGroupDisplay === 'none' && reduced.trackWidth !== reduced.viewportWidth) failures.push(`reduced-motion: ${JSON.stringify(reduced)}`);
  await reducedPage.close();
} finally {
  await browser?.close();
  await new Promise((resolvePromise) => server.close(resolvePromise));
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Marquee motion check passed: mobile, tablet and desktop animate; reduced-motion fallback remains static.');
