import { readFile, writeFile } from 'node:fs/promises';

const footerPath = new URL('../src/components/Footer.astro', import.meta.url);
let source = await readFile(footerPath, 'utf8');

source = source.replace(
  /\n\s*<div class="premium-footer__marquee"[\s\S]*?<div class="premium-footer__bottom">/,
  '\n\n  <div class="premium-footer__bottom">'
);

source = source.replace(
  /\n\s*\.premium-footer__marquee \{[\s\S]*?@keyframes teyfikFooterMarquee \{[\s\S]*?\}\n\s*\}/,
  ''
);

source = source.replace(
  /\n\s*\.premium-footer__marquee \{[\s\S]*?\.premium-footer__marquee span \{[\s\S]*?\}\n/,
  '\n'
);

source = source.replace(
  /\n\s*\.premium-footer__marquee-track \{[\s\S]*?\}\n/,
  '\n'
);

source = source.replace('    margin: 18px auto 0;', '    margin: 72px auto 0;');

await writeFile(footerPath, source, 'utf8');
console.log('Removed legacy Teyfik Gökdemir footer marquee.');
