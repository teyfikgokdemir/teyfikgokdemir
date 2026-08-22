import type { Locale } from './locales';

export type Venture = {
  name: string;
  description: string;
  status: string;
  region: string;
  url?: string;
  aria: string;
  image?: 'commerce' | 'ctseg';
};

export type SiteContent = {
  seo: { title: string; description: string };
  a11y: { skip: string; language: string; menuOpen: string; menuClose: string; external: string };
  nav: { ventures: string; expertise: string; journey: string; contact: string };
  hero: { eyebrow: string; title: string; description: string; primary: string; secondary: string; summary: string };
  intro: { label: string; title: string; body: string; areas: string[] };
  ventures: { label: string; title: string; lead: string; items: Venture[] };
  expertise: {
    label: string;
    title: string;
    lead: string;
    groups: { title: string; items: string[] }[];
    definitions: string;
  };
  journey: {
    label: string;
    title: string;
    lead: string;
    items: { year: string; title: string; description: string }[];
  };
  method: {
    label: string;
    title: string;
    lead: string;
    steps: { title: string; description: string }[];
  };
  regional: { label: string; title: string; body: string };
  contact: { label: string; title: string; body: string; action: string };
  footer: { rights: string; links: string };
  images: { hero: string; profile: string; executive: string; regional: string; commerce: string };
};

export const content = {
  tr: {
    seo: {
      title: 'Teyfik Gökdemir | Uluslararası Ticaret, Stratejik Tedarik ve CTSEG',
      description: 'CTSEG kurucusu Teyfik Gökdemir; Türkiye, Balkanlar ve uluslararası pazarlar için stratejik tedarik, tedarikçi doğrulama ve ticari operasyon sistemleri kurar.',
    },
    a11y: { skip: 'Ana içeriğe geç', language: 'Dil seçin', menuOpen: 'Menüyü aç', menuClose: 'Menüyü kapat', external: 'yeni sekmede açılır' },
    nav: { ventures: 'Girişimler', expertise: 'Uzmanlık', journey: 'Yolculuk', contact: 'İletişim' },
    hero: {
      eyebrow: 'Türkiye merkezli · Balkanlar odaklı · Uluslararası pazarlar',
      title: 'Dijital girişimleri fikirden çalışan sisteme dönüştürüyorum.',
      description: 'E-ticaret, marka, teknoloji, pazarlama ve operasyonu tek ticari yapı altında birleştirerek ölçeklenebilir girişimler ve satış sistemleri kuruyorum.',
      primary: 'Girişimleri incele',
      secondary: 'İletişime geç',
      summary: 'Teyfik Gökdemir, Türkiye merkezli bir founder ve dijital ticaret operatörüdür; Türkiye, Balkanlar ve uluslararası pazarlar için girişimler ve büyüme sistemleri geliştirir.',
    },
    intro: {
      label: 'Founder yaklaşımı',
      title: 'Strateji ile uygulama arasındaki boşluğu kapatıyorum.',
      body: 'Bir girişimi yalnızca web sitesi veya reklam kampanyası olarak ele almıyorum. Ürün, satış, müşteri deneyimi, operasyon, teknoloji ve büyüme kanallarını birlikte tasarlıyorum.',
      areas: ['Girişim geliştirme', 'Dijital ticaret', 'Büyüme sistemleri', 'AI destekli operasyonlar'],
    },
    ventures: {
      label: 'Girişimler ve sistemler',
      title: 'Farklı pazarlara, ortak bir işletme disipliniyle.',
      lead: 'Her yapı; belirli bir pazar ihtiyacını, uygulanabilir teknoloji ve sürdürülebilir operasyonla bir araya getirir.',
      items: [
        { name: 'QCT Studio', description: 'Arnavutluk, Kuzey Makedonya ve bölgesel işletmeler için çok dilli web, e-ticaret, SEO/GEO ve AI otomasyon sistemleri geliştiren dijital büyüme girişimi.', status: 'Aktif girişim', region: 'Balkanlar', url: 'https://qctstudio.com', aria: 'QCT Studio web sitesini ziyaret et' },
        { name: 'QCT Commerce', description: 'Türkiye’de üretici, toptancı ve büyüyen işletmeler için dijital ticaret, doğrudan satış ve ölçeklenebilir e-ticaret yapılanmaları geliştiren girişim.', status: 'Aktif girişim', region: 'Türkiye', url: 'https://qctcommerce.com', aria: 'QCT Commerce web sitesini ziyaret et', image: 'commerce' },
        { name: 'Mythborn', description: 'Tarot, Katina, astroloji ve kişisel keşif deneyimlerini çok dilli dijital bir platformda birleştiren bağımsız tüketici markası.', status: 'Aktif girişim', region: 'Uluslararası', url: 'https://mythborn.co/', aria: 'Mythborn web sitesini ziyaret et' },
        { name: 'Sales Intelligence Systems', description: 'Potansiyel müşteri araştırması, fırsat sinyalleri, şirket önceliklendirme, CRM hazırlığı ve satış operasyonları için geliştirilen AI destekli araştırma sistemleri.', status: 'İç sistem', region: 'Satış operasyonları', aria: 'Sales Intelligence Systems hakkında bilgi' },
        { name: 'AI Operations Framework', description: 'Araştırma, içerik, teklif, proje, ekip ve operasyon süreçlerini standartlaştırmak için geliştirilen AI destekli çalışma sistemi.', status: 'İç sistem', region: 'Operasyon', aria: 'AI Operations Framework hakkında bilgi' },
      ],
    },
    expertise: {
      label: 'Uzmanlık',
      title: 'Ticari sistemin tamamını birlikte ele alan çalışma alanları.',
      lead: 'Strateji, teknoloji ve günlük uygulama birbirinden kopmadan aynı ticari hedefe bağlanır.',
      groups: [
        { title: 'Ticaret', items: ['E-ticaret stratejisi', 'Shopify', 'WooCommerce', 'Pazaryeri operasyonları', 'Dönüşüm oranı optimizasyonu', 'Müşteri yolculuğu', 'Doğrudan tüketiciye satış', 'B2B dijital ticaret'] },
        { title: 'Büyüme', items: ['SEO', 'GEO', 'AEO', 'AIO', 'İçerik stratejisi', 'Meta Ads', 'Google Ads', 'Landing page stratejisi', 'Dijital büyüme planlaması'] },
        { title: 'Operasyon', items: ['Tedarik zinciri', 'Lojistik', 'Proje liderliği', 'Dijital operasyonlar', 'Ekip koordinasyonu', 'Ticari planlama', 'Süreç tasarımı'] },
        { title: 'AI sistemleri', items: ['AI araştırma akışları', 'Satış istihbaratı', 'Süreç otomasyonu', 'AI destekli operasyonlar', 'İçerik sistemleri', 'Potansiyel müşteri araştırması', 'Bilgi yönetimi'] },
      ],
      definitions: 'SEO: Arama Motoru Optimizasyonu · GEO: Üretken Motor Optimizasyonu · AEO: Cevap Motoru Optimizasyonu · AIO: AI Optimizasyonu',
    },
    journey: {
      label: 'Founder yolculuğu',
      title: 'Operasyondan girişim geliştirmeye uzanan birikim.',
      lead: 'Zaman çizgisi, unvan iddiasından çok çalışma odağının nasıl genişlediğini gösterir.',
      items: [
        { year: '2019', title: 'E-ticaret operasyonları', description: 'Satış kanalları, sipariş akışları, müşteri deneyimi ve günlük ticaret operasyonları.' },
        { year: '2023', title: 'Ticaret ve büyüme liderliği', description: 'Ticari planlama ile dijital büyüme kanallarını ortak hedeflerde birleştirme.' },
        { year: '2024', title: 'Dijital pazarlama yönü', description: 'İçerik, performans, dönüşüm ve marka sistemlerini birlikte yönetme.' },
        { year: '2026', title: 'QCT Studio', description: 'Balkan işletmeleri için çok dilli dijital büyüme sistemleri.' },
        { year: '2026', title: 'QCT Commerce', description: 'Türkiye’de üretici ve işletmeler için dijital ticaret yapılanmaları.' },
        { year: '2026', title: 'AI sistemleri ve yeni girişimler', description: 'Araştırma, satış ve operasyon akışlarını destekleyen pratik AI sistemleri.' },
      ],
    },
    method: {
      label: 'Çalışma yöntemi',
      title: 'Bir projeyi nasıl kuruyorum?',
      lead: 'Her proje, kararları uygulamaya bağlayan dört sade aşamayla ilerler.',
      steps: [
        { title: 'Anla', description: 'Pazarı, müşteriyi, iş modelini ve mevcut darboğazları anlamak.' },
        { title: 'Yapılandır', description: 'Teknoloji, satış, içerik ve operasyon yapısını tek sistemde tasarlamak.' },
        { title: 'Kur', description: 'Çalışan web, ticaret, otomasyon ve büyüme sistemlerini uygulamak.' },
        { title: 'Geliştir', description: 'Gerçek veriler ve geri bildirimlerle sistemi sürekli iyileştirmek.' },
      ],
    },
    regional: {
      label: 'Bölgesel bakış',
      title: 'Türkiye’den Balkanlar’a, yerel ihtiyaçlardan uluslararası pazarlara.',
      body: 'Türkiye’deki ticaret ve operasyon deneyimini Balkan pazarlarının çok dilli ve sınır ötesi ihtiyaçlarıyla birleştiriyorum. Geliştirdiğim girişimler yerel gerçekleri korurken uluslararası ölçekte çalışabilecek sistemler üzerine kuruludur.',
    },
    contact: {
      label: 'Yeni bir yapı için',
      title: 'Bir girişimi, satış kanalını veya dijital sistemi birlikte yapılandıralım.',
      body: 'Yeni bir girişim, e-ticaret yapılanması, büyüme sistemi veya AI destekli operasyon üzerinde çalışıyorsanız doğrudan iletişime geçebilirsiniz.',
      action: 'E-posta gönder',
    },
    footer: { rights: '© 2026 Teyfik Gökdemir. Tüm hakları saklıdır.', links: 'Doğrulanmış bağlantılar' },
    images: {
      hero: 'Siyah balıkçı yaka ile Teyfik Gökdemir portresi',
      profile: 'Takım elbiseli Teyfik Gökdemir profil portresi',
      executive: 'Teyfik Gökdemir’in kurucu yolculuğunu temsil eden tam boy portre',
      regional: 'Şehir manzarası önünde Teyfik Gökdemir',
      commerce: 'QCT Commerce etkinliğinde Teyfik Gökdemir',
    },
  },
  en: {
    seo: {
      title: 'Teyfik Gökdemir | International Trade, Strategic Sourcing & CTSEG',
      description: 'CTSEG founder Teyfik Gökdemir builds strategic sourcing, supplier verification and cross-border commercial operating systems for international markets.',
    },
    a11y: { skip: 'Skip to main content', language: 'Choose language', menuOpen: 'Open menu', menuClose: 'Close menu', external: 'opens in a new tab' },
    nav: { ventures: 'Ventures', expertise: 'Expertise', journey: 'Journey', contact: 'Contact' },
    hero: {
      eyebrow: 'Based in Türkiye · Focused on the Balkans · Built for international markets',
      title: 'Building digital ventures that move from strategy to operation.',
      description: 'I connect commerce, technology, marketing and operations to build scalable ventures and practical growth systems.',
      primary: 'Explore ventures',
      secondary: 'Get in touch',
      summary: 'Teyfik Gökdemir is a Türkiye-based founder and digital commerce operator building ventures and growth systems for Türkiye, the Balkans and international markets.',
    },
    intro: {
      label: 'Founder approach',
      title: 'Closing the gap between strategy and execution.',
      body: 'I do not treat a venture as only a website or an advertising campaign. I design product, sales, customer experience, operations, technology and growth channels as one commercial system.',
      areas: ['Venture building', 'Digital commerce', 'Growth systems', 'AI-assisted operations'],
    },
    ventures: {
      label: 'Ventures & systems',
      title: 'Different markets, one operating discipline.',
      lead: 'Each structure connects a clear market need with practical technology and sustainable operations.',
      items: [
        { name: 'QCT Studio', description: 'A digital growth venture developing multilingual web, e-commerce, SEO/GEO and AI automation systems for businesses in Albania, North Macedonia and the wider region.', status: 'Active venture', region: 'Balkans', url: 'https://qctstudio.com', aria: 'Visit the QCT Studio website' },
        { name: 'QCT Commerce', description: 'A venture building digital commerce, direct sales and scalable e-commerce structures for manufacturers, wholesalers and growing businesses in Türkiye.', status: 'Active venture', region: 'Türkiye', url: 'https://qctcommerce.com', aria: 'Visit the QCT Commerce website', image: 'commerce' },
        { name: 'Mythborn', description: 'An independent multilingual consumer brand bringing together Tarot, Katina, astrology and personal discovery experiences in one digital platform.', status: 'Active venture', region: 'International', url: 'https://mythborn.co/', aria: 'Visit the Mythborn website' },
        { name: 'Sales Intelligence Systems', description: 'AI-assisted research systems for lead discovery, opportunity signals, company prioritisation, CRM readiness and sales operations.', status: 'Internal system', region: 'Sales operations', aria: 'Learn about Sales Intelligence Systems' },
        { name: 'AI Operations Framework', description: 'An AI-assisted working system designed to standardise research, content, proposals, projects, teams and operational workflows.', status: 'Internal system', region: 'Operations', aria: 'Learn about the AI Operations Framework' },
      ],
    },
    expertise: {
      label: 'Expertise',
      title: 'Working across the complete commercial system.',
      lead: 'Strategy, technology and daily execution stay connected to the same commercial objective.',
      groups: [
        { title: 'Commerce', items: ['E-commerce strategy', 'Shopify', 'WooCommerce', 'Marketplace operations', 'Conversion rate optimisation', 'Customer journey', 'Direct-to-consumer systems', 'B2B digital commerce'] },
        { title: 'Growth', items: ['SEO', 'GEO', 'AEO', 'AIO', 'Content strategy', 'Meta Ads', 'Google Ads', 'Landing page strategy', 'Digital growth planning'] },
        { title: 'Operations', items: ['Supply chain', 'Logistics', 'Project leadership', 'Digital operations', 'Team coordination', 'Commercial planning', 'Process design'] },
        { title: 'AI Systems', items: ['AI research workflows', 'Sales intelligence', 'Process automation', 'AI-assisted operations', 'Content systems', 'Lead research', 'Knowledge management'] },
      ],
      definitions: 'SEO: Search Engine Optimization · GEO: Generative Engine Optimization · AEO: Answer Engine Optimization · AIO: AI Optimization',
    },
    journey: {
      label: 'Founder journey',
      title: 'From operations to venture building.',
      lead: 'The timeline shows how the focus of the work expanded, without relying on inflated claims.',
      items: [
        { year: '2019', title: 'E-commerce operations', description: 'Sales channels, order flows, customer experience and day-to-day commerce operations.' },
        { year: '2023', title: 'Commerce & growth leadership', description: 'Connecting commercial planning and digital growth channels around shared objectives.' },
        { year: '2024', title: 'Digital marketing direction', description: 'Managing content, performance, conversion and brand systems together.' },
        { year: '2026', title: 'QCT Studio', description: 'Multilingual digital growth systems for Balkan businesses.' },
        { year: '2026', title: 'QCT Commerce', description: 'Digital commerce structures for manufacturers and businesses in Türkiye.' },
        { year: '2026', title: 'AI systems & new ventures', description: 'Practical AI systems supporting research, sales and operational workflows.' },
      ],
    },
    method: {
      label: 'Operating method',
      title: 'How I build a project.',
      lead: 'Each project moves through four clear stages that connect decisions with delivery.',
      steps: [
        { title: 'Understand', description: 'Understand the market, customer, business model and current bottlenecks.' },
        { title: 'Structure', description: 'Design technology, sales, content and operations as one system.' },
        { title: 'Build', description: 'Implement working web, commerce, automation and growth systems.' },
        { title: 'Improve', description: 'Develop the system using real data and feedback.' },
      ],
    },
    regional: {
      label: 'Regional perspective',
      title: 'From Türkiye to the Balkans, from local needs to international markets.',
      body: 'I combine commerce and operations experience from Türkiye with the multilingual, cross-border needs of Balkan markets. The ventures I build respect local realities while being structured to work across international markets.',
    },
    contact: {
      label: 'Build what comes next',
      title: 'Let’s structure a venture, sales channel or digital system.',
      body: 'If you are working on a new venture, e-commerce structure, growth system or AI-assisted operation, you can get in touch directly.',
      action: 'Send an email',
    },
    footer: { rights: '© 2026 Teyfik Gökdemir. All rights reserved.', links: 'Verified links' },
    images: {
      hero: 'Portrait of Teyfik Gökdemir in a black turtleneck',
      profile: 'Professional profile portrait of Teyfik Gökdemir',
      executive: 'Full-length executive portrait representing Teyfik Gökdemir’s founder journey',
      regional: 'Teyfik Gökdemir in front of a city view',
      commerce: 'Teyfik Gökdemir at a QCT Commerce event',
    },
  },
  mk: {
    seo: {
      title: 'Тејфик Ѓокдемир | Меѓународна трговија, стратешко снабдување и CTSEG',
      description: 'Основачот на CTSEG, Тејфик Ѓокдемир, гради системи за стратешко снабдување, проверка на добавувачи и прекугранични комерцијални операции.',
    },
    a11y: { skip: 'Премини на главната содржина', language: 'Избери јазик', menuOpen: 'Отвори мени', menuClose: 'Затвори мени', external: 'се отвора во нов таб' },
    nav: { ventures: 'Потфати', expertise: 'Експертиза', journey: 'Патување', contact: 'Контакт' },
    hero: {
      eyebrow: 'Со седиште во Турција · Фокус на Балканот · За меѓународни пазари',
      title: 'Ги претворам дигиталните идеи во системи што работат.',
      description: 'Ги поврзувам трговијата, технологијата, маркетингот и операциите за да изградам одржливи потфати и практични системи за раст.',
      primary: 'Истражи ги потфатите',
      secondary: 'Контактирај ме',
      summary: 'Тејфик Ѓокдемир е основач и оператор за дигитална трговија од Турција, кој развива потфати и системи за раст за Турција, Балканот и меѓународните пазари.',
    },
    intro: {
      label: 'Пристап на основач',
      title: 'Го поврзувам стратешкото планирање со реалната изведба.',
      body: 'Еден потфат не го гледам само како веб-страница или рекламна кампања. Производот, продажбата, корисничкото искуство, операциите, технологијата и каналите за раст ги дизајнирам како единствен систем.',
      areas: ['Развој на потфати', 'Дигитална трговија', 'Системи за раст', 'Операции поддржани со AI'],
    },
    ventures: {
      label: 'Потфати и системи',
      title: 'Различни пазари, иста оперативна дисциплина.',
      lead: 'Секоја структура поврзува конкретна пазарна потреба со применлива технологија и одржливи операции.',
      items: [
        { name: 'QCT Studio', description: 'Потфат за дигитален раст што развива повеќејазични веб, е-трговски, SEO/GEO и AI автоматизациски системи за компании во Албанија, Северна Македонија и регионот.', status: 'Активен потфат', region: 'Балкан', url: 'https://qctstudio.com', aria: 'Посети ја веб-страницата на QCT Studio' },
        { name: 'QCT Commerce', description: 'Потфат што гради дигитална трговија, директна продажба и скалабилни е-трговски структури за производители, трговци на големо и растечки компании во Турција.', status: 'Активен потфат', region: 'Турција', url: 'https://qctcommerce.com', aria: 'Посети ја веб-страницата на QCT Commerce', image: 'commerce' },
        { name: 'Mythborn', description: 'Независен повеќејазичен потрошувачки бренд што на една дигитална платформа ги обединува искуствата со тарот, Катина, астрологија и лично самооткривање.', status: 'Активен потфат', region: 'Меѓународно', url: 'https://mythborn.co/', aria: 'Посети ја веб-страницата на Mythborn' },
        { name: 'Sales Intelligence Systems', description: 'Истражувачки системи поддржани со AI за потенцијални клиенти, сигнали за можности, приоритизација на компании, CRM подготовка и продажни операции.', status: 'Внатрешен систем', region: 'Продажни операции', aria: 'Информации за Sales Intelligence Systems' },
        { name: 'AI Operations Framework', description: 'Работен систем поддржан со AI за стандардизирање на истражување, содржина, понуди, проекти, тимови и оперативни процеси.', status: 'Внатрешен систем', region: 'Операции', aria: 'Информации за AI Operations Framework' },
      ],
    },
    expertise: {
      label: 'Експертиза',
      title: 'Работа низ целиот комерцијален систем.',
      lead: 'Стратегијата, технологијата и секојдневната изведба остануваат поврзани со иста деловна цел.',
      groups: [
        { title: 'Трговија', items: ['Стратегија за е-трговија', 'Shopify', 'WooCommerce', 'Операции на пазари', 'Оптимизација на конверзија', 'Корисничко патување', 'Директна продажба', 'B2B дигитална трговија'] },
        { title: 'Раст', items: ['SEO', 'GEO', 'AEO', 'AIO', 'Стратегија за содржина', 'Meta Ads', 'Google Ads', 'Стратегија за landing page', 'Планирање дигитален раст'] },
        { title: 'Операции', items: ['Синџир на снабдување', 'Логистика', 'Проектно лидерство', 'Дигитални операции', 'Координација на тим', 'Комерцијално планирање', 'Дизајн на процеси'] },
        { title: 'AI системи', items: ['AI истражувачки текови', 'Продажна интелигенција', 'Автоматизација на процеси', 'Операции со AI', 'Системи за содржина', 'Истражување клиенти', 'Управување со знаење'] },
      ],
      definitions: 'SEO: оптимизација за пребарувачи · GEO: оптимизација за генеративни системи · AEO: оптимизација за одговорни системи · AIO: AI оптимизација',
    },
    journey: {
      label: 'Патување на основачот',
      title: 'Од операции до развој на потфати.',
      lead: 'Временската линија покажува како се проширувал фокусот на работата.',
      items: [
        { year: '2019', title: 'Операции во е-трговија', description: 'Продажни канали, нарачки, корисничко искуство и дневни трговски операции.' },
        { year: '2023', title: 'Лидерство во трговија и раст', description: 'Поврзување на комерцијалното планирање со каналите за дигитален раст.' },
        { year: '2024', title: 'Насока на дигитален маркетинг', description: 'Заедничко управување со содржина, перформанси, конверзија и бренд.' },
        { year: '2026', title: 'QCT Studio', description: 'Повеќејазични системи за дигитален раст за балкански компании.' },
        { year: '2026', title: 'QCT Commerce', description: 'Дигитални трговски структури за компании во Турција.' },
        { year: '2026', title: 'AI системи и нови потфати', description: 'Практични AI системи за истражување, продажба и операции.' },
      ],
    },
    method: {
      label: 'Начин на работа',
      title: 'Како градам проект?',
      lead: 'Секој проект минува низ четири јасни фази што ги поврзуваат одлуките со изведбата.',
      steps: [
        { title: 'Разбери', description: 'Разбирање на пазарот, клиентот, деловниот модел и тесните грла.' },
        { title: 'Структурирај', description: 'Дизајн на технологијата, продажбата, содржината и операциите како еден систем.' },
        { title: 'Изгради', description: 'Примена на функционални веб, трговски, автоматизациски и растечки системи.' },
        { title: 'Подобри', description: 'Развој на системот со реални податоци и повратни информации.' },
      ],
    },
    regional: {
      label: 'Регионална перспектива',
      title: 'Од Турција до Балканот, од локални потреби до меѓународни пазари.',
      body: 'Искуството во трговија и операции од Турција го поврзувам со повеќејазичните и прекуграничните потреби на балканските пазари. Потфатите ги почитуваат локалните реалности и се структурирани за меѓународна примена.',
    },
    contact: {
      label: 'Следната структура',
      title: 'Да структурираме потфат, продажен канал или дигитален систем.',
      body: 'Ако работите на нов потфат, е-трговска структура, систем за раст или операција поддржана со AI, контактирајте ме директно.',
      action: 'Испрати е-пошта',
    },
    footer: { rights: '© 2026 Тејфик Ѓокдемир. Сите права се задржани.', links: 'Потврдени врски' },
    images: {
      hero: 'Портрет на Тејфик Ѓокдемир во црна ролка',
      profile: 'Професионален портрет на Тејфик Ѓокдемир',
      executive: 'Целосен деловен портрет што го претставува патувањето на Тејфик Ѓокдемир',
      regional: 'Тејфик Ѓокдемир пред градски поглед',
      commerce: 'Тејфик Ѓокдемир на настан на QCT Commerce',
    },
  },
  sr: {
    seo: {
      title: 'Teyfik Gökdemir | Međunarodna trgovina, strateška nabavka i CTSEG',
      description: 'Osnivač CTSEG-a Teyfik Gökdemir gradi sisteme strateške nabavke, provere dobavljača i prekograničnih komercijalnih operacija.',
    },
    a11y: { skip: 'Pređi na glavni sadržaj', language: 'Izaberi jezik', menuOpen: 'Otvori meni', menuClose: 'Zatvori meni', external: 'otvara se u novom tabu' },
    nav: { ventures: 'Poduhvati', expertise: 'Ekspertiza', journey: 'Put', contact: 'Kontakt' },
    hero: {
      eyebrow: 'Sa sedištem u Turskoj · Fokus na Balkanu · Za međunarodna tržišta',
      title: 'Digitalne poduhvate pretvaram iz strategije u sistem koji radi.',
      description: 'Povezujem trgovinu, tehnologiju, marketing i operacije kako bih gradio održive poduhvate i praktične sisteme rasta.',
      primary: 'Pogledaj poduhvate',
      secondary: 'Stupi u kontakt',
      summary: 'Teyfik Gökdemir je osnivač i operater digitalne trgovine iz Turske koji gradi poduhvate i sisteme rasta za Tursku, Balkan i međunarodna tržišta.',
    },
    intro: {
      label: 'Pristup osnivača',
      title: 'Povezujem strategiju sa stvarnom realizacijom.',
      body: 'Poduhvat ne posmatram samo kao veb-sajt ili reklamnu kampanju. Proizvod, prodaju, korisničko iskustvo, operacije, tehnologiju i kanale rasta oblikujem kao jedinstven sistem.',
      areas: ['Razvoj poduhvata', 'Digitalna trgovina', 'Sistemi rasta', 'Operacije uz podršku AI'],
    },
    ventures: {
      label: 'Poduhvati i sistemi',
      title: 'Različita tržišta, ista operativna disciplina.',
      lead: 'Svaka struktura povezuje jasnu potrebu tržišta sa primenljivom tehnologijom i održivim operacijama.',
      items: [
        { name: 'QCT Studio', description: 'Poduhvat digitalnog rasta koji razvija višejezične veb, e-trgovinske, SEO/GEO i AI automatizacione sisteme za kompanije u Albaniji, Severnoj Makedoniji i regionu.', status: 'Aktivan poduhvat', region: 'Balkan', url: 'https://qctstudio.com', aria: 'Poseti veb-sajt QCT Studio' },
        { name: 'QCT Commerce', description: 'Poduhvat koji razvija digitalnu trgovinu, direktnu prodaju i skalabilne e-trgovinske strukture za proizvođače, veletrgovce i rastuće kompanije u Turskoj.', status: 'Aktivan poduhvat', region: 'Turska', url: 'https://qctcommerce.com', aria: 'Poseti veb-sajt QCT Commerce', image: 'commerce' },
        { name: 'Mythborn', description: 'Nezavisan višejezični potrošački brend koji na jednoj digitalnoj platformi objedinjuje iskustva tarota, Katine, astrologije i ličnog otkrivanja.', status: 'Aktivan poduhvat', region: 'Međunarodno', url: 'https://mythborn.co/', aria: 'Poseti veb-sajt Mythborn' },
        { name: 'Sales Intelligence Systems', description: 'Istraživački sistemi uz podršku AI za pronalaženje klijenata, signale prilika, prioritizaciju kompanija, CRM pripremu i prodajne operacije.', status: 'Interni sistem', region: 'Prodajne operacije', aria: 'Saznaj više o Sales Intelligence Systems' },
        { name: 'AI Operations Framework', description: 'Radni sistem uz podršku AI za standardizovanje istraživanja, sadržaja, ponuda, projekata, timova i operativnih procesa.', status: 'Interni sistem', region: 'Operacije', aria: 'Saznaj više o AI Operations Framework' },
      ],
    },
    expertise: {
      label: 'Ekspertiza',
      title: 'Rad kroz čitav komercijalni sistem.',
      lead: 'Strategija, tehnologija i svakodnevna realizacija ostaju povezane sa istim poslovnim ciljem.',
      groups: [
        { title: 'Trgovina', items: ['Strategija e-trgovine', 'Shopify', 'WooCommerce', 'Operacije na tržištima', 'Optimizacija konverzije', 'Korisničko putovanje', 'Direktna prodaja', 'B2B digitalna trgovina'] },
        { title: 'Rast', items: ['SEO', 'GEO', 'AEO', 'AIO', 'Strategija sadržaja', 'Meta Ads', 'Google Ads', 'Landing page strategija', 'Planiranje digitalnog rasta'] },
        { title: 'Operacije', items: ['Lanac snabdevanja', 'Logistika', 'Vođenje projekata', 'Digitalne operacije', 'Koordinacija tima', 'Komercijalno planiranje', 'Dizajn procesa'] },
        { title: 'AI sistemi', items: ['AI istraživački tokovi', 'Prodajna inteligencija', 'Automatizacija procesa', 'Operacije uz AI', 'Sistemi sadržaja', 'Istraživanje klijenata', 'Upravljanje znanjem'] },
      ],
      definitions: 'SEO: optimizacija pretraživača · GEO: optimizacija generativnih sistema · AEO: optimizacija sistema odgovora · AIO: AI optimizacija',
    },
    journey: {
      label: 'Put osnivača',
      title: 'Od operacija do razvoja poduhvata.',
      lead: 'Vremenska linija pokazuje kako se fokus rada postepeno širio.',
      items: [
        { year: '2019', title: 'Operacije e-trgovine', description: 'Prodajni kanali, tokovi porudžbina, korisničko iskustvo i svakodnevne operacije.' },
        { year: '2023', title: 'Vođenje trgovine i rasta', description: 'Povezivanje komercijalnog planiranja sa kanalima digitalnog rasta.' },
        { year: '2024', title: 'Usmeravanje digitalnog marketinga', description: 'Zajedničko upravljanje sadržajem, učinkom, konverzijom i brendom.' },
        { year: '2026', title: 'QCT Studio', description: 'Višejezični sistemi digitalnog rasta za kompanije na Balkanu.' },
        { year: '2026', title: 'QCT Commerce', description: 'Digitalne trgovinske strukture za kompanije u Turskoj.' },
        { year: '2026', title: 'AI sistemi i novi poduhvati', description: 'Praktični AI sistemi za istraživanje, prodaju i operacije.' },
      ],
    },
    method: {
      label: 'Način rada',
      title: 'Kako gradim projekat?',
      lead: 'Svaki projekat prolazi kroz četiri jasne faze koje povezuju odluke sa realizacijom.',
      steps: [
        { title: 'Razumi', description: 'Razumevanje tržišta, klijenta, poslovnog modela i postojećih prepreka.' },
        { title: 'Strukturiraj', description: 'Oblikovanje tehnologije, prodaje, sadržaja i operacija kao jednog sistema.' },
        { title: 'Izgradi', description: 'Primena funkcionalnih veb, trgovinskih, automatizacionih i sistema rasta.' },
        { title: 'Unapredi', description: 'Razvoj sistema na osnovu stvarnih podataka i povratnih informacija.' },
      ],
    },
    regional: {
      label: 'Regionalna perspektiva',
      title: 'Od Turske do Balkana, od lokalnih potreba do međunarodnih tržišta.',
      body: 'Iskustvo u trgovini i operacijama iz Turske povezujem sa višejezičnim i prekograničnim potrebama balkanskih tržišta. Poduhvati poštuju lokalnu realnost i strukturirani su za rad na međunarodnim tržištima.',
    },
    contact: {
      label: 'Sledeća struktura',
      title: 'Strukturirajmo poduhvat, prodajni kanal ili digitalni sistem.',
      body: 'Ako radite na novom poduhvatu, e-trgovinskoj strukturi, sistemu rasta ili operaciji uz podršku AI, javite se direktno.',
      action: 'Pošalji e-poruku',
    },
    footer: { rights: '© 2026 Teyfik Gökdemir. Sva prava zadržana.', links: 'Proverene veze' },
    images: {
      hero: 'Portret Teyfika Gökdemira u crnoj rolci',
      profile: 'Profesionalni portret Teyfika Gökdemira',
      executive: 'Poslovni portret koji predstavlja osnivački put Teyfika Gökdemira',
      regional: 'Teyfik Gökdemir ispred gradskog pogleda',
      commerce: 'Teyfik Gökdemir na događaju QCT Commerce',
    },
  },
  sq: {
    seo: {
      title: 'Teyfik Gökdemir | Tregti ndërkombëtare, furnizim strategjik dhe CTSEG',
      description: 'Themeluesi i CTSEG, Teyfik Gökdemir, ndërton sisteme për furnizim strategjik, verifikim furnitorësh dhe operacione tregtare ndërkufitare.',
    },
    a11y: { skip: 'Kalo te përmbajtja kryesore', language: 'Zgjidh gjuhën', menuOpen: 'Hap menynë', menuClose: 'Mbyll menynë', external: 'hapet në një skedë të re' },
    nav: { ventures: 'Sipërmarrjet', expertise: 'Ekspertiza', journey: 'Rrugëtimi', contact: 'Kontakti' },
    hero: {
      eyebrow: 'Me bazë në Turqi · Fokus në Ballkan · Për tregje ndërkombëtare',
      title: 'I kthej sipërmarrjet digjitale nga strategji në sisteme funksionale.',
      description: 'Bashkoj tregtinë, teknologjinë, marketingun dhe operacionet për të ndërtuar sipërmarrje të qëndrueshme dhe sisteme praktike rritjeje.',
      primary: 'Shiko sipërmarrjet',
      secondary: 'Kontakto',
      summary: 'Teyfik Gökdemir është një themelues dhe operator i tregtisë digjitale me bazë në Turqi, që zhvillon sipërmarrje dhe sisteme rritjeje për Turqinë, Ballkanin dhe tregjet ndërkombëtare.',
    },
    intro: {
      label: 'Qasja e themeluesit',
      title: 'Lidh strategjinë me zbatimin real.',
      body: 'Një sipërmarrje nuk e trajtoj vetëm si faqe interneti ose fushatë reklamuese. Produktin, shitjet, përvojën e klientit, operacionet, teknologjinë dhe kanalet e rritjes i projektoj si një sistem të vetëm.',
      areas: ['Ndërtim sipërmarrjesh', 'Tregti digjitale', 'Sisteme rritjeje', 'Operacione me mbështetje AI'],
    },
    ventures: {
      label: 'Sipërmarrje dhe sisteme',
      title: 'Tregje të ndryshme, e njëjta disiplinë operacionale.',
      lead: 'Çdo strukturë lidh një nevojë të qartë tregu me teknologji praktike dhe operacione të qëndrueshme.',
      items: [
        { name: 'QCT Studio', description: 'Sipërmarrje e rritjes digjitale që zhvillon sisteme shumëgjuhëshe web, e-commerce, SEO/GEO dhe automatizimi AI për biznese në Shqipëri, Maqedoninë e Veriut dhe rajon.', status: 'Sipërmarrje aktive', region: 'Ballkan', url: 'https://qctstudio.com', aria: 'Vizito faqen e QCT Studio' },
        { name: 'QCT Commerce', description: 'Sipërmarrje që ndërton tregti digjitale, shitje direkte dhe struktura e-commerce të shkallëzueshme për prodhues, shitës me shumicë dhe biznese në rritje në Turqi.', status: 'Sipërmarrje aktive', region: 'Turqi', url: 'https://qctcommerce.com', aria: 'Vizito faqen e QCT Commerce', image: 'commerce' },
        { name: 'Mythborn', description: 'Një markë e pavarur shumëgjuhëshe për konsumatorët, që bashkon në një platformë digjitale përvoja të Tarotit, Katinës, astrologjisë dhe zbulimit personal.', status: 'Sipërmarrje aktive', region: 'Ndërkombëtare', url: 'https://mythborn.co/', aria: 'Vizito faqen e Mythborn' },
        { name: 'Sales Intelligence Systems', description: 'Sisteme kërkimi me AI për klientë potencialë, sinjale mundësish, përparësi kompanish, përgatitje CRM dhe operacione shitjeje.', status: 'Sistem i brendshëm', region: 'Operacione shitjeje', aria: 'Mëso për Sales Intelligence Systems' },
        { name: 'AI Operations Framework', description: 'Sistem pune me AI për standardizimin e kërkimit, përmbajtjes, ofertave, projekteve, ekipeve dhe proceseve operacionale.', status: 'Sistem i brendshëm', region: 'Operacione', aria: 'Mëso për AI Operations Framework' },
      ],
    },
    expertise: {
      label: 'Ekspertiza',
      title: 'Punë në të gjithë sistemin tregtar.',
      lead: 'Strategjia, teknologjia dhe zbatimi i përditshëm mbeten të lidhura me të njëjtin objektiv tregtar.',
      groups: [
        { title: 'Tregti', items: ['Strategji e-commerce', 'Shopify', 'WooCommerce', 'Operacione marketplace', 'Optimizim konvertimi', 'Udhëtimi i klientit', 'Shitje direkte', 'Tregti digjitale B2B'] },
        { title: 'Rritje', items: ['SEO', 'GEO', 'AEO', 'AIO', 'Strategji përmbajtjeje', 'Meta Ads', 'Google Ads', 'Strategji landing page', 'Planifikim i rritjes digjitale'] },
        { title: 'Operacione', items: ['Zinxhir furnizimi', 'Logjistikë', 'Drejtim projektesh', 'Operacione digjitale', 'Koordinim ekipi', 'Planifikim tregtar', 'Projektim procesesh'] },
        { title: 'Sisteme AI', items: ['Rrjedha kërkimi me AI', 'Inteligjencë shitjesh', 'Automatizim procesesh', 'Operacione me AI', 'Sisteme përmbajtjeje', 'Kërkim klientësh', 'Menaxhim njohurish'] },
      ],
      definitions: 'SEO: Optimizim për Motorët e Kërkimit · GEO: Optimizim për Motorët Gjenerues · AEO: Optimizim për Motorët e Përgjigjeve · AIO: Optimizim AI',
    },
    journey: {
      label: 'Rrugëtimi i themeluesit',
      title: 'Nga operacionet te ndërtimi i sipërmarrjeve.',
      lead: 'Kronologjia tregon si është zgjeruar fokusi i punës me kalimin e kohës.',
      items: [
        { year: '2019', title: 'Operacione e-commerce', description: 'Kanale shitjeje, porosi, përvojë klienti dhe operacione të përditshme tregtare.' },
        { year: '2023', title: 'Drejtim tregtie dhe rritjeje', description: 'Lidhja e planifikimit tregtar me kanalet e rritjes digjitale.' },
        { year: '2024', title: 'Drejtim marketingu digjital', description: 'Menaxhim i përbashkët i përmbajtjes, performancës, konvertimit dhe markës.' },
        { year: '2026', title: 'QCT Studio', description: 'Sisteme shumëgjuhëshe të rritjes digjitale për biznese në Ballkan.' },
        { year: '2026', title: 'QCT Commerce', description: 'Struktura të tregtisë digjitale për biznese në Turqi.' },
        { year: '2026', title: 'Sisteme AI dhe sipërmarrje të reja', description: 'Sisteme praktike AI për kërkim, shitje dhe operacione.' },
      ],
    },
    method: {
      label: 'Mënyra e punës',
      title: 'Si e ndërtoj një projekt?',
      lead: 'Çdo projekt kalon në katër faza të qarta që lidhin vendimet me zbatimin.',
      steps: [
        { title: 'Kupto', description: 'Kuptimi i tregut, klientit, modelit të biznesit dhe pengesave aktuale.' },
        { title: 'Strukturo', description: 'Projektimi i teknologjisë, shitjeve, përmbajtjes dhe operacioneve si një sistem.' },
        { title: 'Ndërto', description: 'Zbatimi i sistemeve funksionale web, tregtare, automatizimi dhe rritjeje.' },
        { title: 'Përmirëso', description: 'Zhvillimi i sistemit me të dhëna reale dhe reagime.' },
      ],
    },
    regional: {
      label: 'Perspektiva rajonale',
      title: 'Nga Turqia në Ballkan, nga nevojat lokale në tregjet ndërkombëtare.',
      body: 'Përvojën në tregti dhe operacione nga Turqia e lidh me nevojat shumëgjuhëshe dhe ndërkufitare të tregjeve ballkanike. Sipërmarrjet respektojnë realitetet lokale dhe strukturohen për të funksionuar në tregje ndërkombëtare.',
    },
    contact: {
      label: 'Struktura e radhës',
      title: 'Le të strukturojmë një sipërmarrje, kanal shitjeje ose sistem digjital.',
      body: 'Nëse po punoni mbi një sipërmarrje të re, strukturë e-commerce, sistem rritjeje ose operacion me AI, mund të kontaktoni drejtpërdrejt.',
      action: 'Dërgo email',
    },
    footer: { rights: '© 2026 Teyfik Gökdemir. Të gjitha të drejtat e rezervuara.', links: 'Lidhje të verifikuara' },
    images: {
      hero: 'Portret i Teyfik Gökdemir me golf të zi',
      profile: 'Portret profesional i Teyfik Gökdemir',
      executive: 'Portret ekzekutiv që përfaqëson rrugëtimin e Teyfik Gökdemir',
      regional: 'Teyfik Gökdemir përpara një pamjeje qyteti',
      commerce: 'Teyfik Gökdemir në një aktivitet të QCT Commerce',
    },
  },
  ru: {
    seo: {
      title: 'Тейфик Гёкдемир | Международная торговля, стратегические закупки и CTSEG',
      description: 'Основатель CTSEG Тейфик Гёкдемир создает системы стратегических закупок, верификации поставщиков и международных коммерческих операций в Турции, на Балканах и мировых рынках.',
    },
    a11y: { skip: 'Перейти к основному содержимому', language: 'Выберите язык', menuOpen: 'Открыть меню', menuClose: 'Закрыть меню', external: 'открывается в новой вкладке' },
    nav: { ventures: 'Проекты', expertise: 'Экспертиза', journey: 'Обо мне', contact: 'Контакты' },
    hero: {
      eyebrow: 'Базируется в Турции · Фокус на Балканах · Международные рынки',
      title: 'Я объединяю правильный продукт, правильный рынок и эффективные операции в международной торговле.',
      description: 'Соединяю сети производителей в Турции и на Ближнем Востоке с международными покупателями через системные закупки, верификацию, B2B-коммерцию и цифровые решения.',
      primary: 'Работайте со мной',
      secondary: 'Как я работаю',
      summary: 'Тейфик Гёкдемир — основатель CTSEG, оператор международной торговли и цифровой коммерции. Разрабатывает системы закупок и коммерческого роста для международного B2B.',
    },
    intro: {
      label: 'Подход основателя',
      title: 'Преодолеваю разрыв между стратегией и коммерческим исполнением.',
      body: 'Я не рассматриваю закупки или международную торговлю как разовую сделку. Я строю комплексные процессы: от исследования рынка и аудита фабрик до подготовки RFQ, логистики и цифрового продвижения.',
      areas: ['Международная торговля', 'Стратегические закупки', 'Верификация поставщиков', 'Развитие рынков', 'B2B цифровая коммерция', 'AI-аналитика закупок'],
    },
    ventures: {
      label: 'Коммерческая структура и проекты',
      title: 'CTSEG — центральная торговая операционная структура; другие проекты обеспечивают стратегические возможности.',
      lead: 'CTSEG выступает платформой для международных закупок и торговли. QCT Studio, QCT Commerce и Mythborn развивают цифровые технологии, продажи и автономные продуктовые экосистемы.',
      items: [
        { name: 'QCT Studio', description: 'Digital-студия, создающая многоязычные веб-платформы, e-commerce, SEO/GEO и системы AI-автоматизации для бизнеса на Балканах.', status: 'Активный проект', region: 'Балканы', url: 'https://qctstudio.com', aria: 'Посетить сайт QCT Studio' },
        { name: 'QCT Commerce', description: 'Структура цифровой коммерции, прямого экспорта и масштабируемых e-commerce систем для турецких производителей и дистрибьюторов.', status: 'Активный проект', region: 'Турция', url: 'https://qctcommerce.com', aria: 'Посетить сайт QCT Commerce', image: 'commerce' },
        { name: 'Mythborn', description: 'Независимый потребительский бренд, объединяющий Таро, Катину, астрологию и самопознание на многоязычной цифровой платформе.', status: 'Активный бренд', region: 'Международный', url: 'https://mythborn.co/', aria: 'Посетить сайт Mythborn' },
        { name: 'Sales Intelligence Systems', description: 'AI-системы исследований для поиска потенциальных покупателей, анализа коммерческих сигналов, приоритезации компаний и оптимизации B2B-продаж.', status: 'Внутренняя система', region: 'Операции продаж', aria: 'Информация о системах Sales Intelligence' },
        { name: 'AI Operations Framework', description: 'Система стандартизации процессов исследований, коммерческих предложений, логистики и операций на базе искусственного интеллекта.', status: 'Внутренняя система', region: 'Операции', aria: 'Информация об AI Operations Framework' },
      ],
    },
    expertise: {
      label: 'Экспертиза',
      title: 'Направления работы, связывающие исследования, аудит и коммерческое исполнение.',
      lead: 'Стратегия, технологии и ежедневные торговые операции подчинены единой коммерческой цели.',
      groups: [
        { title: 'Международная торговля', items: ['Импортно-экспортные операции', 'Сопоставление продукта и рынка', 'Координация байеров и фабрик', 'Коммерческие переговоры', 'Трансграничное развитие'] },
        { title: 'Стратегические закупки и аудит', items: ['Поиск и исследование производителей', 'Верификация и аудит поставщиков', 'Анализ цен и производственных мощностей', 'Контроль качества и документации', 'Управление процессами RFQ'] },
        { title: 'Коммерческий рост и развитие', items: ['Стратегия выхода на рынок', 'Исследование спроса и ниш', 'Координация торговых операций', 'B2B цифровая коммерция', 'Прямые каналы дистрибуции'] },
        { title: 'Цифровые и AI системы', items: ['Автоматизация анализа поставщиков', 'Аналитика B2B-продаж', 'Исследование компаний и сделок', 'Управление базой знаний', 'Стандартизация процессов'] },
      ],
      definitions: 'SEO: Оптимизация для поисковых систем · GEO: Оптимизация для генеративных систем · AEO: Оптимизация для диалоговых систем · AIO: AI-оптимизация',
    },
    journey: {
      label: 'Путь основателя',
      title: 'От торговых операций до развития экосистемы проектов.',
      lead: 'Хронология показывает расширение коммерческого и технологического фокуса.',
      items: [
        { year: '2019', title: 'Операции в e-commerce', description: 'Каналы продаж, управление заказами, клиентский сервис и ежедневные торговые процессы.' },
        { year: '2023', title: 'Лидерство в торговле и росте', description: 'Объединение коммерческого планирования с каналами цифрового масштабирования.' },
        { year: '2024', title: 'Стратегический цифровой маркетинг', description: 'Управление контентом, перформанс-маркетингом, конверсией и системами бренда.' },
        { year: '2026', title: 'QCT Studio', description: 'Многоязычные системы цифрового роста для предприятий Балканского региона.' },
        { year: '2026', title: 'QCT Commerce', description: 'Структуры цифровой коммерции для турецких производителей и экспортеров.' },
        { year: '2026', title: 'AI-системы и торговые структуры', description: 'Прикладные AI-инструменты для аналитики закупок, продаж и операционных процессов.' },
      ],
    },
    method: {
      label: 'Метод работы',
      title: 'Как я выстраиваю торговые и продуктовые процессы?',
      lead: 'Каждый проект проходит через четыре последовательных этапа, превращающих анализ в стабильный результат.',
      steps: [
        { title: '01 Исследовать', description: 'Глубокий анализ рынка, требований к продукту, регуляторных норм и коммерческих рисков.' },
        { title: '02 Проверить', description: 'Аудит производителей, проверка мощностей, сертификатов, цен и условий MOQ.' },
        { title: '03 Структурировать', description: 'Формирование прозрачной ценовой модели, условий RFQ, спецификаций и договоров.' },
        { title: '04 Координировать', description: 'Управление производством, контролем качества, логистикой и отгрузкой.' },
      ],
    },
    regional: {
      label: 'Региональный фокус',
      title: 'От Турции до Балкан: от локальных фабрик до международных контрактов.',
      lead: 'Я объединяю производственные мощности Турции и Ближнего Востока с потребностями международных покупателей.',
      body: 'Мой подход учитывает специфику локальных рынков и регуляторные требования, обеспечивая надежность и прозрачность международных поставок.',
    },
    contact: {
      label: 'Свяжитесь со мной',
      title: 'Давайте обсудим ваши задачи по продуктам, рынкам или стратегическим закупкам.',
      body: 'Если вы ищете надежные производственные мощности в Турции, хотите проверить поставщика или выстроить систему B2B-продаж, вы можете связаться напрямую.',
      action: 'Написать email',
    },
    footer: { rights: '© 2026 Тейфик Гёкдемир. Все права защищены.', links: 'Проверенные ссылки' },
    images: {
      hero: 'Портрет Тейфика Гёкдемира в черном водолазке',
      profile: 'Профессиональный портрет Тейфика Гёкдемира',
      executive: 'Деловой портрет Тейфика Гёкдемира',
      regional: 'Тейфик Гёкдемир на фоне городского пейзажа',
      commerce: 'Тейфик Гёкдемир на мероприятии QCT Commerce',
    },
  },
  fa: {
    seo: {
      title: 'تیفیک گوکدمیر | هماهنگ‌کننده تجاری تولیدکنندگان و صادرکنندگان ایرانی',
      description: 'تیفیک گوکدمیر، بنیان‌گذار CTSEG و هماهنگ‌کننده تجاری برای پیوند تولیدکنندگان و صادرکنندگان ایرانی با خریداران در ترکیه، اروپا، آمریکا و دیگر بازارهای هدف.',
    },
    a11y: { skip: 'انتقال به محتوای اصلی', language: 'انتخاب زبان', menuOpen: 'باز کردن منو', menuClose: 'بستن منو', external: 'در زبانه جدید باز می‌شود' },
    nav: { ventures: 'ساختارها', expertise: 'تخصص', journey: 'مسیر', contact: 'تماس' },
    hero: {
      eyebrow: 'مستقر در ترکیه · متمرکز بر بالکان · ساخته‌شده برای بازارهای بین‌المللی',
      title: 'سیستم‌های تجارت بین‌المللی، تأمین راهبردی و رشد دیجیتال را توسعه می‌دهم.',
      description: 'میان ترکیه و بازارهای بین‌المللی؛ شبکه‌های تأمین‌کننده، عملیات تجاری، تجارت دیجیتال و پژوهش‌های مبتنی بر هوش مصنوعی را با دیدگاه بنیان‌گذار متصل می‌کنم.',
      primary: 'بررسی CTSEG',
      secondary: 'گفت‌وگو با تیفیک گوکدمیر',
      summary: 'تیفیک گوکدمیر، بنیان‌گذار CTSEG است. او فرصت‌های تجاری را از طریق پژوهش، اعتبارسنجی، هماهنگی و سیستم‌های رشد کاربردی ساختاردهی می‌کند.',
    },
    intro: {
      label: 'دیدگاه بنیان‌گذار',
      title: 'مدل کاری مستقیم که فرصت‌های تجاری را از پژوهش به عملیات هدایت می‌کند.',
      body: 'پژوهش محصول و بازار، اعتبارسنجی تأمین‌کننده، مدیریت پیشنهاد قیمت، مذاکره تجاری، پرداخت، لجستیک و دیده‌شدن دیجیتال را به عنوان یک سیستم یکپارچه مدیریت می‌کنم.',
      areas: ['تجارت بین‌المللی', 'تأمین راهبردی', 'اعتبارسنجی تأمین‌کننده', 'توسعه بازار', 'تجارت دیجیتال', 'پژوهش با هوش مصنوعی'],
    },
    ventures: {
      label: 'ساختار تجاری و سرمایه‌گذاری‌ها',
      title: 'CTSEG شرکت اصلی تجاری است؛ سایر ساختارها توانمندی‌های پشتیبان را فراهم می‌کنند.',
      lead: 'CTSEG پلتفرم عملیاتی برای تأمین راهبردی و تجارت بین‌المللی است. QCT Studio، QCT Commerce و Mythborn از توانمندی‌های دیجیتال، رشد و توسعه مستقل محصول پشتیبانی می‌کنند.',
      items: [
        { name: 'QCT Studio', description: 'استارت‌آپ رشد دیجیتال که سیستم‌های چندزبانه وب، تجارت الکترونیک، سئو (SEO/GEO) و اتوماسیون هوش مصنوعی را برای کسب‌وکارهای بالکان توسعه می‌دهد.', status: 'استارت‌آپ فعال', region: 'بالکان', url: 'https://qctstudio.com', aria: 'بازدید از وب‌سایت QCT Studio' },
        { name: 'QCT Commerce', description: 'ساختاری که تجارت دیجیتال، فروش مستقیم و تجارت الکترونیک مقیاس‌پذیر را برای تولیدکنندگان و کسب‌وکارهای ترکیه توسعه می‌دهد.', status: 'استارت‌آپ فعال', region: 'ترکیه', url: 'https://qctcommerce.com', aria: 'بازدید از وب‌سایت QCT Commerce', image: 'commerce' },
        { name: 'Mythborn', description: 'یک برند مستقل و چندزبانه برای تجربه‌های تاروت، کاتینا، طالع‌بینی و خودشناسی در یک پلتفرم دیجیتال.', status: 'برند فعال و مستقل', region: 'بین‌المللی', url: 'https://mythborn.co/', aria: 'بازدید از وب‌سایت Mythborn' },
        { name: 'Sales Intelligence Systems', description: 'سیستم‌های پژوهشی مبتنی بر هوش مصنوعی برای شناسایی مشتریان احتمالی، سیگنال‌های فرصت، اولویت‌بندی شرکت‌ها و عملیات فروش.', status: 'سیستم داخلی', region: 'عملیات فروش', aria: 'اطلاعات درباره سیستم‌های هوشمندی فروش' },
        { name: 'AI Operations Framework', description: 'سیستم کاری مبتنی بر هوش مصنوعی برای استانداردسازی پژوهش، محتوا، پیشنهادها، پروژه‌ها و فرایندهای عملیاتی.', status: 'سیستم داخلی', region: 'عملیات', aria: 'اطلاعات درباره چارچوب عملیاتی هوش مصنوعی' },
      ],
    },
    expertise: {
      label: 'تخصص',
      title: 'تخصصی که تصمیم‌های تجاری را با پژوهش، اعتبارسنجی و اجرا پیوند می‌دهد.',
      lead: 'استراتژی، فناوری و اجرای روزمره بدون فاصله به یک هدف تجاری واحد متصل می‌شوند.',
      groups: [
        { title: 'تجارت بین‌المللی', items: ['فرصت‌های واردات و صادرات', 'تطبیق محصول و بازار', 'هماهنگی خریدار و تولیدکننده', 'مذاکره تجاری', 'توسعه تجارت فرامرزی'] },
        { title: 'تأمین راهبردی و اعتبارسنجی', items: ['پژوهش تولیدکننده و تأمین‌کننده', 'اعتبارسنجی تأمین‌کننده', 'تحلیل قیمت و ظرفیت', 'هماهنگی کیفیت و اسناد', 'فرایندهای استعلام قیمت و RFQ'] },
        { title: 'رشد تجاری و توسعه بازار', items: ['استراتژی ورود به بازار', 'پژوهش محصول و بازار', 'هماهنگی عملیات تجاری', 'تجارت دیجیتال B2B', 'سیستم‌های فروش مستقیم'] },
        { title: 'سیستم‌های دیجیتال و هوش مصنوعی', items: ['جریان‌های پژوهش تأمین‌کننده', 'هوشمندی فروش', 'تحلیل شرکت و فرصت', 'مدیریت دانش', 'استانداردسازی عملیات'] },
      ],
      definitions: 'SEO: بهینه‌سازی موتور جستجو · GEO: بهینه‌سازی موتورهای مولد · AEO: بهینه‌سازی موتورهای پاسخگو · AIO: بهینه‌سازی هوش مصنوعی',
    },
    journey: {
      label: 'مسیر بنیان‌گذار',
      title: 'از عملیات تا توسعه استارت‌آپ‌ها.',
      lead: 'خط زمانی نشان می‌دهد که چگونه تمرکز کاری با گذشت زمان گسترش یافته است.',
      items: [
        { year: '2019', title: 'عملیات تجارت الکترونیک', description: 'کانال‌های فروش، جریان‌های سفارش، تجربه مشتری و عملیات روزمره تجاری.' },
        { year: '2023', title: 'رهبری تجارت و رشد', description: 'پیوند برنامه‌ریزی تجاری با کانال‌های رشد دیجیتال.' },
        { year: '2024', title: 'هدایت بازاریابی دیجیتال', description: 'مدیریت یکپارچه محتوا، عملکرد، نرخ تبدیل و برند.' },
        { year: '2026', title: 'QCT Studio', description: 'سیستم‌های چندزبانه رشد دیجیتال برای کسب‌وکارهای بالکان.' },
        { year: '2026', title: 'QCT Commerce', description: 'ساختارهای تجارت دیجیتال برای کسب‌وکارهای ترکیه.' },
        { year: '2026', title: 'سیستم‌های هوش مصنوعی و استارت‌آپ‌ها', description: 'سیستم‌های کاربردی هوش مصنوعی برای پژوهش، فروش و عملیات.' },
      ],
    },
    method: {
      label: 'روش کاری',
      title: 'یک پروژه را چگونه می‌سازم؟',
      lead: 'هر پروژه از چهار مرحله ساده می‌گذرد که تصمیم‌ها را به اجرا متصل می‌کند.',
      steps: [
        { title: 'درک', description: 'شناخت بازار، مشتری، مدل کسب‌وکار و گلوگاه‌های موجود.' },
        { title: 'ساختاردهی', description: 'طراحی فناوری، فروش، محتوا و عملیات به عنوان یک سیستم واحد.' },
        { title: 'ساخت', description: 'پیاده‌سازی سیستم‌های وب، تجارت، اتوماسیون و رشد کاربردی.' },
        { title: 'توسعه', description: 'بهبود مستمر سیستم با داده‌ها و بازخوردهای واقعی.' },
      ],
    },
    regional: {
      label: 'دیدگاه منطقه‌ای',
      title: 'از ترکیه تا بالکان، از نیازهای محلی تا بازارهای بین‌المللی.',
      body: 'تجربه تجارت و عملیات در ترکیه را با نیازهای چندزبانه و فرامرزی بازارهای بالکان ترکیب می‌کنم. ساختارها ضمن احترام به واقعیت‌های محلی، برای کار در بازارهای بین‌المللی مقیاس‌پذیر هستند.',
    },
    contact: {
      label: 'برای ساختار جدید',
      title: 'یک استارت‌آپ، کانال فروش یا سیستم دیجیتال را با هم ساختاردهی کنیم.',
      body: 'اگر روی یک استارت‌آپ جدید، ساختار تجارت الکترونیک، سیستم رشد یا عملیات مبتنی بر هوش مصنوعی کار می‌کنید، می‌توانید مستقیماً ارتباط بگیرید.',
      action: 'ارسال ایمیل',
    },
    footer: { rights: '© 2026 Teyfik Gökdemir. تمامی حقوق محفوظ است.', links: 'پیوندهای تأییدشده' },
    images: {
      hero: 'پرتره تیفیک گوکدمیر با یقه اسکی مشکی',
      profile: 'پرتره حرفه‌ای تیفیک گوکدمیر',
      executive: 'پرتره مدیریتی معرف مسیر بنیان‌گذاری تیفیک گوکدمیر',
      regional: 'تیفیک گوکدمیر در برابر نمای شهری',
      commerce: 'تیفیک گوکدمیر در رویداد QCT Commerce',
    },
  },
  zh: {
    seo: {
      title: 'Teyfik Gökdemir | 国际贸易、战略采购与土耳其商业落地 (CTSEG)',
      description: 'CTSEG 创始人 Teyfik Gökdemir，深耕土耳其、巴尔干及国际市场，为企业提供战略采购、供应商核验、商业拓展与跨境贸易落地系统。',
    },
    a11y: { skip: '跳转至主要内容', language: '选择语言', menuOpen: '打开菜单', menuClose: '关闭菜单', external: '将在新标签页中打开' },
    nav: { ventures: '商业实体', expertise: '专业领域', journey: '历程', contact: '联系' },
    hero: {
      eyebrow: '立足土耳其 · 辐射巴尔干 · 连接国际市场',
      title: '在国际贸易中，连接合适的产品、目标市场与务实的商业运营。',
      description: '以企业决策者视角，整合土耳其与国际市场的供应链资源、商业运营流程、数字化贸易体系与 AI 辅助商业调研。',
      primary: '了解 CTSEG',
      secondary: '与 Teyfik Gökdemir 交流',
      summary: 'Teyfik Gökdemir 是 CTSEG Sanayi ve Ticaret Limited Şirketi 创始人，专注于通过深度调研、严谨核验、资源协调和可落地的增长系统构建国际商业机会。',
    },
    intro: {
      label: '创始人视角',
      title: '从商业调研到运营落地的务实合作模式。',
      body: '我们将产品调研、市场准入、供应商核验、询报价管理、商业谈判、跨境支付、物流清关及数字化可见性整合为统一闭环。作为创始人，我的核心目标是将不确定的商业机遇转化为条理清晰、风险可控、切实可行的商业架构。',
      areas: ['国际贸易', '战略采购', '供应商核验', '市场拓展', '数字化贸易', 'AI 商业调研'],
    },
    ventures: {
      label: '商业架构与实体',
      title: 'CTSEG 为核心商业实体，协同业务构建多维能力支撑。',
      lead: 'CTSEG 是战略采购与国际贸易的核心运营实体；QCT Studio 提供数字化与技术开发能力，QCT Commerce 负责土耳其本地数字化分销布局，Mythborn 则为独立消费者品牌。',
      items: [
        { name: 'QCT Studio', description: '面向巴尔干及区域企业的数字增长机构，提供多语言网站、电商系统、SEO/GEO 搜索可见性与 AI 自动化系统。', status: '运营中实体', region: '巴尔干地区', url: 'https://qctstudio.com', aria: '访问 QCT Studio 官方网站' },
        { name: 'QCT Commerce', description: '面向土耳其本土制造企业与批发商的数字化贸易、全渠道电商落地与直接销售拓展实体。', status: '运营中实体', region: '土耳其', url: 'https://qctcommerce.com', aria: '访问 QCT Commerce 官方网站', image: 'commerce' },
        { name: 'Mythborn', description: '融合塔罗、卡蒂娜、占星与个人探索的多语言独立数字消费品牌。', status: '独立品牌', region: '全球市场', url: 'https://mythborn.co/', aria: '访问 Mythborn 官方网站' },
        { name: 'Sales Intelligence Systems', description: '用于潜在客户调研、商机线索识别、企业画像分析与销售流程准备的 AI 销售智能系统。', status: '内部系统', region: '销售运营', aria: '了解销售智能系统' },
        { name: 'AI Operations Framework', description: '用于标准化商业调研、方案制定、项目协同与日常运营的 AI 赋能工作框架。', status: '内部系统', region: '运营体系', aria: '了解 AI 运营框架' },
      ],
    },
    expertise: {
      label: '专业领域',
      title: '将商业决策建立在扎实调研、严格核验与严谨执行之上。',
      lead: '这不是空洞的服务包装，而是用于评估、推进和落地跨国商业合作的专业工作准则。',
      groups: [
        { title: '国际贸易', items: ['进出口商机评估', '产品与市场匹配', '买家与制造商对接', '跨境商业谈判', '跨国业务拓展'] },
        { title: '战略采购与核验', items: ['制造商与供应链调研', '供应商资质与合规核验', '价格与产能综合分析', '质量标准与认证文件核查', 'RFQ 询价与比价流程'] },
        { title: '商业拓展与市场落地', items: ['土耳其市场进入策略', '产品与本土需求调研', '商业运营全流程协调', 'B2B 数字化贸易', '分销与直销体系建设'] },
        { title: '数字化与 AI 商业系统', items: ['供应链调研工作流', '销售情报与市场信号', '企业背景与机会分析', '知识管理与标准流程', '跨部门运营协同'] },
      ],
      definitions: 'SEO: 搜索引擎优化 · GEO: 生成式引擎优化 · AEO: 问答引擎优化 · AIO: 人工智能优化',
    },
    journey: {
      label: '创业历程',
      title: '从一线商业运营到多元实体构建的专业积累。',
      lead: '时间线展现了工作重心如何一步步扩展并沉淀为系统的商业运营能力。',
      items: [
        { year: '2019', title: '电商与贸易运营', description: '销售渠道布局、订单履行、客户体验与日常贸易运营。' },
        { year: '2023', title: '商业统筹与增长管理', description: '将宏观商业规划与数字化增长渠道有效结合。' },
        { year: '2024', title: '全渠道营销与品牌管理', description: '整合内容生产、绩效转化、品牌沉淀与用户体系。' },
        { year: '2026', title: 'QCT Studio', description: '为巴尔干地区企业打造多语言数字化出海与增长体系。' },
        { year: '2026', title: 'QCT Commerce', description: '为土耳其制造企业构建数字化分销与直销基础设施。' },
        { year: '2026', title: 'CTSEG', description: '专注战略采购、供应商核验与跨国贸易运营的核心商业平台。' },
      ],
    },
    method: {
      label: '工作模式',
      title: '直截了当、注重实据、契合实际运营规律。',
      lead: '每一个商业项目都遵循严谨流程：消除主观假设，厘清合作各方权责，明确可执行的下一步行动。',
      steps: [
        { title: '调研', description: '通过可靠渠道系统梳理产品特性、目标市场、制造商背景及需求信号。' },
        { title: '核验', description: '对比供应商资质、实际产能、质检报告、合规文件、真实价格及商业条款。' },
        { title: '架构', description: '将报价方案、潜在风险、结算方式、国际物流与准入策略转化为清晰决策模型。' },
        { title: '协同', description: '直接、透明地统筹推进合作双方及运营各环节的关键执行节点。' },
      ],
    },
    regional: {
      label: '国际视野',
      title: '连接土耳其商业潜能与国际市场的桥梁。',
      body: '我们致力于将土耳其的制造业产能与采购优势对接给区域和全球买家，同时也协助中国及海外优质企业、品牌和产品顺利进入土耳其市场。每一个商业机会都综合考量产品契合度、合作方资质、法律合规、外汇结算、风险控制及物流现实。',
    },
    contact: {
      label: '战略商业洽谈',
      title: '共同探讨产品定位、市场准入或供应链合作决策。',
      body: '如需在创始人层面进行战略评估、探讨土耳其市场开拓或建立直接商业合作，欢迎直接与我联系。具体的采购执行与贸易业务将由 CTSEG 统一承接推进。',
      action: '发送邮件',
    },
    footer: { rights: '© 2026 Teyfik Gökdemir. 保留所有权利。', links: '官方认证链接' },
    images: {
      hero: 'Teyfik Gökdemir 肖像照',
      profile: 'Teyfik Gökdemir 商务肖像',
      executive: 'Teyfik Gökdemir 管理者肖像',
      regional: 'Teyfik Gökdemir 于城市全景前',
      commerce: 'Teyfik Gökdemir 出席 QCT Commerce 活动',
    },
  },
} satisfies Record<Locale, SiteContent>;
