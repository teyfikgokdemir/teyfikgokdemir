import type { Locale } from '../i18n/locales';

export type HomeFaqItem = {
  question: string;
  answer: string;
};

export type HomeFaqContent = {
  eyebrow: string;
  title: string;
  lead: string;
  items: HomeFaqItem[];
};

export const homeFaq: Record<Locale | 'fa', HomeFaqContent> = {
  tr: {
    eyebrow: 'Çalışma çerçevesi',
    title: 'Sık sorulan ticari sorular.',
    lead: 'İlk değerlendirme; ürün, pazar, karşı taraf ve operasyon gerçeklerini aynı karar çerçevesinde ele alır.',
    items: [
      {
        question: 'Uluslararası ticaret ve stratejik tedarik çalışmalarını nasıl yapılandırıyorsunuz?',
        answer: 'Çalışmalar; ürün ve pazar araştırması, tedarikçi doğrulama, teklif ve koşul karşılaştırması, risk başlıkları ve uygulanabilir sonraki adım üzerinden ilerler. Operasyonel tedarik ve ticaret akışları CTSEG tarafından yapılandırılır.',
      },
      {
        question: 'Kişisel site ile CTSEG arasındaki fark nedir?',
        answer: 'Bu site, Teyfik Gökdemir’in kurucu yaklaşımını, uzmanlık alanlarını ve çalışma modelini açıklar. CTSEG ise stratejik tedarik, tedarikçi doğrulama, RFQ, teklif, belge ve lojistik koordinasyonunun yürütüldüğü ana ticari yapıdır.',
      },
      {
        question: 'Hangi tür ticari fırsatlar değerlendirilebilir?',
        answer: 'Ürün–pazar eşleştirme, üretici ve tedarikçi araştırması, uluslararası iş geliştirme, toptan ürün tedariki, private label ve sınır ötesi operasyon koordinasyonu değerlendirme kapsamındadır.',
      },
      {
        question: 'İlk görüşmede hangi bilgiler gereklidir?',
        answer: 'Ürün veya hizmet tanımı, hedef pazar, beklenen hacim, mevcut tedarik veya satış durumu, zaman planı ve varsa teknik ya da ticari kısıtlar ilk değerlendirmeyi hızlandırır.',
      },
    ],
  },
  en: {
    eyebrow: 'Working framework',
    title: 'Frequently asked commercial questions.',
    lead: 'An initial assessment considers the product, market, counterparties and operational realities within the same decision framework.',
    items: [
      {
        question: 'How are international trade and strategic sourcing engagements structured?',
        answer: 'Work begins with product and market research, supplier verification, comparison of quotations and terms, risk considerations and a clear next executable step. Operational sourcing and trade workflows are structured through CTSEG.',
      },
      {
        question: 'What is the difference between this personal site and CTSEG?',
        answer: 'This site explains Teyfik Gökdemir’s founder perspective, specialist areas and working model. CTSEG is the principal commercial structure through which strategic sourcing, supplier verification, RFQs, quotations, documentation and logistics coordination are handled.',
      },
      {
        question: 'What kinds of commercial opportunities can be assessed?',
        answer: 'Assessment can cover product–market matching, manufacturer and supplier research, international business development, wholesale sourcing, private label and cross-border operations coordination.',
      },
      {
        question: 'What information is useful for an initial conversation?',
        answer: 'A product or service description, target market, expected volume, current sourcing or sales situation, timeline and any technical or commercial constraints help make the first assessment more efficient.',
      },
    ],
  },
  ru: {
    eyebrow: 'Рабочая рамка',
    title: 'Частые коммерческие вопросы.',
    lead: 'Первичная оценка рассматривает продукт, рынок, стороны сделки и операционную реальность в единой рамке принятия решений.',
    items: [
      {
        question: 'Как структурируется работа по международной торговле и стратегическим закупкам?',
        answer: 'Работа включает исследование продукта и рынка, проверку поставщика, сравнение предложений и условий, оценку рисков и определение следующего практического шага. Операционные закупки и торговые процессы структурируются через CTSEG.',
      },
      {
        question: 'В чем разница между этим личным сайтом и CTSEG?',
        answer: 'Этот сайт раскрывает подход Тейфика Гёкдемира как основателя, его специализацию и модель работы. CTSEG — основная коммерческая структура для стратегических закупок, проверки поставщиков, RFQ, предложений, документов и логистической координации.',
      },
      {
        question: 'Какие коммерческие возможности можно рассмотреть?',
        answer: 'Можно оценить соответствие продукта и рынка, поиск производителей и поставщиков, международное развитие бизнеса, оптовые поставки, private label и координацию трансграничных операций.',
      },
      {
        question: 'Какая информация нужна для первого разговора?',
        answer: 'Описание продукта или услуги, целевой рынок, ожидаемый объем, текущая ситуация с поставками или продажами, сроки и технические либо коммерческие ограничения помогают провести первую оценку эффективнее.',
      },
    ],
  },
  mk: {
    eyebrow: 'Работна рамка',
    title: 'Често поставувани комерцијални прашања.',
    lead: 'Почетната процена ги разгледува производот, пазарот, страните и оперативната реалност во една рамка за одлука.',
    items: [
      {
        question: 'Како се структурира работата за меѓународна трговија и стратешко снабдување?',
        answer: 'Работата започнува со истражување на производот и пазарот, проверка на добавувачот, споредба на понуди и услови, процена на ризик и јасен следен чекор. Оперативното снабдување и трговските процеси се структурираат преку CTSEG.',
      },
      {
        question: 'Која е разликата меѓу овој личен сајт и CTSEG?',
        answer: 'Овој сајт ги објаснува пристапот на Teyfik Gökdemir како основач, областите на експертиза и моделот на работа. CTSEG е главната комерцијална структура за стратешко снабдување, проверка на добавувачи, RFQ, понуди, документација и логистика.',
      },
      {
        question: 'Кои комерцијални можности може да се разгледаат?',
        answer: 'Процената може да опфати усогласување производ–пазар, истражување на производители и добавувачи, меѓународен развој на бизнис, големопродажно снабдување, private label и координација на прекугранични операции.',
      },
      {
        question: 'Кои информации се корисни за првиот разговор?',
        answer: 'Опис на производот или услугата, целен пазар, очекуван обем, тековна состојба со снабдување или продажба, временска рамка и технички или комерцијални ограничувања ја прават почетната процена поефикасна.',
      },
    ],
  },
  sr: {
    eyebrow: 'Radni okvir',
    title: 'Česta komercijalna pitanja.',
    lead: 'Početna procena sagledava proizvod, tržište, strane i operativnu realnost u istom okviru za donošenje odluka.',
    items: [
      {
        question: 'Kako se strukturira rad u međunarodnoj trgovini i strateškoj nabavci?',
        answer: 'Rad počinje istraživanjem proizvoda i tržišta, proverom dobavljača, poređenjem ponuda i uslova, razmatranjem rizika i jasnim narednim korakom. Operativna nabavka i trgovinski tokovi strukturiraju se kroz CTSEG.',
      },
      {
        question: 'Koja je razlika između ovog ličnog sajta i CTSEG-a?',
        answer: 'Ovaj sajt objašnjava pristup Teyfika Gökdemira kao osnivača, oblasti stručnosti i model rada. CTSEG je glavna komercijalna struktura za stratešku nabavku, proveru dobavljača, RFQ, ponude, dokumentaciju i logističku koordinaciju.',
      },
      {
        question: 'Koje komercijalne prilike mogu da se procene?',
        answer: 'Procena može obuhvatiti usklađivanje proizvoda i tržišta, istraživanje proizvođača i dobavljača, međunarodni razvoj poslovanja, veleprodajno snabdevanje, private label i koordinaciju prekograničnih operacija.',
      },
      {
        question: 'Koje informacije su korisne za prvi razgovor?',
        answer: 'Opis proizvoda ili usluge, ciljno tržište, očekivani obim, trenutna situacija nabavke ili prodaje, rokovi i tehnička ili komercijalna ograničenja pomažu da početna procena bude efikasnija.',
      },
    ],
  },
  sq: {
    eyebrow: 'Korniza e punës',
    title: 'Pyetjet më të shpeshta tregtare.',
    lead: 'Vlerësimi fillestar shqyrton produktin, tregun, palët dhe realitetin operacional brenda të njëjtës kornizë vendimmarrjeje.',
    items: [
      {
        question: 'Si strukturohen angazhimet për tregtinë ndërkombëtare dhe furnizimin strategjik?',
        answer: 'Puna fillon me kërkimin e produktit dhe tregut, verifikimin e furnitorit, krahasimin e ofertave dhe kushteve, shqyrtimin e rrezikut dhe një hap të qartë pasues. Furnizimi operacional dhe proceset tregtare strukturohen përmes CTSEG.',
      },
      {
        question: 'Cili është ndryshimi mes këtij sajti personal dhe CTSEG?',
        answer: 'Ky sajt shpjegon qasjen e Teyfik Gökdemir si themelues, fushat e ekspertizës dhe modelin e punës. CTSEG është struktura kryesore tregtare për furnizim strategjik, verifikim furnitorësh, RFQ, oferta, dokumentacion dhe koordinim logjistik.',
      },
      {
        question: 'Çfarë lloj mundësish tregtare mund të vlerësohen?',
        answer: 'Vlerësimi mund të mbulojë përputhjen produkt–treg, kërkimin e prodhuesve dhe furnitorëve, zhvillimin ndërkombëtar të biznesit, furnizimin me shumicë, private label dhe koordinimin e operacioneve ndërkufitare.',
      },
      {
        question: 'Çfarë informacioni është i dobishëm për bisedën e parë?',
        answer: 'Përshkrimi i produktit ose shërbimit, tregu i synuar, vëllimi i pritur, gjendja aktuale e furnizimit ose shitjes, afati kohor dhe kufizimet teknike ose tregtare e bëjnë vlerësimin fillestar më efikas.',
      },
    ],
  },
  fa: {
    eyebrow: 'چارچوب همکاری',
    title: 'پرسش‌های رایج تجاری.',
    lead: 'ارزیابی اولیه محصول، بازار، طرف‌های معامله و واقعیت‌های عملیاتی را در یک چارچوب تصمیم‌گیری بررسی می‌کند.',
    items: [
      {
        question: 'همکاری در تجارت بین‌الملل و تأمین راهبردی چگونه ساختار می‌یابد؟',
        answer: 'کار با تحقیق محصول و بازار، اعتبارسنجی تأمین‌کننده، مقایسه پیشنهادها و شرایط، بررسی ریسک و تعیین گام اجرایی بعدی آغاز می‌شود. جریان‌های عملیاتی تأمین و تجارت از طریق CTSEG ساختار می‌یابد.',
      },
      {
        question: 'تفاوت این وب‌سایت شخصی با CTSEG چیست؟',
        answer: 'این وب‌سایت رویکرد بنیان‌گذار، حوزه‌های تخصص و مدل کاری Teyfik Gökdemir را توضیح می‌دهد. CTSEG ساختار اصلی تجاری برای تأمین راهبردی، اعتبارسنجی تأمین‌کننده، RFQ، پیشنهادها، مستندات و هماهنگی لجستیک است.',
      },
      {
        question: 'چه فرصت‌های تجاری قابل ارزیابی هستند؟',
        answer: 'ارزیابی می‌تواند تطبیق محصول و بازار، تحقیق تولیدکننده و تأمین‌کننده، توسعه کسب‌وکار بین‌المللی، تأمین عمده، private label و هماهنگی عملیات فرامرزی را پوشش دهد.',
      },
      {
        question: 'برای گفت‌وگوی اولیه چه اطلاعاتی مفید است؟',
        answer: 'شرح محصول یا خدمت، بازار هدف، حجم مورد انتظار، وضعیت فعلی تأمین یا فروش، زمان‌بندی و هر محدودیت فنی یا تجاری به ارزیابی اولیه دقیق‌تر کمک می‌کند.',
      },
    ],
  },
  zh: {
    eyebrow: '合作框架',
    title: '常见商业与合作咨询',
    lead: '在同一个决策框架内，系统评估产品特性、目标市场、合作各方资质与真实运营落地。',
    items: [
      {
        question: '国际贸易与战略采购的合作流程是如何开展的？',
        answer: '合作通常始于深度产品与市场调研、供应商与制造商实地核验、综合比价与商务条款权衡、潜在风险研判以及制定明确的下一步执行方案。具体的采购与贸易落地工作均由 CTSEG 统一承接与推进。',
      },
      {
        question: '该个人网站与 CTSEG 之间是什么关系？',
        answer: '本站阐述 Teyfik Gökdemir 的创始人视角、专业专长与跨国业务工作理念。CTSEG 则是由其创立并运营的核心商业实体，负责战略采购、供应商核验、RFQ 询报价管理、贸易合同与跨国物流清关等具体业务的执行。',
      },
      {
        question: '目前可以对接和评估哪些类型的商业合作？',
        answer: '涵盖中国与土耳其之间的产品–市场匹配、制造商与供应链对接、大宗原料与工业品采购、自有品牌 (Private Label) 定制、跨境全渠道分销以及土耳其本土市场进入战略咨询。',
      },
      {
        question: '初次交流时，提供哪些信息有助于提升评估效率？',
        answer: '提供清晰的产品规格或技术参数、目标市场需求、预期采购/销售规模、当前供应链状况、时间节点规划以及任何已知的合规或商业限制，将极大加快初次评估的精准度。',
      },
    ],
  },
};

export const faqSchema = (locale: Locale | 'fa', origin = 'https://teyfikgokdemir.com') => ({
  '@type': 'FAQPage',
  '@id': `${origin}${locale === 'tr' ? '/' : `/${locale}/`}#questions`,
  mainEntity: homeFaq[locale].items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});
