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
        { name: 'QCT Studio', description: 'استارت‌آپ رشد دیجیتال که سیستم‌های چندزبانه وب، e-commerce، SEO/GEO و اتوماسیون AI را برای کسب‌وکارهای بالکان توسعه می‌دهد.', status: 'استارت‌آپ فعال', region: 'بالکان', url: 'https://qctstudio.com', aria: 'بازدید از وب‌سایت QCT Studio' },
        { name: 'QCT Commerce', description: 'ساختاری که تجارت دیجیتال، فروش مستقیم و e-commerce مقیاس‌پذیر را برای تولیدکنندگان و کسب‌وکارهای ترکیه توسعه می‌دهد.', status: 'استارت‌آپ فعال', region: 'ترکیه', url: 'https://qctcommerce.com', aria: 'بازدید از وب‌سایت QCT Commerce', image: 'commerce' },
        { name: 'Mythborn', description: 'یک برند مستقل و چندزبانه برای تجربه‌های تاروت، کاتینا، طالع‌بینی و خودشناسی در یک پلتفرم دیجیتال.', status: 'برند فعال و مستقل', region: 'بین‌المللی', url: 'https://mythborn.co/', aria: 'بازدید از وب‌سایت Mythborn' },
        { name: 'Sales Intelligence Systems', description: 'سیستم‌های پژوهشی مبتنی بر AI برای شناسایی مشتریان احتمالی، سیگنال‌های فرصت، اولویت‌بندی شرکت‌ها و عملیات فروش.', status: 'سیستم داخلی', region: 'عملیات فروش', aria: 'اطلاعات درباره Sales Intelligence Systems' },
        { name: 'AI Operations Framework', description: 'سیستم کاری مبتنی بر AI برای استانداردسازی پژوهش، محتوا، پیشنهادها، پروژه‌ها و فرایندهای عملیاتی.', status: 'سیستم داخلی', region: 'عملیات', aria: 'اطلاعات درباره AI Operations Framework' },
      ],
    },
    expertise: {
      label: 'تخصص',
      title: 'تخصصی که تصمیم‌های تجاری را با پژوهش، اعتبارسنجی و اجرا پیوند می‌دهد.',
      lead: 'استراتژی، فناوری و اجرای روزمره بدون فاصله به یک هدف تجاری واحد متصل می‌شوند.',
      groups: [
        { title: 'تجارت بین‌المللی', items: ['فرصت‌های واردات و صادرات', 'تطبیق محصول و بازار', 'هماهنگی خریدار و تولیدکننده', 'مذاکره تجاری', 'توسعه تجارت فرامرزی'] },
        { title: 'تأمین راهبردی و اعتبارسنجی', items: ['پژوهش تولیدکننده و تأمین‌کننده', 'اعتبارسنجی تأمین‌کننده', 'تحلیل قیمت و ظرفیت', 'هماهنگی کیفیت و اسناد', 'فرایندهای RFQ و استعلام قیمت'] },
        { title: 'رشد تجاری و توسعه بازار', items: ['استراتژی ورود به بازار', 'پژوهش محصول و بازار', 'هماهنگی عملیات تجاری', 'تجارت دیجیتال B2B', 'سیستم‌های فروش مستقیم'] },
        { title: 'سیستم‌های دیجیتال و AI', items: ['جریان‌های پژوهش تأمین‌کننده', 'هوشمندی فروش', 'تحلیل شرکت و فرصت', 'مدیریت دانش', 'استانداردسازی عملیات'] },
      ],
      definitions: 'SEO: بهینه‌سازی موتور جستجو · GEO: بهینه‌سازی موتورهای مولد · AEO: بهینه‌سازی موتورهای پاسخگو · AIO: بهینه‌سازی هوش مصنوعی',
    },
    journey: {
      label: 'مسیر بنیان‌گذار',
      title: 'از عملیات تا توسعه استارت‌آپ‌ها.',
      lead: 'خط زمانی نشان می‌دهد که چگونه تمرکز کاری با گذشت زمان گسترش یافته است.',
      items: [
        { year: '2019', title: 'عملیات e-commerce', description: 'کانال‌های فروش، جریان‌های سفارش، تجربه مشتری و عملیات روزمره تجاری.' },
        { year: '2023', title: 'رهبری تجارت و رشد', description: 'پیوند برنامه‌ریزی تجاری با کانال‌های رشد دیجیتال.' },
        { year: '2024', title: 'هدایت بازاریابی دیجیتال', description: 'مدیریت یکپارچه محتوا، عملکرد، نرخ تبدیل و برند.' },
        { year: '2026', title: 'QCT Studio', description: 'سیستم‌های چندزبانه رشد دیجیتال برای کسب‌وکارهای بالکان.' },
        { year: '2026', title: 'QCT Commerce', description: 'ساختارهای تجارت دیجیتال برای کسب‌وکارهای ترکیه.' },
        { year: '2026', title: 'سیستم‌های AI و استارت‌آپ‌های جدید', description: 'سیستم‌های کاربردی AI برای پژوهش، فروش و عملیات.' },
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
      body: 'اگر روی یک استارت‌آپ جدید، ساختار e-commerce، سیستم رشد یا عملیات مبتنی بر AI کار می‌کنید، می‌توانید مستقیماً ارتباط بگیرید.',
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
} satisfies Record<Locale, SiteContent>;
