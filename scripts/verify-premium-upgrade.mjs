import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const pages = [
  ['tr', 'index.html'],
  ['en', 'en/index.html'],
  ['ru', 'ru/index.html'],
  ['mk', 'mk/index.html'],
  ['sr', 'sr/index.html'],
  ['sq', 'sq/index.html'],
  ['fa', 'fa/index.html'],
  ['zh-CN', 'zh/index.html'],
  ['vi-VN', 'vi/index.html'],
];
const failures = [];
const ecosystem = ['QCT Studio','QCT Commerce','CTSEG','Growth OS','Mythborn','Olivon'];

for (const [locale, relative] of pages) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { failures.push(`${locale}: homepage missing`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const h1Count = (html.match(/<h1\b/g) || []).length;
  const required = [
    'personal-home',
    'core-grid',
    'asset-stack',
    'collab-card',
    'rel="canonical"',
    `lang="${locale}"`,
    ...ecosystem,
  ];
  for (const marker of required) if (!html.includes(marker)) failures.push(`${locale}: missing ${marker}`);
  if (h1Count !== 1) failures.push(`${locale}: expected 1 h1, found ${h1Count}`);
  if (/ctseg-iranian-pistachios-premium|ctseg-iranian-carpets-editorial|data-trade-focus-link/.test(html)) failures.push(`${locale}: legacy product-led homepage content still present`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Premium ecosystem checks passed for ${pages.length} localized homepages.`);
