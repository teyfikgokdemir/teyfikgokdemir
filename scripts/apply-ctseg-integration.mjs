import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, transform) {
  const url = new URL(`../${path}`, import.meta.url);
  const source = await readFile(url, 'utf8');
  const next = transform(source);
  if (next !== source) await writeFile(url, next, 'utf8');
}

await patch('src/data/site.ts', (source) => {
  let next = source;
  if (!next.includes("ctseg: 'https://ctseg.com.tr'")) {
    next = next.replace("    mythborn: 'https://mythborn.co',", "    mythborn: 'https://mythborn.co',\n    ctseg: 'https://ctseg.com.tr',");
  }
  if (!next.includes("ctseg: { path: '/images/ctseg-logo-transparent.png'")) {
    next = next.replace("    legacy: { path: '/images/teyfik-gokdemir.webp', width: 900, height: 1213 },", "    legacy: { path: '/images/teyfik-gokdemir.webp', width: 900, height: 1213 },\n    ctseg: { path: '/images/ctseg-logo-transparent.png', width: 1063, height: 342 },");
  }
  return next;
});

await patch('src/i18n/content.ts', (source) => source.replace("image?: 'commerce';", "image?: 'commerce' | 'ctseg';"));

await patch('src/components/Footer.astro', (source) => {
  let next = source;
  if (!next.includes("['CTSEG', site.links.ctseg]")) {
    next = next.replace("  ['Mythborn', site.links.mythborn],", "  ['Mythborn', site.links.mythborn],\n  ['CTSEG', site.links.ctseg],");
  }
  if (!next.includes('premium-footer__venture-logo')) {
    next = next.replace('<span>{label}</span>\n              <span aria-hidden="true">↗</span>', `{label === 'CTSEG' ? (\n                <img class="premium-footer__venture-logo" src="/images/ctseg-logo-transparent.png" width="1063" height="342" alt="CTSEG" loading="lazy" decoding="async" />\n              ) : (\n                <span>{label}</span>\n              )}\n              <span aria-hidden="true">↗</span>`);
    next = next.replace('  .premium-footer__group nav a:hover {', `  .premium-footer__venture-logo { display: block; width: 92px; height: auto; }\n\n  .premium-footer__group nav a:hover {`);
  }
  return next;
});

await patch('src/components/VentureMarquee.astro', (source) => {
  let next = source;
  if (!next.includes("{ name: 'CTSEG'")) {
    next = next.replace("  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },", "  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },\n  { name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg', logo: '/images/ctseg-logo-transparent.png' },");
  } else if (!next.includes("logo: '/images/ctseg-logo-transparent.png'")) {
    next = next.replace("{ name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg' }", "{ name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg', logo: '/images/ctseg-logo-transparent.png' }");
  }
  if (!next.includes('venture-marquee__logo')) {
    next = next.replace('<span>{venture.name}</span>', `{venture.logo ? <img class="venture-marquee__logo" src={venture.logo} width="1063" height="342" alt={venture.name} loading="lazy" decoding="async" /> : <span>{venture.name}</span>}`);
    next = next.replace('  .venture-marquee__mark {', '  .venture-marquee__logo { display: block; width: clamp(132px, 15vw, 230px); height: auto; }\n\n  .venture-marquee__mark {');
  }
  if (!next.includes('.venture-marquee__item--ctseg')) {
    next = next.replace("  .venture-marquee__item--mythborn {\n    color: rgba(166, 137, 255, 0.42);\n  }", "  .venture-marquee__item--mythborn {\n    color: rgba(166, 137, 255, 0.42);\n  }\n\n  .venture-marquee__item--ctseg {\n    color: rgba(255, 62, 62, 0.52);\n  }");
  }
  return next;
});

await patch('src/components/FounderPage.astro', (source) => {
  let next = source;
  if (!next.includes('const ctsegVenture =')) {
    const block = `const ctsegVenture = {\n  tr: { name: 'CTSEG', description: 'Stratejik tedarik, satın alma, tedarikçi geliştirme ve uluslararası ticaret süreçlerini uçtan uca yapılandıran kurumsal girişim.', status: 'Aktif girişim', region: 'Türkiye · Uluslararası', url: 'https://ctseg.com.tr', aria: 'CTSEG web sitesini ziyaret et', image: 'ctseg' },\n  en: { name: 'CTSEG', description: 'A corporate venture structuring strategic sourcing, procurement, supplier development and international trade operations end to end.', status: 'Active venture', region: 'Türkiye · International', url: 'https://ctseg.com.tr/en/', aria: 'Visit the CTSEG website', image: 'ctseg' },\n  mk: { name: 'CTSEG', description: 'Корпоративен потфат за стратешко снабдување, набавки, развој на добавувачи и меѓународна трговија.', status: 'Активен потфат', region: 'Турција · Меѓународно', url: 'https://ctseg.com.tr/en/', aria: 'Посетете ја веб-страницата на CTSEG', image: 'ctseg' },\n  sr: { name: 'CTSEG', description: 'Korporativni poduhvat za strateški sourcing, nabavku, razvoj dobavljača i međunarodnu trgovinu.', status: 'Aktivan poduhvat', region: 'Turska · Međunarodno', url: 'https://ctseg.com.tr/en/', aria: 'Posetite CTSEG sajt', image: 'ctseg' },\n  sq: { name: 'CTSEG', description: 'Sipërmarrje korporative për furnizim strategjik, prokurim, zhvillim furnitorësh dhe tregti ndërkombëtare.', status: 'Sipërmarrje aktive', region: 'Turqi · Ndërkombëtare', url: 'https://ctseg.com.tr/en/', aria: 'Vizitoni faqen e CTSEG', image: 'ctseg' },\n} as const;\n\n`;
    next = next.replace('const copy = {', block + 'const copy = {');
  } else {
    next = next.replace(/(name: 'CTSEG'[^\n}]*aria: '[^']+') \}/g, "$1, image: 'ctseg' }");
  }
  if (!next.includes('items: [...baseCopy.ventures.items, ctsegVenture')) {
    next = next.replace("  intro: { ...baseCopy.intro, ...localPositioning.intro },", "  intro: { ...baseCopy.intro, ...localPositioning.intro },\n  ventures: { ...baseCopy.ventures, items: [...baseCopy.ventures.items, ctsegVenture[locale] ?? ctsegVenture.en] },");
  }
  next = next.replace(/const ecosystemCopy = \{[\s\S]*?\} as const;/, `const ecosystemCopy = {\n  tr: { label: 'Girişim ekosistemi', title: 'Ticaret, teknoloji, tedarik ve pazar geliştirme için bağlantılı girişimler.', text: 'Teyfik Gökdemir; QCT Commerce, QCT Studio, Mythborn ve stratejik tedarik ile uluslararası ticaret markası CTSEG’i birbirini tamamlayan bağımsız girişimler olarak geliştirmektedir.' },\n  en: { label: 'Venture ecosystem', title: 'Connected ventures for commerce, technology, sourcing and market development.', text: 'Teyfik Gökdemir develops QCT Commerce, QCT Studio, Mythborn and CTSEG—a strategic sourcing and international trade brand—as complementary independent ventures.' },\n  mk: { label: 'Екосистем на потфати', title: 'Поврзани потфати за трговија, технологија, снабдување и развој на пазар.', text: 'Тејфик Ѓокдемир ги развива QCT Commerce, QCT Studio, Mythborn и CTSEG како комплементарни независни потфати.' },\n  sr: { label: 'Ekosistem poduhvata', title: 'Povezani poduhvati za trgovinu, tehnologiju, sourcing i razvoj tržišta.', text: 'Teyfik Gökdemir razvija QCT Commerce, QCT Studio, Mythborn i CTSEG kao komplementarne nezavisne poduhvate.' },\n  sq: { label: 'Ekosistemi i sipërmarrjeve', title: 'Sipërmarrje të lidhura për tregti, teknologji, furnizim dhe zhvillim tregu.', text: 'Teyfik Gökdemir zhvillon QCT Commerce, QCT Studio, Mythborn dhe CTSEG si sipërmarrje të pavarura që plotësojnë njëra-tjetrën.' },\n} as const;`);
  if (!next.includes('CTSEG ↗</a>')) {
    next = next.replace('<a href="https://mythborn.co" target="_blank" rel="noopener noreferrer">Mythborn ↗</a>', '<a href="https://mythborn.co" target="_blank" rel="noopener noreferrer">Mythborn ↗</a><a href="https://ctseg.com.tr" target="_blank" rel="noopener noreferrer">CTSEG ↗</a>');
  }
  next = next.replace("{ 'has-image': item.image === 'commerce' }", "{ 'has-image': item.image === 'commerce', 'venture-card--ctseg': item.image === 'ctseg' }");
  if (!next.includes("item.image === 'ctseg'")) {
    next = next.replace(`{item.image === 'commerce' && <img src={site.images.commerce.path} width={site.images.commerce.width} height={site.images.commerce.height} alt={copy.images.commerce} loading="lazy" decoding="async" />}`, `{item.image === 'commerce' && <img src={site.images.commerce.path} width={site.images.commerce.width} height={site.images.commerce.height} alt={copy.images.commerce} loading="lazy" decoding="async" />}\n{item.image === 'ctseg' && <img class="venture-card__ctseg-logo" src={site.images.ctseg.path} width={site.images.ctseg.width} height={site.images.ctseg.height} alt="CTSEG" loading="lazy" decoding="async" />}`);
  }
  if (!next.includes('.venture-card--ctseg {')) {
    next = next.replace('</style>', `  .venture-card--ctseg { grid-column: 1 / -1; min-height: 260px; display: grid; grid-template-columns: minmax(180px, 300px) 1fr; grid-template-areas: "logo meta" "logo title" "logo text" "logo arrow"; column-gap: clamp(2rem, 5vw, 5rem); align-items: center; }\n  .venture-card--ctseg .venture-card__ctseg-logo { grid-area: logo; width: 100%; max-width: 280px; height: auto; margin: 0; object-fit: contain; justify-self: center; }\n  .venture-card--ctseg .venture-meta { grid-area: meta; align-self: end; }\n  .venture-card--ctseg h3 { grid-area: title; margin: .65rem 0 .35rem; }\n  .venture-card--ctseg p { grid-area: text; max-width: 720px; }\n  .venture-card--ctseg .venture-arrow { grid-area: arrow; }\n  @media (max-width: 720px) { .venture-card--ctseg { grid-template-columns: 1fr; grid-template-areas: "logo" "meta" "title" "text" "arrow"; row-gap: .75rem; } .venture-card--ctseg .venture-card__ctseg-logo { width: min(72%, 240px); justify-self: start; margin-bottom: .75rem; } }\n</style>`);
  }
  return next;
});

console.log('CTSEG integration applied.');