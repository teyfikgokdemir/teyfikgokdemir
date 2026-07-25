import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, transform) {
  const url = new URL(`../${path}`, import.meta.url);
  const source = await readFile(url, 'utf8');
  const next = transform(source);
  if (next !== source) await writeFile(url, next, 'utf8');
}

await patch('src/data/site.ts', (source) => {
  if (source.includes("ctseg: 'https://ctseg.com.tr'")) return source;
  return source.replace(
    "    mythborn: 'https://mythborn.co',",
    "    mythborn: 'https://mythborn.co',\n    ctseg: 'https://ctseg.com.tr',"
  );
});

await patch('src/components/Footer.astro', (source) => {
  if (source.includes("['CTSEG', site.links.ctseg]")) return source;
  return source.replace(
    "  ['Mythborn', site.links.mythborn],",
    "  ['Mythborn', site.links.mythborn],\n  ['CTSEG', site.links.ctseg],"
  );
});

await patch('src/components/VentureMarquee.astro', (source) => {
  let next = source;
  if (!next.includes("{ name: 'CTSEG'")) {
    next = next.replace(
      "  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },",
      "  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },\n  { name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg' },"
    );
  }
  if (!next.includes('.venture-marquee__item--ctseg')) {
    next = next.replace(
      "  .venture-marquee__item--mythborn {\n    color: rgba(166, 137, 255, 0.42);\n  }",
      "  .venture-marquee__item--mythborn {\n    color: rgba(166, 137, 255, 0.42);\n  }\n\n  .venture-marquee__item--ctseg {\n    color: rgba(68, 194, 183, 0.5);\n  }"
    );
  }
  return next;
});

await patch('src/components/FounderPage.astro', (source) => {
  let next = source;

  if (!next.includes('const ctsegVenture =')) {
    const block = `const ctsegVenture = {\n  tr: { name: 'CTSEG', description: 'Stratejik tedarik, satın alma, tedarikçi geliştirme ve uluslararası ticaret süreçlerini uçtan uca yapılandıran kurumsal girişim.', status: 'Aktif girişim', region: 'Türkiye · Uluslararası', url: 'https://ctseg.com.tr', aria: 'CTSEG web sitesini ziyaret et' },\n  en: { name: 'CTSEG', description: 'A corporate venture structuring strategic sourcing, procurement, supplier development and international trade operations end to end.', status: 'Active venture', region: 'Türkiye · International', url: 'https://ctseg.com.tr/en/', aria: 'Visit the CTSEG website' },\n  mk: { name: 'CTSEG', description: 'Корпоративен потфат за стратешко снабдување, набавки, развој на добавувачи и меѓународна трговија.', status: 'Активен потфат', region: 'Турција · Меѓународно', url: 'https://ctseg.com.tr/en/', aria: 'Посетете ја веб-страницата на CTSEG' },\n  sr: { name: 'CTSEG', description: 'Korporativni poduhvat za strateški sourcing, nabavku, razvoj dobavljača i međunarodnu trgovinu.', status: 'Aktivan poduhvat', region: 'Turska · Međunarodno', url: 'https://ctseg.com.tr/en/', aria: 'Posetite CTSEG sajt' },\n  sq: { name: 'CTSEG', description: 'Sipërmarrje korporative për furnizim strategjik, prokurim, zhvillim furnitorësh dhe tregti ndërkombëtare.', status: 'Sipërmarrje aktive', region: 'Turqi · Ndërkombëtare', url: 'https://ctseg.com.tr/en/', aria: 'Vizitoni faqen e CTSEG' },\n} as const;\n\n`;
    next = next.replace('const copy = {', block + 'const copy = {');
  }

  if (!next.includes('items: [...baseCopy.ventures.items, ctsegVenture')) {
    next = next.replace(
      "  intro: { ...baseCopy.intro, ...localPositioning.intro },",
      "  intro: { ...baseCopy.intro, ...localPositioning.intro },\n  ventures: { ...baseCopy.ventures, items: [...baseCopy.ventures.items, ctsegVenture[locale] ?? ctsegVenture.en] },"
    );
  }

  next = next.replace(/const ecosystemCopy = \{[\s\S]*?\} as const;/, `const ecosystemCopy = {\n  tr: { label: 'Girişim ekosistemi', title: 'Ticaret, teknoloji, tedarik ve pazar geliştirme için bağlantılı girişimler.', text: 'Teyfik Gökdemir; QCT Commerce, QCT Studio, Mythborn ve stratejik tedarik ile uluslararası ticaret markası CTSEG’i birbirini tamamlayan bağımsız girişimler olarak geliştirmektedir.' },\n  en: { label: 'Venture ecosystem', title: 'Connected ventures for commerce, technology, sourcing and market development.', text: 'Teyfik Gökdemir develops QCT Commerce, QCT Studio, Mythborn and CTSEG—a strategic sourcing and international trade brand—as complementary independent ventures.' },\n  mk: { label: 'Екосистем на потфати', title: 'Поврзани потфати за трговија, технологија, снабдување и развој на пазар.', text: 'Тејфик Ѓокдемир ги развива QCT Commerce, QCT Studio, Mythborn и CTSEG како комплементарни независни потфати.' },\n  sr: { label: 'Ekosistem poduhvata', title: 'Povezani poduhvati za trgovinu, tehnologiju, sourcing i razvoj tržišta.', text: 'Teyfik Gökdemir razvija QCT Commerce, QCT Studio, Mythborn i CTSEG kao komplementarne nezavisne poduhvate.' },\n  sq: { label: 'Ekosistemi i sipërmarrjeve', title: 'Sipërmarrje të lidhura për tregti, teknologji, furnizim dhe zhvillim tregu.', text: 'Teyfik Gökdemir zhvillon QCT Commerce, QCT Studio, Mythborn dhe CTSEG si sipërmarrje të pavarura që plotësojnë njëra-tjetrën.' },\n} as const;`);

  if (!next.includes('CTSEG ↗</a>')) {
    next = next.replace(
      '<a href="https://mythborn.co" target="_blank" rel="noopener noreferrer">Mythborn ↗</a>',
      '<a href="https://mythborn.co" target="_blank" rel="noopener noreferrer">Mythborn ↗</a><a href="https://ctseg.com.tr" target="_blank" rel="noopener noreferrer">CTSEG ↗</a>'
    );
  }

  return next;
});

console.log('CTSEG integration applied.');
