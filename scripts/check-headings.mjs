import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const executablePath = [
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!executablePath) throw new Error('Chrome/Chromium/Edge executable was not found.');
const dist = resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const p = decodeURI(new URL(req.url ?? '/', 'http://x').pathname);
  let file = join(dist, p.replace(/^\/+/, ''));
  if (!extname(file)) file = join(file, 'index.html');
  try { const b = await readFile(file); res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath });
const locales = ['tr', 'en', 'ru', 'mk', 'sr', 'sq', 'fa', 'zh', 'vi'];
const widths = [320, 390, 768, 1024, 1280, 1440, 1920];
const paths = (l) => [l === 'tr' ? '/' : `/${l}/`, l === 'tr' ? '/blog/' : `/${l}/blog/`];
const failures = [];
for (const l of locales) for (const w of widths) for (const path of paths(l)) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(base + path, { waitUntil: 'load' });
  const bad = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('h1,h2,h3').forEach((h) => {
      const cs = getComputedStyle(h); if (cs.display === 'none' || !h.offsetParent) return;
      const box = h.getBoundingClientRect();
      const r = document.createRange(); r.selectNodeContents(h);
      const tr = [...r.getClientRects()].reduce((a, x) => ({ l: Math.min(a.l, x.left), r: Math.max(a.r, x.right) }), { l: 1e9, r: -1e9 });
      const text = h.textContent.trim().slice(0, 40);
      if (tr.r > box.right + 2 || tr.l < box.left - 2 || tr.r > innerWidth + 1) out.push(`${h.tagName} text exceeds box: ${text}`);
      const sib = h.parentElement?.nextElementSibling;
      if (sib && h.closest('.section-ledger-head')) {
        const s = sib.getBoundingClientRect();
        if (tr.r > s.left + 1 && box.bottom > s.top && box.top < s.bottom && s.width > 0 && s.left > box.left) out.push(`H2 overlaps lead: ${text}`);
      }
    });
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page horizontal overflow');
    return out;
  });
  bad.forEach((b) => failures.push(`${l} ${w} ${path}: ${b}`));
  await page.close();
}
await browser.close(); server.close();
if (failures.length) { console.error(failures.slice(0, 40).join('\n')); console.error(`${failures.length} heading issue(s)`); process.exit(1); }
console.log(`Heading layout check passed: ${locales.length} locales x ${widths.length} widths x 2 pages.`);
