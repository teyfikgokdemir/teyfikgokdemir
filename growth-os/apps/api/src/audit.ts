import * as cheerio from 'cheerio';

export type AuditIssue = {
  key: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'pass' | 'fail' | 'warning';
  detail: string;
  recommendation: string;
};

const normalizeDomain = (input: string) => {
  const value = input.trim();
  return /^https?:\/\//i.test(value) ? value.replace(/\/$/, '') : `https://${value.replace(/\/$/, '')}`;
};

const scoreFromIssues = (issues: AuditIssue[], keys: string[]) => {
  const selected = issues.filter((issue) => keys.includes(issue.key));
  if (!selected.length) return 100;
  let score = 100;
  for (const issue of selected) {
    if (issue.status === 'pass') continue;
    const penalty = issue.severity === 'critical' ? 30 : issue.severity === 'high' ? 18 : issue.severity === 'medium' ? 10 : 4;
    score -= penalty;
  }
  return Math.max(0, Math.min(100, score));
};

export async function runAudit(inputDomain: string) {
  const domain = normalizeDomain(inputDomain);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(domain, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'GrowthOS-AuditBot/0.1 (+private audit)' },
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
  const [robotsRes, sitemapRes] = await Promise.allSettled([
    fetch(robotsUrl, { redirect: 'follow' }),
    fetch(sitemapUrl, { redirect: 'follow' }),
  ]);
  const robotsOk = robotsRes.status === 'fulfilled' && robotsRes.value.ok;
  const sitemapOk = sitemapRes.status === 'fulfilled' && sitemapRes.value.ok;

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

  const seoKeys = ['http','title','description','canonical','h1','lang','robots','sitemap','schema','content'];
  const geoKeys = ['schema','entity','content','canonical','lang'];
  const aeoKeys = ['aeo','schema','content','h1'];
  const aioKeys = ['entity','schema','content','aeo','og'];
  const adsKeys = ['analytics','meta','conversion','viewport','http'];

  const seoScore = scoreFromIssues(issues, seoKeys);
  const geoScore = scoreFromIssues(issues, geoKeys);
  const aeoScore = scoreFromIssues(issues, aeoKeys);
  const aioScore = scoreFromIssues(issues, aioKeys);
  const adsReadinessScore = scoreFromIssues(issues, adsKeys);
  const overallScore = Math.round((seoScore + geoScore + aeoScore + aioScore + adsReadinessScore) / 5);

  return {
    domain: response.url,
    scannedAt: new Date().toISOString(),
    overallScore,
    scores: { seo: seoScore, geo: geoScore, aeo: aeoScore, aio: aioScore, adsReadiness: adsReadinessScore },
    page: { title, description, canonical, h1Count, lang, wordCount, robotsMeta },
    tracking,
    issues,
  };
}
