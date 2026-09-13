import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export type AuditEvidence = {
  url: string;
  problem: string;
  current?: string;
  relatedUrls?: string[];
  expected?: string;
};

export type AuditIssue = {
  key: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'pass' | 'fail' | 'warning';
  detail: string;
  recommendation: string;
  evidence?: AuditEvidence[];
};

type PageSample = {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string;
  h1Count: number;
  schemaCount: number;
  robotsMeta: string;
  wordCount: number;
};

const normalizeDomain = (input: string) => {
  const value = input.trim();
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(normalized);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Yalnız HTTP/HTTPS domainleri taranabilir.');
  url.username = '';
  url.password = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
};

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const value = ip.toLowerCase();
  return value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:') || value === '::';
}

async function assertPublicUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) throw new Error('Özel ağ adresleri taranamaz.');
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Özel ağ IP adresleri taranamaz.');
    return;
  }
  const resolved = await lookup(host, { all: true, verbatim: true });
  if (!resolved.length || resolved.some((item) => isPrivateIp(item.address))) throw new Error('Domain güvenli bir public IP adresine çözülmüyor.');
}

async function safeFetch(rawUrl: string, init: RequestInit = {}, redirects = 0): Promise<Response> {
  if (redirects > 5) throw new Error('Çok fazla yönlendirme tespit edildi.');
  await assertPublicUrl(rawUrl);
  const response = await fetch(rawUrl, { ...init, redirect: 'manual' });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) return response;
    const next = new URL(location, rawUrl).toString();
    return safeFetch(next, init, redirects + 1);
  }
  return response;
}

function pageSignals(url: string, status: number, html: string): PageSample {
  const $ = cheerio.load(html);
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return {
    url,
    status,
    title: $('title').first().text().trim(),
    description: $('meta[name="description"]').attr('content')?.trim() || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    h1Count: $('h1').length,
    schemaCount: $('script[type="application/ld+json"]').length,
    robotsMeta: $('meta[name="robots"]').attr('content') || '',
    wordCount: text ? text.split(' ').length : 0,
  };
}

async function crawlSamples(baseUrl: string, homeHtml: string, limit = 20) {
  const origin = new URL(baseUrl).origin;
  const candidates = new Set<string>([baseUrl]);
  const $ = cheerio.load(homeHtml);
  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    try {
      const u = new URL(href, baseUrl);
      u.hash = '';
      if (u.origin !== origin) return;
      if (!['http:', 'https:'].includes(u.protocol)) return;
      if (/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|xml|txt|css|js)(\?|$)/i.test(u.pathname)) return;
      candidates.add(u.toString().replace(/\/$/, '') || origin);
    } catch {}
  });

  const urls = [...candidates].slice(0, limit);
  const results: PageSample[] = [];
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await safeFetch(url, { signal: controller.signal, headers: { 'user-agent': 'GrowthOS-AuditBot/0.2 (+private audit)' } });
      clearTimeout(timeout);
      const type = res.headers.get('content-type') || '';
      if (!type.includes('text/html')) continue;
      const html = url === baseUrl ? homeHtml : await res.text();
      results.push(pageSignals(res.url, res.status, html));
    } catch {
      results.push({ url, status: 0, title: '', description: '', canonical: '', h1Count: 0, schemaCount: 0, robotsMeta: '', wordCount: 0 });
    }
  }
  return results;
}

const scoreFromIssues = (issues: AuditIssue[], keys: string[], sampledPageCount = 0) => {
  const selected = issues.filter((issue) => keys.includes(issue.key));
  if (!selected.length) return 100;
  let score = 100;
  for (const issue of selected) {
    if (issue.status === 'pass') continue;
    const penalty = issue.severity === 'critical' ? 30 : issue.severity === 'high' ? 18 : issue.severity === 'medium' ? 10 : 4;
    const affectedPages = issue.evidence ? new Set(issue.evidence.map((item) => item.url)).size : 0;
    const coverageWeight = issue.key.startsWith('site-') && sampledPageCount > 0 && affectedPages > 0
      ? Math.max(0.15, Math.min(1, affectedPages / sampledPageCount))
      : 1;
    score -= penalty * coverageWeight;
  }
  return Math.round(Math.max(0, Math.min(100, score)));
};

const formatEvidenceUrls = (evidence: AuditEvidence[], limit = 5) => {
  const urls = [...new Set(evidence.map((item) => item.url))];
  if (!urls.length) return '';
  const shown = urls.slice(0, limit);
  const suffix = urls.length > limit ? ` (+${urls.length - limit} daha)` : '';
  return ` Etkilenen URL: ${shown.join(', ')}${suffix}`;
};

export async function runAudit(inputDomain: string) {
  const domain = normalizeDomain(inputDomain);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await safeFetch(domain, {
      signal: controller.signal,
      headers: { 'user-agent': 'GrowthOS-AuditBot/0.2 (+private audit)' },
    });
  } finally {
    clearTimeout(timeout);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const h1Count = $('h1').length;
  const lang = $('html').attr('lang') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const schemas = $('script[type="application/ld+json"]').length;
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = text ? text.split(' ').length : 0;
  const forms = $('form').length;
  const faqSignals = /sıkça sorulan|faq|sorular/i.test(text);
  const authorSignals = /hakkımızda|about|uzman|ekip|yazar/i.test(text);
  const tracking = {
    ga4: /googletagmanager\.com\/gtag|G-[A-Z0-9]+/i.test(html),
    gtm: /GTM-[A-Z0-9]+/i.test(html),
    metaPixel: /connect\.facebook\.net|fbq\(/i.test(html),
    tiktok: /analytics\.tiktok\.com|ttq\./i.test(html),
  };

  const robotsUrl = new URL('/robots.txt', response.url).toString();
  const sitemapUrl = new URL('/sitemap.xml', response.url).toString();
  const [robotsRes, sitemapRes, sampledPages] = await Promise.all([
    safeFetch(robotsUrl).catch(() => null),
    safeFetch(sitemapUrl).catch(() => null),
    crawlSamples(response.url, html, 20),
  ]);
  const robotsOk = Boolean(robotsRes?.ok);
  const sitemapOk = Boolean(sitemapRes?.ok);

  const titleCounts = new Map<string, number>();
  const descriptionCounts = new Map<string, number>();
  sampledPages.forEach((p) => {
    if (p.title) titleCounts.set(p.title, (titleCounts.get(p.title) || 0) + 1);
    if (p.description) descriptionCounts.set(p.description, (descriptionCounts.get(p.description) || 0) + 1);
  });

  const missingTitlePages = sampledPages.filter((p) => !p.title);
  const missingDescriptionPages = sampledPages.filter((p) => !p.description);
  const missingCanonicalPages = sampledPages.filter((p) => !p.canonical);
  const badH1Pages = sampledPages.filter((p) => p.h1Count !== 1);
  const duplicateTitleGroups = [...titleCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => ({ value, pages: sampledPages.filter((p) => p.title === value) }));
  const duplicateDescriptionGroups = [...descriptionCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => ({ value, pages: sampledPages.filter((p) => p.description === value) }));

  const pagesWithoutTitle = missingTitlePages.length;
  const pagesWithoutDescription = missingDescriptionPages.length;
  const pagesWithoutCanonical = missingCanonicalPages.length;
  const pagesBadH1 = badH1Pages.length;
  const duplicateTitles = duplicateTitleGroups.reduce((sum, group) => sum + group.pages.length, 0);
  const duplicateDescriptions = duplicateDescriptionGroups.reduce((sum, group) => sum + group.pages.length, 0);
  const noindexPages = sampledPages.filter((p) => /noindex/i.test(p.robotsMeta)).length;

  const titleEvidence: AuditEvidence[] = [
    ...missingTitlePages.map((p) => ({ url: p.url, problem: 'missing', current: '', expected: 'Benzersiz SEO title' })),
    ...duplicateTitleGroups.flatMap((group) => group.pages.map((p) => ({
      url: p.url,
      problem: 'duplicate',
      current: group.value,
      relatedUrls: group.pages.filter((other) => other.url !== p.url).map((other) => other.url),
      expected: 'Site içinde benzersiz SEO title',
    }))),
  ];
  const descriptionEvidence: AuditEvidence[] = [
    ...missingDescriptionPages.map((p) => ({ url: p.url, problem: 'missing', current: '', expected: 'Özgün meta description' })),
    ...duplicateDescriptionGroups.flatMap((group) => group.pages.map((p) => ({
      url: p.url,
      problem: 'duplicate',
      current: group.value,
      relatedUrls: group.pages.filter((other) => other.url !== p.url).map((other) => other.url),
      expected: 'Site içinde özgün meta description',
    }))),
  ];
  const canonicalEvidence: AuditEvidence[] = missingCanonicalPages.map((p) => ({
    url: p.url,
    problem: 'missing',
    current: '',
    expected: 'Doğru canonical URL',
  }));
  const h1Evidence: AuditEvidence[] = badH1Pages.map((p) => ({
    url: p.url,
    problem: 'invalid_h1_count',
    current: `${p.h1Count} H1`,
    expected: '1 anlamlı H1',
  }));

  const issues: AuditIssue[] = [];
  const add = (condition: boolean, issue: Omit<AuditIssue, 'status'>) => issues.push({ ...issue, status: condition ? 'pass' : 'fail' });

  add(response.ok, { key: 'http', title: 'HTTP erişilebilirliği', severity: 'critical', detail: `HTTP ${response.status}`, recommendation: 'Ana sayfanın 200 yanıtı verdiğini doğrula.' });
  add(title.length >= 20 && title.length <= 65, { key: 'title', title: 'SEO title', severity: 'high', detail: title || 'Title bulunamadı', recommendation: 'Her sayfaya benzersiz ve arama niyetine uygun title ekle.' });
  add(description.length >= 70 && description.length <= 170, { key: 'description', title: 'Meta description', severity: 'high', detail: description || 'Description bulunamadı', recommendation: 'Sayfaya ikna edici ve özgün meta description ekle.' });
  add(Boolean(canonical), { key: 'canonical', title: 'Canonical', severity: 'high', detail: canonical || 'Canonical bulunamadı', recommendation: 'Canonical URL tanımla.' });
  add(h1Count === 1, { key: 'h1', title: 'H1 yapısı', severity: 'medium', detail: `${h1Count} adet H1`, recommendation: 'Sayfa başına tek, açıklayıcı H1 kullan.' });
  add(Boolean(lang), { key: 'lang', title: 'Dil bildirimi', severity: 'medium', detail: lang || 'html lang yok', recommendation: 'html lang değerini tanımla.' });
  add(Boolean(viewport), { key: 'viewport', title: 'Mobil viewport', severity: 'high', detail: viewport || 'Viewport yok', recommendation: 'Mobil uyumlu viewport meta etiketi ekle.' });
  add(robotsOk, { key: 'robots', title: 'robots.txt', severity: 'high', detail: robotsOk ? robotsUrl : 'robots.txt erişilemiyor', recommendation: 'robots.txt dosyasını yayınla ve önemli alanları engellemediğini doğrula.' });
  add(sitemapOk, { key: 'sitemap', title: 'sitemap.xml', severity: 'high', detail: sitemapOk ? sitemapUrl : 'sitemap.xml erişilemiyor', recommendation: 'Güncel XML sitemap yayınla.' });
  add(schemas > 0, { key: 'schema', title: 'Structured data', severity: 'high', detail: `${schemas} JSON-LD bloğu`, recommendation: 'İşletmeye uygun Organization, WebSite, Breadcrumb, Article/Product/Service şemalarını ekle.' });
  add(Boolean(ogTitle && ogDescription && ogImage), { key: 'og', title: 'Open Graph', severity: 'medium', detail: 'OG title/description/image kontrolü', recommendation: 'Sosyal paylaşım için tam OG seti ekle.' });
  add(wordCount >= 250, { key: 'content', title: 'İçerik derinliği', severity: 'medium', detail: `${wordCount} kelime`, recommendation: 'Ana sayfada net varlık, uzmanlık, hizmet ve cevap odaklı içerik oluştur.' });
  add(faqSignals, { key: 'aeo', title: 'AEO soru-cevap sinyali', severity: 'medium', detail: faqSignals ? 'Soru-cevap sinyali bulundu' : 'Belirgin FAQ/soru-cevap sinyali yok', recommendation: 'Gerçek kullanıcı sorularına kısa ve açık cevaplar ekle.' });
  add(authorSignals, { key: 'entity', title: 'Varlık ve güven sinyalleri', severity: 'medium', detail: authorSignals ? 'Kurumsal/uzman sinyali bulundu' : 'Zayıf varlık sinyali', recommendation: 'Şirket, ekip, uzmanlık, referans ve doğrulanabilir işletme bilgilerini güçlendir.' });
  add(tracking.ga4 || tracking.gtm, { key: 'analytics', title: 'Analytics altyapısı', severity: 'high', detail: `GA4:${tracking.ga4} GTM:${tracking.gtm}`, recommendation: 'GA4/GTM ölçüm altyapısını kur ve temel eventleri doğrula.' });
  add(tracking.metaPixel, { key: 'meta', title: 'Meta Pixel', severity: 'medium', detail: tracking.metaPixel ? 'Bulundu' : 'Bulunamadı', recommendation: 'Meta reklamı kullanılacaksa Pixel + CAPI ölçümünü kur.' });
  add(forms > 0 || /sepete ekle|satın al|iletişim|teklif/i.test(text), { key: 'conversion', title: 'Dönüşüm yolu', severity: 'high', detail: `${forms} form`, recommendation: 'Birincil dönüşüm aksiyonunu görünür ve ölçülebilir hale getir.' });
  add(sampledPages.length >= 2, { key: 'crawl-coverage', title: 'Çoklu sayfa tarama kapsamı', severity: 'medium', detail: `${sampledPages.length} sayfa örneklendi`, recommendation: 'İç link yapısını ve taranabilir sayfa kapsamını güçlendir.' });
  add(pagesWithoutTitle === 0 && duplicateTitles === 0, { key: 'site-titles', title: 'Site geneli title kalitesi', severity: 'high', detail: `${pagesWithoutTitle} eksik, ${duplicateTitles} tekrar eden title.${formatEvidenceUrls(titleEvidence)}`, recommendation: 'Örneklenen tüm sayfalarda benzersiz title kullan.', evidence: titleEvidence });
  add(pagesWithoutDescription === 0 && duplicateDescriptions === 0, { key: 'site-descriptions', title: 'Site geneli description kalitesi', severity: 'medium', detail: `${pagesWithoutDescription} eksik, ${duplicateDescriptions} tekrar eden description.${formatEvidenceUrls(descriptionEvidence)}`, recommendation: 'Önemli sayfalarda özgün meta description kullan.', evidence: descriptionEvidence });
  add(pagesWithoutCanonical === 0, { key: 'site-canonicals', title: 'Site geneli canonical', severity: 'high', detail: `${pagesWithoutCanonical} sayfada canonical eksik.${formatEvidenceUrls(canonicalEvidence)}`, recommendation: 'Taranan tüm indexlenebilir sayfalarda doğru canonical tanımla.', evidence: canonicalEvidence });
  add(pagesBadH1 === 0, { key: 'site-h1', title: 'Site geneli H1 yapısı', severity: 'medium', detail: `${pagesBadH1} sayfada H1 sayısı hatalı.${formatEvidenceUrls(h1Evidence)}`, recommendation: 'Her önemli sayfada tek ve anlamlı H1 kullan.', evidence: h1Evidence });

  const seoKeys = ['http','title','description','canonical','h1','lang','robots','sitemap','schema','content','crawl-coverage','site-titles','site-descriptions','site-canonicals','site-h1'];
  const geoKeys = ['schema','entity','content','canonical','lang','site-canonicals'];
  const aeoKeys = ['aeo','schema','content','h1','site-h1'];
  const aioKeys = ['entity','schema','content','aeo','og','site-titles'];
  const adsKeys = ['analytics','meta','conversion','viewport','http'];

  const seoScore = scoreFromIssues(issues, seoKeys, sampledPages.length);
  const geoScore = scoreFromIssues(issues, geoKeys, sampledPages.length);
  const aeoScore = scoreFromIssues(issues, aeoKeys, sampledPages.length);
  const aioScore = scoreFromIssues(issues, aioKeys, sampledPages.length);
  const adsReadinessScore = scoreFromIssues(issues, adsKeys, sampledPages.length);
  const overallScore = Math.round((seoScore + geoScore + aeoScore + aioScore + adsReadinessScore) / 5);

  return {
    domain: response.url,
    scannedAt: new Date().toISOString(),
    overallScore,
    scores: { seo: seoScore, geo: geoScore, aeo: aeoScore, aio: aioScore, adsReadiness: adsReadinessScore },
    page: { title, description, canonical, h1Count, lang, wordCount, robotsMeta },
    site: {
      sampledCount: sampledPages.length,
      pagesWithoutTitle,
      pagesWithoutDescription,
      pagesWithoutCanonical,
      pagesBadH1,
      duplicateTitles,
      duplicateDescriptions,
      noindexPages,
      pages: sampledPages,
    },
    tracking,
    issues,
  };
}
