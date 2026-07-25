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
  if (!next.includes("import type { Locale } from '../i18n/locales';")) {
    next = next.replace("import type { SiteContent } from '../i18n/content';", "import type { SiteContent } from '../i18n/content';\nimport type { Locale } from '../i18n/locales';");
  }
  next = next.replace('  copy: SiteContent;\n}', '  copy: SiteContent;\n  locale: Locale;\n}');
  next = next.replace('const { copy } = Astro.props;', 'const { copy, locale } = Astro.props;');

  if (!next.includes('const footerText = {')) {
    next = next.replace(
      'const socialLinks = [',
      `const footerText = {\n  tr: { connect: 'Bağlantılar', ventures: 'Girişimler', contact: 'İletişim', position: 'Dijital ticaret, yapay zekâ operasyonları ve büyüme sistemleri.' },\n  en: { connect: 'Connect', ventures: 'Ventures', contact: 'Contact', position: 'Digital commerce, AI operations and growth systems.' },\n  mk: { connect: 'Поврзување', ventures: 'Потфати', contact: 'Контакт', position: 'Дигитална трговија, AI операции и системи за раст.' },\n  sr: { connect: 'Povezivanje', ventures: 'Poduhvati', contact: 'Kontakt', position: 'Digitalna trgovina, AI operacije i sistemi rasta.' },\n  sq: { connect: 'Lidhje', ventures: 'Sipërmarrje', contact: 'Kontakt', position: 'Tregti digjitale, operacione me AI dhe sisteme rritjeje.' },\n  fa: { connect: 'ارتباطات', ventures: 'کسب‌وکارها', contact: 'تماس', position: 'تجارت دیجیتال، عملیات هوش مصنوعی و سیستم‌های رشد.' },\n} as const;\n\nconst footer = footerText[locale] ?? footerText.en;\n\nconst socialLinks = [`
    );
  }

  if (!next.includes("['CTSEG', site.links.ctseg]")) next = next.replace("  ['Mythborn', site.links.mythborn],", "  ['Mythborn', site.links.mythborn],\n  ['CTSEG', site.links.ctseg],");

  next = next.replace('Digital commerce, AI operations and growth systems.', '{footer.position}');
  next = next.replace('<span class="premium-footer__label">Connect</span>', '<span class="premium-footer__label">{footer.connect}</span>');
  next = next.replace('<span class="premium-footer__label">Ventures</span>', '<span class="premium-footer__label">{footer.ventures}</span>');
  next = next.replace('<span class="premium-footer__label">Contact</span>', '<span class="premium-footer__label">{footer.contact}</span>');
  return next;
});

await patch('src/components/VentureMarquee.astro', (source) => {
  let next = source;
  if (!next.includes("{ name: 'CTSEG'")) next = next.replace("  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },", "  { name: 'Mythborn', href: 'https://mythborn.co', tone: 'mythborn' },\n  { name: 'CTSEG', href: 'https://ctseg.com.tr', tone: 'ctseg', logo: '/images/ctseg-logo-transparent.png' },");
  return next;
});

await patch('src/components/FounderPage.astro', (source) => {
  let next = source;

  if (!next.includes('const ctsegVenture =')) {
    const block = `const ctsegVenture = {\n  tr: { name: 'CTSEG', description: 'Stratejik tedarik, satın alma, tedarikçi geliştirme ve uluslararası ticaret süreçlerini uçtan uca yapılandıran kurumsal girişim.', status: 'Aktif girişim', region: 'Türkiye · Uluslararası', url: 'https://ctseg.com.tr', aria: 'CTSEG web sitesini ziyaret et', image: 'ctseg' },\n  en: { name: 'CTSEG', description: 'A corporate venture structuring strategic sourcing, procurement, supplier development and international trade operations end to end.', status: 'Active venture', region: 'Türkiye · International', url: 'https://ctseg.com.tr/en/', aria: 'Visit the CTSEG website', image: 'ctseg' },\n  mk: { name: 'CTSEG', description: 'Корпоративен потфат за стратешко снабдување, набавки, развој на добавувачи и меѓународна трговија.', status: 'Активен потфат', region: 'Турција · Меѓународно', url: 'https://ctseg.com.tr/en/', aria: 'Посетете ја веб-страницата на CTSEG', image: 'ctseg' },\n  sr: { name: 'CTSEG', description: 'Korporativni poduhvat za strateški sourcing, nabavku, razvoj dobavljača i međunarodnu trgovinu.', status: 'Aktivan poduhvat', region: 'Turska · Međunarodno', url: 'https://ctseg.com.tr/en/', aria: 'Posetite CTSEG sajt', image: 'ctseg' },\n  sq: { name: 'CTSEG', description: 'Sipërmarrje korporative për furnizim strategjik, prokurim, zhvillim furnitorësh dhe tregti ndërkombëtare.', status: 'Sipërmarrje aktive', region: 'Turqi · Ndërkombëtare', url: 'https://ctseg.com.tr/en/', aria: 'Vizitoni faqen e CTSEG', image: 'ctseg' },\n} as const;\n\n`;
    next = next.replace('const copy = {', block + 'const copy = {');
  }

  if (!next.includes('items: [...baseCopy.ventures.items, ctsegVenture')) {
    next = next.replace("  intro: { ...baseCopy.intro, ...localPositioning.intro },", "  intro: { ...baseCopy.intro, ...localPositioning.intro },\n  ventures: { ...baseCopy.ventures, items: [...baseCopy.ventures.items, ctsegVenture[locale] ?? ctsegVenture.en] },");
  }

  next = next.replace("{ 'has-image': item.image === 'commerce' }", "{ 'has-image': item.image === 'commerce', 'venture-card--ctseg': item.image === 'ctseg' }");

  if (!next.includes("item.image === 'ctseg'")) {
    next = next.replace(
      `{item.image === 'commerce' && <img src={site.images.commerce.path} width={site.images.commerce.width} height={site.images.commerce.height} alt={copy.images.commerce} loading="lazy" decoding="async" />}`,
      `{item.image === 'commerce' && <img src={site.images.commerce.path} width={site.images.commerce.width} height={site.images.commerce.height} alt={copy.images.commerce} loading="lazy" decoding="async" />}\n{item.image === 'ctseg' && <img class="venture-card__ctseg-logo" src={site.images.ctseg.path} width={site.images.ctseg.width} height={site.images.ctseg.height} alt="CTSEG" loading="lazy" decoding="async" />}`
    );
  }

  const ecosystemTexts = [
    ["Türkiye’de QCT Commerce’i, Balkanlar’da QCT Studio’yu ve uluslararası pazara yönelik Mythborn girişimini geliştirmektedir.", "Türkiye’de QCT Commerce’i, Balkanlar’da QCT Studio’yu, uluslararası pazara yönelik Mythborn’u ve stratejik tedarik ile uluslararası ticaret odağındaki CTSEG’i geliştirmektedir."],
    ["develops QCT Commerce for Türkiye, QCT Studio for the Balkans and Mythborn for international markets", "develops QCT Commerce for Türkiye, QCT Studio for the Balkans, Mythborn for international markets and CTSEG for strategic sourcing and international trade"],
    ["ги развива QCT Commerce за Турција, QCT Studio за Балканот и Mythborn за меѓународните пазари", "ги развива QCT Commerce за Турција, QCT Studio за Балканот, Mythborn за меѓународните пазари и CTSEG за стратешко снабдување и меѓународна трговија"],
    ["razvija QCT Commerce za Tursku, QCT Studio za Balkan i Mythborn za međunarodna tržišta", "razvija QCT Commerce za Tursku, QCT Studio za Balkan, Mythborn za međunarodna tržišta i CTSEG za strateški sourcing i međunarodnu trgovinu"],
    ["zhvillon QCT Commerce për Turqinë, QCT Studio për Ballkanin dhe Mythborn për tregjet ndërkombëtare", "zhvillon QCT Commerce për Turqinë, QCT Studio për Ballkanin, Mythborn për tregjet ndërkombëtare dhe CTSEG për furnizim strategjik dhe tregti ndërkombëtare"],
  ];
  for (const [before, after] of ecosystemTexts) next = next.replace(before, after);

  if (!next.includes('>CTSEG ↗</a>')) {
    next = next.replace(
      '<a href="https://mythborn.co" target="_blank" rel="noopener noreferrer">Mythborn ↗</a>',
      '<a href="https://mythborn.co" target="_blank" rel="noopener noreferrer">Mythborn ↗</a><a href="https://ctseg.com.tr" target="_blank" rel="noopener noreferrer">CTSEG ↗</a>'
    );
  }

  next = next.replace('<VentureMarquee /><Footer copy={copy} />', '<VentureMarquee /><Footer copy={copy} locale={locale} />');

  if (!next.includes('/styles/ventures-compact.css')) {
    next = next.replace('<Header locale={locale}', '<link rel="stylesheet" href="/styles/ventures-compact.css" />\n<Header locale={locale}');
  }

  return next;
});

await patch('src/layouts/BaseLayout.astro', (source) =>
  source.replace(
    "const localeUrl = (item: Locale) => item === 'en' ? '/' : '/' + item + '/';",
    "const localeUrl = (item: Locale) => '/' + item + '/';"
  )
);

console.log('CTSEG integration applied.');