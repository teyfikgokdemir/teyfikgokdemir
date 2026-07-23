import { readFile, writeFile } from 'node:fs/promises';

const footerPath = new URL('../src/components/Footer.astro', import.meta.url);
let source = await readFile(footerPath, 'utf8');

if (!source.includes('premium-footer__marquee')) {
  const markupNeedle = `  </div>\n\n  <div class="premium-footer__bottom">`;
  const markupReplacement = `  </div>\n\n  <div class="premium-footer__marquee" aria-hidden="true">\n    <div class="premium-footer__marquee-track">\n      <span>TEYFİK GÖKDEMİR</span><span>TEYFİK GÖKDEMİR</span><span>TEYFİK GÖKDEMİR</span>\n    </div>\n  </div>\n\n  <div class="premium-footer__bottom">`;

  if (!source.includes(markupNeedle)) {
    throw new Error('Footer marquee insertion point was not found. Refusing an unsafe patch.');
  }
  source = source.replace(markupNeedle, markupReplacement);

  const cssNeedle = `  .premium-footer__bottom {`;
  const cssBlock = `  .premium-footer__marquee {\n    width: 100%;\n    height: clamp(4.75rem, 7vw, 6.25rem);\n    margin-top: clamp(2.25rem, 4vw, 3.5rem);\n    display: flex;\n    align-items: center;\n    overflow: hidden;\n    pointer-events: none;\n    user-select: none;\n    -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);\n    mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);\n  }\n\n  .premium-footer__marquee-track {\n    display: flex;\n    width: max-content;\n    gap: clamp(3rem, 6vw, 7rem);\n    animation: teyfikFooterMarquee 52s linear infinite;\n    will-change: transform;\n  }\n\n  .premium-footer__marquee span {\n    color: transparent;\n    -webkit-text-stroke: 1px rgba(223, 169, 80, 0.11);\n    text-shadow: 0 0 18px rgba(223, 169, 80, 0.04);\n    font-family: Georgia, 'Times New Roman', serif;\n    font-size: clamp(2.6rem, 5vw, 5.2rem);\n    font-weight: 500;\n    line-height: 0.9;\n    letter-spacing: 0.035em;\n    white-space: nowrap;\n  }\n\n  @keyframes teyfikFooterMarquee {\n    to { transform: translateX(calc(-33.333% - 2rem)); }\n  }\n\n`;

  if (!source.includes(cssNeedle)) {
    throw new Error('Footer marquee CSS insertion point was not found. Refusing an unsafe patch.');
  }
  source = source.replace(cssNeedle, cssBlock + cssNeedle);
  source = source.replace('    margin: 72px auto 0;', '    margin: 18px auto 0;');

  const mobileNeedle = `    .premium-footer__inner,\n    .premium-footer__bottom {`;
  const mobileBlock = `    .premium-footer__marquee {\n      height: clamp(4rem, 18vw, 5.5rem);\n      margin-top: 2rem;\n    }\n\n    .premium-footer__marquee-track {\n      animation: none;\n      transform: translateX(-8%);\n    }\n\n    .premium-footer__marquee span {\n      font-size: clamp(2.2rem, 10vw, 3.8rem);\n    }\n\n`;
  if (!source.includes(mobileNeedle)) {
    throw new Error('Footer marquee mobile insertion point was not found. Refusing an unsafe patch.');
  }
  source = source.replace(mobileNeedle, mobileBlock + mobileNeedle);

  const reducedNeedle = `  @media (prefers-reduced-motion: reduce) {`;
  const reducedBlock = `  @media (prefers-reduced-motion: reduce) {\n    .premium-footer__marquee-track {\n      animation: none;\n      transform: translateX(-8%);\n    }\n`;
  if (!source.includes(reducedNeedle)) {
    throw new Error('Footer marquee reduced-motion insertion point was not found. Refusing an unsafe patch.');
  }
  source = source.replace(reducedNeedle, reducedBlock);

  await writeFile(footerPath, source, 'utf8');
  console.log('Applied footer marquee between the main footer content and copyright divider.');
} else {
  console.log('Footer marquee is already present.');
}
