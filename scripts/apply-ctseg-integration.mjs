import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, transform) {
  const url = new URL(`../${path}`, import.meta.url);
  const source = await readFile(url, 'utf8');
  const next = transform(source);
  if (next !== source) await writeFile(url, next, 'utf8');
}

await patch('src/data/site.ts', (source) => {
  let next = source;
  if (!next.includes("ctseg: 'https://ctseg.com.tr'")) next = next.replace("    mythborn: 'https://mythborn.co',", "    mythborn: 'https://mythborn.co',\n    ctseg: 'https://ctseg.com.tr',");
  if (!next.includes("ctseg: { path: '/images/ctseg-logo-transparent.png'")) next = next.replace("    legacy: { path: '/images/teyfik-gokdemir.webp', width: 900, height: 1213 },", "    legacy: { path: '/images/teyfik-gokdemir.webp', width: 900, height: 1213 },\n    ctseg: { path: '/images/ctseg-logo-transparent.png', width: 1063, height: 342 },");
  return next;
});

await patch('src/i18n/content.ts', (source) => source.replace("image?: 'commerce';", "image?: 'commerce' | 'ctseg';"));

await patch('src/components/Footer.astro', (source) => {
  let next = source;
  if (!next.includes("['CTSEG', site.links.ctseg]")) next = next.replace("  ['Mythborn', site.links.mythborn],", "  ['Mythborn', site.links.mythborn],\n  ['CTSEG', site.links.ctseg],");
  if (!next.includes('premium-footer__venture-logo')) {
    next = next.replace('<span>{label}</span>\n              <span aria-hidden="true">↗</span>', `{label === 'CTSEG' ? (\n                <img class="premium-footer__venture-logo" src="/images/ctseg-logo-transparent.png" width="1063" height="342" alt="CTSEG" loading="lazy" decoding="async" />\n              ) : (\n                <span>{label}</span>\n              )}\n              <span aria-hidden="true">↗</span>`);
    next = next.replace('  .premium-footer__group nav a:hover {', `  .premium-footer__venture-logo { display: block; width: 92px; height: auto; }\n\n  .premium-footer__group nav a:hover {`);
  }
  return next;
});

await patch('src/components/VentureMarquee.astro', (source) => {
  let next = source;
  if (!next.includes("{ name: 'CTSEG'")) next = next.replace("  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },", "  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },\n  { name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg', logo: '/images/ctseg-logo-transparent.png' },");
  else if (!next.includes("logo: '/images/ctseg-logo-transparent.png'")) next = next.replace("{ name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg' }", "{ name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg', logo: '/images/ctseg-logo-transparent.png' }");
  if (!next.includes('venture-marquee__logo')) {
    next = next.replace('<span>{venture.name}</span>', `{venture.logo ? <img class="venture-marquee__logo" src={venture.logo} width="1063" height="342" alt={venture.name} loading="lazy" decoding="async" /> : <span>{venture.name}</span>}`);
    next = next.replace('  .venture-marquee__mark {', '  .venture-marquee__logo { display: block; width: clamp(132px, 15vw, 230px); height: auto; }\n\n  .venture-marquee__mark {');
  }
  if (!next.includes('.venture-marquee__item--ctseg')) next = next.replace("  .venture-marquee__item--mythborn {\n    color: rgba(166, 137, 255, 0.42);\n  }", "  .venture-marquee__item--mythborn {\n    color: rgba(166, 137, 255, 0.42);\n  }\n\n  .venture-marquee__item--ctseg {\n    color: rgba(255, 62, 62, 0.52);\n  }");
  return next;
});

await patch('src/components/FounderPage.astro', (source) => {
  let next = source;
  if (!next.includes('const ctsegVenture =')) {
    const block = `const ctsegVenture = {\n  tr: { name: 'CTSEG', description: 'Stratejik tedarik, satın alma, tedarikçi geliştirme ve uluslararası ticaret süreçlerini uçtan uca yapılandıran kurumsal girişim.', status: 'Aktif girişim', region: 'Türkiye · Uluslararası', url: 'https://ctseg.com.tr', aria: 'CTSEG web sitesini ziyaret et', image: 'ctseg' },\n  en: { name: 'CTSEG', description: 'A corporate venture structuring strategic sourcing, procurement, supplier development and international trade operations end to end.', status: 'Active venture', region: 'Türkiye · International', url: 'https://ctseg.com.tr/en/', aria: 'Visit the CTSEG website', image: 'ctseg' },\n  mk: { name: 'CTSEG', description: 'Корпоративен потфат за стратешко снабдување, набавки, развој на добавувачи и меѓународна трговија.', status: 'Активен потфат', region: 'Турција · Меѓународно', url: 'https://ctseg.com.tr/en/', aria: 'Посетете ја веб-страницата на CTSEG', image: 'ctseg' },\n  sr: { name: 'CTSEG', description: 'Korporativni poduhvat za strateški sourcing, nabavku, razvoj dobavljača i međunarodnu trgovinu.', status: 'Aktivan poduhvat', region: 'Turska · Međunarodno', url: 'https://ctseg.com.tr/en/', aria: 'Posetite CTSEG sajt', image: 'ctseg' },\n  sq: { name: 'CTSEG', description: 'Sipërmarrje korporative për furnizim strategjik, prokurim, zhvillim furnitorësh dhe tregti ndërkombëtare.', status: 'Sipërmarrje aktive', region: 'Turqi · Ndërkombëtare', url: 'https://ctseg.com.tr/en/', aria: 'Vizitoni faqen e CTSEG', image: 'ctseg' },\n} as const;\n\n`;
    next = next.replace('const copy = {', block + 'const copy = {');
  }
  if (!next.includes('items: [...baseCopy.ventures.items, ctsegVenture')) next = next.replace("  intro: { ...baseCopy.intro, ...localPositioning.intro },", "  intro: { ...baseCopy.intro, ...localPositioning.intro },\n  ventures: { ...baseCopy.ventures, items: [...baseCopy.ventures.items, ctsegVenture[locale] ?? ctsegVenture.en] },");
  next = next.replace("{ 'has-image': item.image === 'commerce' }", "{ 'has-image': item.image === 'commerce', 'venture-card--ctseg': item.image === 'ctseg' }");
  if (!next.includes("item.image === 'ctseg'")) next = next.replace(`{item.image === 'commerce' && <img src={site.images.commerce.path} width={site.images.commerce.width} height={site.images.commerce.height} alt={copy.images.commerce} loading="lazy" decoding="async" />}`, `{item.image === 'commerce' && <img src={site.images.commerce.path} width={site.images.commerce.width} height={site.images.commerce.height} alt={copy.images.commerce} loading="lazy" decoding="async" />}\n{item.image === 'ctseg' && <img class="venture-card__ctseg-logo" src={site.images.ctseg.path} width={site.images.ctseg.width} height={site.images.ctseg.height} alt="CTSEG" loading="lazy" decoding="async" />}`);

  const premiumCss = `  #ventures.section { padding-block: clamp(2.5rem, 5vw, 4.5rem); }\n  #ventures .section-heading { margin-bottom: clamp(1rem, 2vw, 1.5rem); }\n  #ventures .venture-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(.8rem, 1.4vw, 1.1rem); }\n  #ventures .venture-card { min-height: 230px; padding: clamp(1.15rem, 1.7vw, 1.45rem); border-radius: 22px; overflow: hidden; }\n  #ventures .venture-card h3 { margin: .7rem 0 .3rem; font-size: clamp(1.25rem, 1.8vw, 1.65rem); }\n  #ventures .venture-card p { margin: 0; line-height: 1.5; }\n  #ventures .venture-card.has-image img { max-height: 92px; object-fit: cover; object-position: center; margin: -1.45rem -1.45rem 1rem; width: calc(100% + 2.9rem); }\n  .venture-card--ctseg { display: flex !important; flex-direction: column; justify-content: flex-start; grid-column: auto !important; min-height: 230px !important; }\n  .venture-card--ctseg .venture-card__ctseg-logo { display: block; width: min(82%, 230px); height: auto; margin: 0 0 1rem; object-fit: contain; }\n  .venture-card--ctseg .venture-meta { margin-top: auto; }\n  .venture-card--ctseg h3 { margin-top: .7rem !important; }\n  @media (max-width: 1100px) { #ventures .venture-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } #ventures .venture-card { min-height: 220px; } }\n  @media (max-width: 680px) { #ventures.section { padding-block: 2.25rem; } #ventures .venture-grid { grid-template-columns: 1fr; } #ventures .venture-card { min-height: auto; } .venture-card--ctseg .venture-card__ctseg-logo { width: min(76vw, 220px); } }`;

  next = next.replace(/  \.venture-card--ctseg \{[\s\S]*?@media \(max-width: 720px\) \{[\s\S]*?\}\n/s, premiumCss + '\n');
  if (!next.includes('#ventures .venture-grid { display: grid; grid-template-columns: repeat(3')) next = next.replace('</style>', premiumCss + '\n</style>');
  return next;
});

console.log('CTSEG integration applied.');