import type { BlogLocale, BlogSection } from './blog';

export const blogLongFormSections: Record<string, Partial<Record<BlogLocale, BlogSection[]>>> = {
  'chatgpt-ads-2026-ai-native-reklamcilik': {
    ru: [{"heading":"5. Для каких компаний канал особенно интересен?","paragraphs":["AI-native рекламные поверхности особенно интересны компаниям, где покупатель сравнивает варианты, изучает доказательства и задаёт вопросы до покупки. Это B2B-услуги, технические продукты, дорогой e-commerce и сложные коммерческие предложения.","Для импульсных товаров классические performance-каналы могут оставаться эффективнее. Роль ChatGPT Ads должна подтверждаться качеством лидов и реальным revenue, а не новизной формата."]},{"heading":"6. Как подготовить landing page?","paragraphs":["Пользователь из AI-контекста часто уже понимает тему. Landing page должен быстро подтвердить offer, показать кому он подходит, представить доказательства и сделать следующий шаг очевидным.","Hero, evidence, pricing logic, FAQ и CTA должны идти в одной логике без лишних отвлекающих переходов."]},{"heading":"7. Какие KPI отслеживать?","table":{"headers":["Уровень","KPI","Зачем"],"rows":[["Media","CPC / CTR","Показывает первичную эффективность канала"],["Page","Engaged session / CTA rate","Проверяет message match"],["Lead","Qualified lead rate","Оценивает коммерческое качество"],["CRM","Quote / opportunity rate","Показывает потенциал сделки"],["Revenue","CAC / revenue / margin","Показывает реальный бизнес-результат"]]},"paragraphs":["Дешёвый трафик не всегда означает эффективный рост. Низкий CPC при слабом qualified lead rate может сделать привлечение дороже.","Лучше связывать media data с CRM outcome и revenue в одной модели."]},{"heading":"8. Частые вопросы","paragraphs":["Доступность AI-рекламы быстро меняется, поэтому перед запуском нужно проверять актуальные рынки и форматы."],"faq":[{"question":"ChatGPT Ads доступны во всех странах?","answer":"Нет. Доступ зависит от рынка, advertiser access и этапа rollout. Перед бюджетированием нужно проверить официальную доступность."},{"question":"Заменят ли ChatGPT Ads Google или Meta?","answer":"Обычно нет. Это дополнительный intent/discovery канал, роль которого стоит доказать через measurement."},{"question":"Что нужно для первого теста?","answer":"Чёткий offer, доказательства, focused landing page, measurement и CRM source tracking важнее большого объёма контента."}]}],
    tr: [
      { heading:'5. Hangi işletmeler için anlamlı?', paragraphs:[
        'ChatGPT Ads gibi yeni reklam yüzeyleri özellikle karmaşık ürün veya hizmet satan, kullanıcının satın almadan önce araştırma yaptığı ve satış ekibinin lead kalitesine önem verdiği işletmeler için daha anlamlı olabilir. Tek tıklamayla satın alınan düşük değerlendirme süreli ürünlerde klasik performans kanalları hâlâ daha verimli olabilir.',
        'B2B hizmetler, danışmanlık, teknik ürünler, yüksek sepet tutarlı e-commerce ve karşılaştırma gerektiren teklifler için conversational intent daha değerli bir sinyal üretebilir. Ancak bunun doğrulanması için kanal bazlı lead quality ve revenue ölçümü gerekir.'
      ]},
      { heading:'6. Landing page nasıl hazırlanmalı?', paragraphs:[
        'AI-native reklamdan gelen kullanıcı genellikle konu hakkında zaten belirli bir bağlama sahiptir. Bu nedenle landing page sıfırdan uzun bir hikâye anlatmak yerine teklifin ne olduğunu, kimin için uygun olduğunu, hangi kanıtların bulunduğunu ve sonraki adımın ne olduğunu hızlı biçimde göstermelidir.',
        'Hero mesajı reklam vaadiyle tutarlı olmalı; ürün veya hizmet detayları, case study, fiyatlama mantığı, sık sorulan sorular ve net CTA tek akışta yer almalıdır. Gereksiz navigasyon ve mesaj sapması conversion kaybına neden olur.'
      ]},
      { heading:'7. Hangi KPI’lar izlenmeli?', table:{ headers:['Katman','Örnek KPI','Neden önemli?'], rows:[
        ['Medya','CPC / CTR','Kanalın ilk etkileşim verimliliğini gösterir.'],
        ['Sayfa','Engaged session / CTA rate','Mesaj eşleşmesini ve landing page kalitesini gösterir.'],
        ['Lead','Qualified lead rate','Tıklamanın ticari kaliteye dönüşüp dönüşmediğini gösterir.'],
        ['CRM','Quote / opportunity rate','Satış ekibine ulaşan talebin gerçek potansiyelini ölçer.'],
        ['Gelir','CAC / revenue / margin','Kanalın gerçek ticari sonucunu gösterir.']
      ]}, paragraphs:[
        'Yeni bir kanalın başarı kriteri yalnızca ucuz trafik olmamalıdır. Düşük CPC ama düşük qualified lead rate, aslında daha pahalı bir büyüme modeli yaratabilir.',
        'Growth OS mantığında en sağlıklı değerlendirme, medya verisini CRM sonucu ve gelir ile aynı zincirde görmektir.'
      ]},
      { heading:'8. Sık sorulan sorular', paragraphs:[
        'AI reklamcılığı hızlı değiştiği için kanal kullanılabilirliği, ülke erişimi ve reklam formatları kampanya öncesinde güncel olarak doğrulanmalıdır.'
      ], faq:[
        { question:'ChatGPT Ads her ülkede kullanılabilir mi?', answer:'Hayır. Kullanılabilirlik ülkeye, reklamveren erişimine ve ürünün yayın takvimine göre değişebilir. Kampanya planlanmadan önce resmi erişim durumu doğrulanmalıdır.' },
        { question:'ChatGPT Ads Google veya Meta’nın yerine geçer mi?', answer:'Genellikle hayır. Daha doğru yaklaşım, bunu ayrı bir niyet ve keşif kanalı olarak test etmek ve toplam medya karmasındaki rolünü ölçmektir.' },
        { question:'İlk testte ne kadar içerik gerekir?', answer:'Teklif, kanıt, net landing page, ölçüm altyapısı ve CRM bağlantısı hazırsa küçük kontrollü test başlatılabilir. Büyük içerik hacmi yerine doğru bağlam daha önemlidir.' }
      ]}
    ],
    en: [
      { heading:'5. Which businesses are the best fit?', paragraphs:[
        'AI-native ad surfaces are most interesting for businesses where users research, compare and ask questions before buying. Complex B2B services, technical products, higher-ticket e-commerce and consultative offers can benefit more from conversational intent than low-consideration impulse products.',
        'The channel should still earn its place through evidence. Qualified lead rate, opportunity rate and revenue quality matter more than novelty.'
      ]},
      { heading:'6. How should the landing page be prepared?', paragraphs:[
        'A user arriving from an AI conversation often already has context. The landing page should therefore confirm the offer quickly, show who it is for, present proof and make the next action obvious rather than forcing the visitor through a long generic narrative.',
        'Keep the hero aligned with the ad promise, surface evidence and pricing logic early, answer common objections and minimise navigation that sends the user away from the commercial path.'
      ]},
      { heading:'7. What should be measured?', table:{ headers:['Layer','Example KPI','Why it matters'], rows:[
        ['Media','CPC / CTR','Shows initial channel efficiency.'],
        ['Page','Engaged session / CTA rate','Tests message match and landing-page quality.'],
        ['Lead','Qualified lead rate','Shows whether clicks become commercially relevant demand.'],
        ['CRM','Quote / opportunity rate','Measures downstream sales potential.'],
        ['Revenue','CAC / revenue / margin','Shows the true commercial outcome.']
      ]}, paragraphs:[
        'Cheap traffic is not automatically efficient growth. A low CPC paired with weak lead quality can create a more expensive acquisition system overall.',
        'The strongest evaluation model connects media data to CRM outcomes and revenue instead of judging the channel in isolation.'
      ]},
      { heading:'8. Frequently asked questions', paragraphs:[
        'AI advertising products are evolving quickly, so market availability, formats and advertiser access should be verified before any campaign is planned.'
      ], faq:[
        { question:'Is ChatGPT Ads available in every country?', answer:'No. Availability can vary by market, advertiser access and product rollout. Verify current official availability before planning spend.' },
        { question:'Will ChatGPT Ads replace Google or Meta?', answer:'Usually not. It is better treated as an additional intent and discovery channel whose role should be proven through measurement.' },
        { question:'What do I need before the first test?', answer:'A clear offer, evidence, a focused landing page, reliable measurement and CRM source tracking are more important than a large content library.' }
      ]}
    ]
  },
  'agentic-ai-operasyonlari-2026': {
    ru: [{"heading":"5. Где должен оставаться human approval?","paragraphs":["Финансовые, юридические и клиентские обязательства должны оставаться за approval gate даже если агент технически способен выполнить действие. Изменение цены, платежи, контракты, выбор поставщика и обязательства перед клиентом — высокорисковые зоны.","Human-in-the-loop не обязательно замедляет работу: agent выполняет подготовку, а человек входит только в decision points и exceptions."]},{"heading":"6. Какой data standard нужен?","paragraphs":["Качество агента ограничено качеством данных. Если один и тот же клиент, товар или lead по-разному описан в разных системах, автоматизация становится хрупкой.","Перед расширением автономии стоит стандартизировать entities, statuses, sources, owners и timestamps. Data dictionary часто полезнее ещё одного инструмента."]},{"heading":"7. Как измерять успех?","table":{"headers":["Область","Метрика","Цель"],"rows":[["Время","Manual minutes saved","Снизить рутинную нагрузку"],["Качество","Error / exception rate","Контролировать риск"],["Скорость","Cycle time","Ускорить завершение процесса"],["Контроль","Human approval rate","Оставить человека в нужных точках"],["Бизнес","Lead / order / cost impact","Связать операцию с результатом"]]},"paragraphs":["Количество agents или выполненных задач не является бизнес-KPI. Цель — быстрее и стабильнее работать с меньшим числом ошибок."]},{"heading":"8. Частые вопросы","paragraphs":["Безопаснее начинать с ограниченного и обратимого workflow."],"faq":[{"question":"AI agents обязательно заменяют сотрудников?","answer":"Нет. Чаще они сокращают повторяющуюся подготовку и освобождают время для решений, отношений и exceptions."},{"question":"С какого workflow начинать?","answer":"С частого процесса с предсказуемыми inputs, понятными rules, owner и измеримым output."},{"question":"Может ли agent отвечать клиенту напрямую?","answer":"В низкорисковых сценариях — да. Pricing, contracts, complaints и sensitive cases лучше оставить с human approval."}]}],
    tr: [
      { heading:'5. İnsan onayı nerede kalmalı?', paragraphs:[
        'AI agent bir süreci ne kadar iyi yürütürse yürütsün finansal, hukuki veya müşteri taahhüdü doğuran eylemler açık approval mekanizmasına bağlanmalıdır. Özellikle fiyat değişikliği, ödeme, sözleşme, tedarikçi seçimi ve müşteriyle bağlayıcı iletişim yüksek riskli alanlardır.',
        'Human-in-the-loop yaklaşımı verimliliği azaltmak zorunda değildir. Doğru tasarımda insan sadece istisna ve karar noktalarına girer; rutin veri taşıma ve hazırlık agent tarafından yürütülür.'
      ]},
      { heading:'6. Agentic sistem için gerekli veri standardı', paragraphs:[
        'Agent kalitesi doğrudan eriştiği verinin kalitesine bağlıdır. Aynı müşteri farklı sistemlerde farklı isimlerle, aynı ürün farklı SKU formatlarıyla veya aynı lead farklı statülerle tutuluyorsa agent güvenilir karar üretemez.',
        'Bu yüzden AI projesi öncesinde entity, status, source, owner ve timestamp gibi temel alanlar standardize edilmelidir. Veri sözlüğü olmayan şirkette agentic automation genellikle kısa sürede manuel düzeltme yükü yaratır.'
      ]},
      { heading:'7. Başarı nasıl ölçülür?', table:{ headers:['Alan','Ölçüm','Hedef'], rows:[
        ['Zaman','Manual minutes saved','Tekrarlayan iş yükünü azaltmak'],
        ['Kalite','Error / exception rate','Yanlış otomasyonu sınırlamak'],
        ['Hız','Cycle time','Talep veya görevin tamamlanma süresini düşürmek'],
        ['Kontrol','Human approval rate','İnsan müdahalesinin doğru noktalarda kalmasını sağlamak'],
        ['Ticari','Lead / order / cost impact','Operasyon iyileşmesini iş sonucuna bağlamak']
      ]}, paragraphs:[
        'Agent sayısı veya tamamlanan task sayısı tek başına başarı metriği değildir. Amaç daha çok otomasyon değil, daha düşük hata oranıyla daha hızlı ve daha tutarlı operasyon kurmaktır.'
      ]},
      { heading:'8. Sık sorulan sorular', paragraphs:[
        'Agentic AI projelerinde en güvenli başlangıç, sınırları belli ve geri alınabilir bir workflow seçmektir.'
      ], faq:[
        { question:'AI agent çalışanların yerini almak zorunda mı?', answer:'Hayır. En güçlü senaryolar genellikle çalışanların tekrar eden hazırlık işini azaltır ve insanları karar, ilişki ve istisna yönetimine kaydırır.' },
        { question:'Hangi süreçle başlanmalı?', answer:'Yüksek frekanslı, girdileri belirli, kuralları anlaşılır ve sonucu ölçülebilir bir süreç en iyi başlangıç noktasıdır.' },
        { question:'Agent doğrudan müşteriye cevap verebilir mi?', answer:'Düşük riskli ve onaylanmış senaryolarda olabilir; fiyat, sözleşme, şikâyet veya hassas konularda insan onayı daha güvenlidir.' }
      ]}
    ],
    en: [
      { heading:'5. Where should human approval remain?', paragraphs:[
        'Financial, legal and customer-binding actions should stay behind explicit approval gates even when an agent can technically perform them. Pricing changes, payments, supplier selection, contracts and binding customer communication are high-risk actions.',
        'Human-in-the-loop does not have to mean slow. A strong design lets the agent handle routine preparation while people enter only at exceptions and decision points.'
      ]},
      { heading:'6. The data standard agentic systems need', paragraphs:[
        'Agent quality is constrained by data quality. If the same customer, product or lead is represented differently across systems, automation becomes fragile.',
        'Standardise core entities, statuses, sources, owners and timestamps before expanding autonomy. A clear data dictionary is often more valuable than another model or tool.'
      ]},
      { heading:'7. How should success be measured?', table:{ headers:['Area','Metric','Objective'], rows:[
        ['Time','Manual minutes saved','Reduce repetitive work.'],
        ['Quality','Error / exception rate','Control automation risk.'],
        ['Speed','Cycle time','Shorten process completion time.'],
        ['Control','Human approval rate','Keep people at the right decision points.'],
        ['Commercial','Lead / order / cost impact','Connect operations to business outcomes.']
      ]}, paragraphs:[
        'The number of agents or tasks completed is not a business KPI. The objective is a faster and more consistent operation with lower error and clearer accountability.'
      ]},
      { heading:'8. Frequently asked questions', paragraphs:[
        'The safest starting point is a bounded, reversible workflow with clear ownership.'
      ], faq:[
        { question:'Do AI agents have to replace employees?', answer:'No. Strong deployments usually remove repetitive preparation work and move people toward judgement, relationship management and exception handling.' },
        { question:'Which workflow should be automated first?', answer:'Choose a frequent process with predictable inputs, clear rules, known ownership and measurable output.' },
        { question:'Can an agent reply directly to customers?', answer:'It can in low-risk, approved scenarios. Pricing, contracts, complaints and sensitive issues should generally retain human approval.' }
      ]}
    ]
  },
  'ai-arama-gorunurlugu-2026-seo-geo-aeo-aio': {
    ru: [{"heading":"5. Почему важны entities и evidence?","paragraphs":["AI-системы пытаются понять связи между компаниями, людьми, услугами, продуктами и рынками. Brand, founder, service scope, location, market и case-study information должны быть последовательными.","Source links, live work, technical documentation и legal identity уменьшают неоднозначность и усиливают доверие."]},{"heading":"6. Как строить content clusters?","paragraphs":["Сильнее работать не отдельными статьями, а topic cluster: service page, guide, comparison, FAQ, case study и market content, связанные internal links.","Это помогает и classical topical authority, и AI answer systems собирать более последовательный контекст."]},{"heading":"7. Measurement framework","table":{"headers":["Слой","Сигнал","Цель"],"rows":[["Technical SEO","Indexation / CWV / crawl","Базовая доступность"],["Search","Queries / impressions / clicks","Классическая видимость"],["GEO/AEO","AI mentions / cited pages","Видимость в AI answers"],["Content","Topic coverage / internal links","Topical authority"],["Business","Qualified leads / assisted conversions","Коммерческая ценность"]]},"paragraphs":["Не стоит полагаться на один AI-rank score. Лучше комбинировать mentions, citations, referrals и assisted conversions."]},{"heading":"8. Частые вопросы","paragraphs":["SEO, GEO, AEO и AIO устойчивее работают как связанные слои одной системы."],"faq":[{"question":"GEO заменяет SEO?","answer":"Нет. GEO опирается на technical SEO, content quality, entity consistency и evidence."},{"question":"Достаточно ли FAQ для AEO?","answer":"Нет. FAQ полезен, но вся страница должна давать ясные и проверяемые ответы."},{"question":"Когда появляется AI visibility?","answer":"Фиксированного срока нет; влияют technical health, authority, content quality, crawl/index status и внешние сигналы."}]}],
    tr: [
      { heading:'5. Entity ve kanıt katmanı neden önemli?', paragraphs:[
        'AI sistemleri yalnızca anahtar kelime eşleştirmez; şirket, kişi, hizmet, ürün ve pazar arasındaki ilişkileri anlamaya çalışır. Bu nedenle marka adı, kurucu, hizmet kapsamı, adres, pazar ve case study bilgileri farklı sayfalarda tutarlı olmalıdır.',
        'Kanıt katmanı olmadan güçlü iddialar zayıf kalır. Kaynak gösterimi, canlı proje bağlantıları, teknik dokümanlar, şirket bilgileri ve açık sınırlar hem kullanıcı güvenini hem machine understanding kalitesini artırır.'
      ]},
      { heading:'6. İçerik kümeleri nasıl kurulmalı?', paragraphs:[
        'Tek tek blog yazıları yerine topic cluster yaklaşımı daha güçlüdür. Ana hizmet sayfası, açıklayıcı rehber, karşılaştırma yazısı, FAQ, case study ve pazar bazlı içerikler internal linking ile birbirine bağlanmalıdır.',
        'Bu yapı hem klasik SEO’da topical authority oluşturur hem de AI answer sistemlerinin aynı entity hakkında daha fazla tutarlı bağlam bulmasını sağlar.'
      ]},
      { heading:'7. Ölçüm çerçevesi', table:{ headers:['Katman','Takip edilecek sinyal','Amaç'], rows:[
        ['Technical SEO','Indexation / CWV / crawl','Temel erişilebilirlik'],
        ['Search','Queries / impressions / clicks','Klasik görünürlük'],
        ['GEO/AEO','AI mentions / cited pages','AI cevaplarında görünürlük'],
        ['Content','Topic coverage / internal links','Topical authority'],
        ['Business','Qualified leads / assisted conversions','Görünürlüğü ticari sonuçla bağlamak']
      ]}, paragraphs:[
        'AI görünürlüğü henüz klasik ranking kadar standart bir ölçüm alanı değildir. Bu nedenle tek bir “AI rank” skoruna güvenmek yerine mention, citation, referral ve assisted conversion gibi birden fazla sinyal birlikte değerlendirilmelidir.'
      ]},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'GEO, SEO’nun yerine geçer mi?', answer:'Hayır. GEO teknik SEO, içerik kalitesi, entity tutarlılığı ve kanıt katmanı üzerine kurulur.' },
        { question:'AEO için FAQ eklemek yeterli mi?', answer:'Hayır. FAQ faydalıdır ama asıl ihtiyaç doğru sorulara açık, kaynaklı ve sayfa genelinde tutarlı cevap vermektir.' },
        { question:'AI görünürlüğü ne kadar sürede oluşur?', answer:'Tek bir süre yoktur. Teknik sağlık, marka otoritesi, içerik kalitesi, crawl/index durumu ve dış kaynak sinyalleri birlikte etki eder.' }
      ], paragraphs:['SEO, GEO, AEO ve AIO ayrı kampanyalar gibi değil, aynı bilgi sisteminin farklı optimizasyon katmanları gibi yönetildiğinde daha sürdürülebilir sonuç verir.']}
    ],
    en: [
      { heading:'5. Why entities and evidence matter', paragraphs:[
        'AI systems do more than match keywords. They try to understand relationships between companies, people, services, products and markets. Brand, founder, service scope, location, market and case-study information should therefore remain consistent across pages.',
        'Evidence strengthens machine and human trust. Source links, live work, technical documentation, legal identity and clear claim boundaries reduce ambiguity.'
      ]},
      { heading:'6. How to build content clusters', paragraphs:[
        'A topic cluster is stronger than isolated blog posts. Connect service pages, explanatory guides, comparisons, FAQs, case studies and market-specific content through deliberate internal linking.',
        'This supports classical topical authority while also giving AI answer systems more consistent context around the same entities.'
      ]},
      { heading:'7. Measurement framework', table:{ headers:['Layer','Signal','Purpose'], rows:[
        ['Technical SEO','Indexation / CWV / crawl','Ensure foundational accessibility.'],
        ['Search','Queries / impressions / clicks','Measure classical visibility.'],
        ['GEO/AEO','AI mentions / cited pages','Track visibility in AI answers.'],
        ['Content','Topic coverage / internal links','Build topical authority.'],
        ['Business','Qualified leads / assisted conversions','Connect visibility to commercial value.']
      ]}, paragraphs:[
        'AI visibility does not yet have a single standard metric. Avoid relying on one “AI rank” score; combine mentions, citations, referrals and assisted conversions.'
      ]},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Does GEO replace SEO?', answer:'No. GEO depends on technical SEO, content quality, entity consistency and evidence.' },
        { question:'Is adding FAQ enough for AEO?', answer:'No. FAQ helps, but the broader page still needs clear, sourced and internally consistent answers.' },
        { question:'How long does AI visibility take?', answer:'There is no fixed timeline. Technical health, brand authority, content quality, crawl/index status and external signals all matter.' }
      ], paragraphs:['SEO, GEO, AEO and AIO are more sustainable when managed as connected optimisation layers of the same information system.']}
    ]
  },
  'whatsapp-commerce-2026-mesajdan-siparise': {
    ru: [{"heading":"5. Как проектировать conversational commerce?","paragraphs":["Сначала нужно понять intent: товар, наличие, доставка, цена, quote или after-sales. Разные запросы можно маршрутизировать по-разному.","CTA context, product ID, campaign source и язык клиента можно передавать в WhatsApp или CRM для более релевантного first response."]},{"heading":"6. Какие операционные проблемы нужно решить?","paragraphs":["Частая проблема — потерянный follow-up. Клиент пишет на разные номера, ответ задерживается, а после quote никто не возвращается.","Conversation data стоит связывать с CRM owner, status и next action."]},{"heading":"7. Funnel для измерения","table":{"headers":["Этап","Event","Что показывает"],"rows":[["Start","message_start","Сколько людей начали разговор"],["Quality","qualified_conversation","Сколько имеют реальный intent"],["Quote","quote_sent","Сколько дошли до предложения"],["Order","order_created","Сколько создали заказ"],["Outcome","won / lost","Реальный sales outcome"]]},"paragraphs":["Если events связаны с campaign и product context, можно понять какие страницы и media создают реальные продажи."]},{"heading":"8. Частые вопросы","paragraphs":["Цель conversational commerce — не убрать человека, а сделать путь вокруг разговора яснее."],"faq":[{"question":"WhatsApp Commerce только для e-commerce?","answer":"Нет. Подходит также клиникам, шоурумам, B2B-услугам, дистрибьюторам и quote-led business."},{"question":"Нужно ли клиенту новое приложение?","answer":"Нет. Клиент использует WhatsApp как обычно."},{"question":"Нужно ли полностью автоматизировать чат?","answer":"Обычно нет. FAQ и routing можно автоматизировать, а pricing и sensitive cases оставить человеку."}]}],
    tr: [
      { heading:'5. Conversational commerce akışı nasıl tasarlanır?', paragraphs:[
        'İlk adım, müşterinin neden mesaj attığını anlamaktır. Ürün sorusu, stok, teslimat, fiyat, teklif veya satış sonrası destek farklı route’lara ayrılabilir. Böylece ekip her mesajı sıfırdan yorumlamak zorunda kalmaz.',
        'Web sayfasındaki CTA, ürün ID, kampanya kaynağı ve müşteri dili gibi bilgiler WhatsApp mesajına veya CRM kaydına taşındığında ilk cevap çok daha hızlı hazırlanır.'
      ]},
      { heading:'6. Operasyon tarafında hangi sorunlar çözülmeli?', paragraphs:[
        'En yaygın problem mesajın gelmesi değil, takibin kaybolmasıdır. Aynı müşteri farklı numaralara yazabilir, cevap gecikebilir veya teklif sonrası follow-up unutulabilir. Bu nedenle WhatsApp akışı CRM owner, status ve next action alanlarıyla desteklenmelidir.',
        'Satış ekibinin kullandığı yapı ile müşteri deneyimi aynı sistemde düşünülmelidir; aksi halde müşteri için kolay olan kanal ekip için operasyon yüküne dönüşür.'
      ]},
      { heading:'7. Ölçülmesi gereken funnel', table:{ headers:['Aşama','Event','Ne gösterir?'], rows:[
        ['Başlangıç','message_start','Kaç kişi konuşmayı başlattı?'],
        ['Kalite','qualified_conversation','Kaçı gerçek ticari ihtiyaç taşıyor?'],
        ['Teklif','quote_sent','Kaçı teklif aşamasına geldi?'],
        ['Sipariş','order_created','Kaçı siparişe dönüştü?'],
        ['Sonuç','won / lost','Kanalın gerçek satış sonucu nedir?']
      ]}, paragraphs:[
        'Bu event’ler reklam kaynağı ve ürün bilgisiyle bağlandığında hangi kampanya veya sayfanın gerçekten satış ürettiği görülebilir.'
      ]},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'WhatsApp Commerce sadece e-commerce için mi?', answer:'Hayır. Klinik, showroom, B2B hizmet, distribütör, otomotiv ve teklif bazlı işletmelerde de uygulanabilir.' },
        { question:'Müşteri yeni bir uygulama kurmak zorunda mı?', answer:'Hayır. Müşteri WhatsApp’ı normal şekilde kullanır; yapı arka taraftaki yönlendirme ve operasyonu iyileştirir.' },
        { question:'AI müşteriyle tamamen otomatik konuşmalı mı?', answer:'Genellikle hayır. Sık sorular ve yönlendirme otomatikleşebilir; fiyat, istisna ve hassas durumlarda insan devrede kalmalıdır.' }
      ], paragraphs:['Conversational commerce’in amacı insan iletişimini kaldırmak değil, konuşmanın öncesini ve sonrasını daha düzenli hale getirmektir.']}
    ],
    en: [
      { heading:'5. How should a conversational commerce flow be designed?', paragraphs:[
        'Start by identifying why the customer is messaging: product question, stock, delivery, price, quotation or after-sales support. Different intents can be routed differently so the team does not interpret every conversation from zero.',
        'Passing CTA context, product ID, campaign source and language into WhatsApp or the CRM allows a faster and more relevant first response.'
      ]},
      { heading:'6. Which operational problems need to be solved?', paragraphs:[
        'The common failure is not receiving the message; it is losing the follow-up. Customers can write to different numbers, responses can be delayed and quote follow-up can disappear.',
        'A strong setup connects conversation data to CRM owner, status and next action so an easy customer channel does not become an internal operational burden.'
      ]},
      { heading:'7. The funnel to measure', table:{ headers:['Stage','Event','What it shows'], rows:[
        ['Start','message_start','How many people start a conversation?'],
        ['Quality','qualified_conversation','How many have real commercial intent?'],
        ['Quote','quote_sent','How many reach proposal stage?'],
        ['Order','order_created','How many create an order?'],
        ['Outcome','won / lost','What is the actual sales result?']
      ]}, paragraphs:['When these events include campaign and product context, teams can see which pages and media sources create real sales conversations.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Is WhatsApp Commerce only for e-commerce?', answer:'No. It can also work for clinics, showrooms, B2B services, distributors, automotive businesses and quotation-led sales.' },
        { question:'Do customers need another app?', answer:'No. Customers use WhatsApp normally; the improvement happens in routing, context and operational follow-up.' },
        { question:'Should AI automate the whole conversation?', answer:'Usually not. FAQs and routing can be automated, while pricing, exceptions and sensitive situations retain human control.' }
      ], paragraphs:['The goal of conversational commerce is not to remove human communication; it is to make the journey around the conversation clearer.']}
    ]
  },
  'tedarik-stratejisi-2026-coklu-kaynak': {
    ru: [{"heading":"5. Как сегментировать supplier portfolio?","paragraphs":["Не все suppliers одинаково критичны. Critical materials, high-volume categories, низкая substitutability и regulated products требуют более глубокого мониторинга.","Для strategic suppliers чаще проверяйте financial health, capacity, certification, geographic risk и second-source readiness."]},{"heading":"6. Когда альтернативный источник действительно готов?","paragraphs":["Имя и цена поставщика недостаточны. Samples, technical fit, packaging, quality documentation, payment terms и logistics routes должны быть проверены заранее.","Лучшее время готовить second source — когда текущая цепочка работает, а не во время disruption."]},{"heading":"7. Пример supplier scorecard","table":{"headers":["Критерий","Вес","Данные"],"rows":[["Quality","25%","COA / defect / claim"],["Delivery","20%","OTIF / lead time"],["Price","20%","Landed cost / volatility"],["Capacity","15%","Monthly available capacity"],["Compliance","10%","Certificates / legal status"],["Flexibility","10%","MOQ / rerouting / response speed"]]},"paragraphs":["Scorecard нужен для видимости изменения риска и performance, а не для механического выбора “победителя”."]},{"heading":"8. Частые вопросы","paragraphs":["Цель sourcing strategy — больше решений и меньше fragility."],"faq":[{"question":"Сколько suppliers достаточно?","answer":"Зависит от категории. Для critical products обычно безопаснее иметь хотя бы один technically approved alternative source."},{"question":"Выбирать самого дешёвого supplier?","answer":"Не только по цене. Landed cost, quality, delivery, financial и operational risk нужно оценивать вместе."},{"question":"Verification делается один раз?","answer":"Нет. Corporate status, certificates, capacity и performance нужно периодически перепроверять."}]}],
    tr: [
      { heading:'5. Tedarikçi portföyü nasıl segmentlere ayrılmalı?', paragraphs:[
        'Her tedarikçi aynı risk ve stratejik öneme sahip değildir. Kritik hammadde, yüksek hacim, düşük ikame kabiliyeti veya regülasyona bağlı ürünler daha yüksek risk sınıfına alınmalıdır.',
        'Stratejik tedarikçiler için finansal sağlık, kapasite, sertifika, coğrafi risk ve ikinci kaynak hazırlığı daha sık gözden geçirilmelidir.'
      ]},
      { heading:'6. Alternatif kaynak ne zaman gerçek alternatiftir?', paragraphs:[
        'Bir tedarikçinin adı ve fiyatı olması yeterli değildir. Numune onayı, teknik eşleşme, ambalaj, kalite dokümanları, ödeme koşulları ve lojistik rota test edilmemişse o kaynak henüz operasyonel backup değildir.',
        'En iyi zaman ikinci kaynağı hazırlamak kriz anı değil, mevcut tedarik zinciri sorunsuz çalışırken yapılan planlı validasyondur.'
      ]},
      { heading:'7. Supplier scorecard örneği', table:{ headers:['Kriter','Örnek ağırlık','İzlenen veri'], rows:[
        ['Kalite','25%','COA / defect / claim'],
        ['Teslimat','20%','OTIF / lead time'],
        ['Fiyat','20%','Landed cost / volatility'],
        ['Kapasite','15%','Monthly available capacity'],
        ['Compliance','10%','Certificates / legal status'],
        ['Esneklik','10%','MOQ / rerouting / response speed']
      ]}, paragraphs:[
        'Scorecard mekanik bir “kazanan” seçmek için değil, risk ve performans değişimini zaman içinde görünür yapmak için kullanılmalıdır.'
      ]},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'Kaç tedarikçi yeterli?', answer:'Ürüne göre değişir. Kritik kategorilerde en az bir gerçek, teknik olarak onaylı alternatif kaynak hazırlamak genellikle daha güvenlidir.' },
        { question:'En düşük fiyatlı tedarikçi seçilmeli mi?', answer:'Tek başına hayır. Landed cost, kalite, teslimat, finansal ve operasyonel risk birlikte değerlendirilmelidir.' },
        { question:'Supplier verification bir defa mı yapılır?', answer:'Hayır. Şirket, sertifika, kapasite ve performans bilgileri belirli aralıklarla yeniden doğrulanmalıdır.' }
      ], paragraphs:['Tedarik stratejisinin amacı sadece satın alma fiyatını düşürmek değil, şirketin karar seçeneklerini artırmaktır.']}
    ],
    en: [
      { heading:'5. How should the supplier portfolio be segmented?', paragraphs:[
        'Not every supplier carries the same strategic importance or risk. Critical materials, high-volume categories, low substitutability and regulated products require deeper monitoring.',
        'For strategic suppliers, financial health, capacity, certification, geographic risk and second-source readiness should be reviewed more frequently.'
      ]},
      { heading:'6. When is an alternative source truly ready?', paragraphs:[
        'A supplier name and price are not enough. If samples, technical fit, packaging, quality documentation, payment terms and logistics routes have not been tested, the source is not yet operational backup.',
        'The best time to prepare a second source is while the current supply chain is working, not during the disruption.'
      ]},
      { heading:'7. Example supplier scorecard', table:{ headers:['Criterion','Example weight','Tracked data'], rows:[
        ['Quality','25%','COA / defect / claim'],
        ['Delivery','20%','OTIF / lead time'],
        ['Price','20%','Landed cost / volatility'],
        ['Capacity','15%','Monthly available capacity'],
        ['Compliance','10%','Certificates / legal status'],
        ['Flexibility','10%','MOQ / rerouting / response speed']
      ]}, paragraphs:['A scorecard should expose changing risk and performance over time rather than mechanically select a winner.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'How many suppliers are enough?', answer:'It depends on the category. For critical products, having at least one technically approved alternative source is usually more resilient.' },
        { question:'Should the lowest-price supplier win?', answer:'Not by price alone. Landed cost, quality, delivery, financial risk and operational resilience should be considered together.' },
        { question:'Is supplier verification a one-time task?', answer:'No. Corporate status, certifications, capacity and performance should be revalidated periodically.' }
      ], paragraphs:['The goal of sourcing strategy is not only lower purchase price; it is more decision options and less fragility.']}
    ]
  },
  'landed-cost-2026-gumruk-tarife-marj': {
    ru: [{"heading":"5. Как Incoterm меняет структуру затрат?","paragraphs":["EXW, FOB, CIF и DDP по-разному распределяют risk и cost. Более низкая quotation может оказаться дороже, если freight, insurance или import handling остаются на стороне buyer.","Для сравнения suppliers нужно стандартизировать Incoterm или привести все предложения к одному landed-cost basis."]},{"heading":"6. Почему важны FX и financing?","paragraphs":["Между order, payment, shipment и sale возникает working-capital cost. При волатильной валюте total cost может измениться даже если product price фиксирован.","Для длинного transit и deferred payment стоит учитывать finance cost и FX buffer."]},{"heading":"7. Пример сравнения","table":{"headers":["Слой затрат","Supplier A","Supplier B","Проверка"],"rows":[["Factory price","Low","Medium","Не решать только по этому"],["Freight","High","Low","Проверить route/utilisation"],["Duty","Medium","Low","Подтвердить origin/HS code"],["Finance","High","Medium","Учесть timing"],["Landed cost","Result","Result","Сравнить на одной unit basis"]]},"paragraphs":["Landed-cost model показывает скрытые затраты, которые factory price не отражает."]},{"heading":"8. Частые вопросы","paragraphs":["Сильная landed-cost model — это margin и risk-control system."],"faq":[{"question":"Включать VAT в landed cost?","answer":"Зависит от цели модели. Recoverable tax и реальный cost impact лучше показывать отдельно."},{"question":"Как часто обновлять freight?","answer":"На volatile routes используйте короткий validity period и перепроверяйте freight перед commitment."},{"question":"Можно считать без точного HS code?","answer":"Для сценария — да, но финальное решение должно опираться на validated classification."}]}],
    tr: [
      { heading:'5. Incoterm seçimi maliyeti nasıl değiştirir?', paragraphs:[
        'EXW, FOB, CIF veya DDP aynı ürün için farklı risk ve maliyet dağılımı yaratır. Bir teklif ucuz görünürken taşıma, sigorta veya ithalat işlemi alıcı tarafında kaldığı için toplam maliyet daha yüksek olabilir.',
        'Bu nedenle teklif karşılaştırmasında Incoterm’i standartlaştırmak veya her teklifi aynı landed-cost bazına dönüştürmek gerekir.'
      ]},
      { heading:'6. Kur ve finansman maliyeti neden unutulmamalı?', paragraphs:[
        'Sipariş ile ödeme, sevkiyat ve tahsilat arasında geçen süre working capital maliyeti yaratır. Kur oynaklığı yüksek pazarlarda ürün fiyatı sabit kalsa bile gerçek maliyet değişebilir.',
        'Özellikle uzun transit veya vadeli ödeme kullanılan ticarette finance cost ve FX buffer landed-cost modelinin parçası olmalıdır.'
      ]},
      { heading:'7. Karşılaştırma tablosu', table:{ headers:['Kalem','Tedarikçi A','Tedarikçi B','Kontrol'], rows:[
        ['Factory price','Düşük','Orta','Tek başına karar vermeyin'],
        ['Freight','Yüksek','Düşük','Rota ve yoğunluğu kontrol edin'],
        ['Duty','Orta','Düşük','Menşe/HS code doğrulayın'],
        ['Finance','Yüksek','Orta','Transit + ödeme süresini ekleyin'],
        ['Landed cost','Sonuç','Sonuç','Aynı birim bazında karşılaştırın']
      ]}, paragraphs:['Landed-cost tablosunun en büyük faydası görünmeyen maliyetleri tek satırdaki fabrika fiyatından ayırmasıdır.']},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'Landed cost hesaplamasında KDV dahil edilmeli mi?', answer:'Kullanım amacına bağlıdır. İndirilebilir vergi ile gerçek maliyet etkisi ayrı gösterilmelidir; ülke ve işletme yapısına göre muhasebe değerlendirmesi gerekir.' },
        { question:'Navlun fiyatı ne sıklıkla güncellenmeli?', answer:'Volatil rotalarda teklif geçerlilik süresi kısa tutulmalı ve sipariş öncesi navlun yeniden doğrulanmalıdır.' },
        { question:'HS code kesin değilse hesap yapılabilir mi?', answer:'Yaklaşık senaryo yapılabilir ancak nihai ticari karar için doğru sınıflandırma doğrulanmalıdır.' }
      ], paragraphs:['Doğru landed-cost modeli bir fiyat hesaplama aracı değil, marj ve risk kontrol sistemidir.']}
    ],
    en: [
      { heading:'5. How Incoterms change the cost picture', paragraphs:[
        'EXW, FOB, CIF and DDP allocate risk and cost differently. A quotation can look cheaper while freight, insurance or import handling sits with the buyer and pushes total cost higher.',
        'Standardise the Incoterm when comparing suppliers, or convert every quotation to the same landed-cost basis.'
      ]},
      { heading:'6. Why FX and financing matter', paragraphs:[
        'The time between order, payment, shipment and sale creates working-capital cost. In volatile currencies, total cost can change even when product price does not.',
        'Long transit and deferred payment structures should include finance cost and an appropriate FX buffer in the model.'
      ]},
      { heading:'7. Comparison example', table:{ headers:['Cost layer','Supplier A','Supplier B','Check'], rows:[
        ['Factory price','Low','Medium','Do not decide from this alone.'],
        ['Freight','High','Low','Validate route and utilisation.'],
        ['Duty','Medium','Low','Confirm origin and HS code.'],
        ['Finance','High','Medium','Include transit and payment timing.'],
        ['Landed cost','Result','Result','Compare on the same unit basis.']
      ]}, paragraphs:['The main value of landed-cost modelling is exposing hidden cost that the factory price alone cannot show.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Should VAT be included in landed cost?', answer:'It depends on the purpose of the model. Recoverable tax and true cost impact should be shown separately and reviewed under the relevant accounting rules.' },
        { question:'How often should freight be refreshed?', answer:'On volatile routes, use short validity periods and reconfirm freight before commercial commitment.' },
        { question:'Can I calculate landed cost without a confirmed HS code?', answer:'You can build a scenario, but the final commercial decision should use a validated classification.' }
      ], paragraphs:['A strong landed-cost model is not only a price calculator; it is a margin and risk-control system.']}
    ]
  },
  'nearshoring-balkanlar-turkiye-2026': {
    ru: [{"heading":"5. Какие категории лучше подходят для nearshoring?","paragraphs":["Высокая freight sensitivity, короткий lead time, частые изменения продукта и небольшие production lots повышают ценность nearshoring. Heavy products, fashion, customised components и fast replenishment — типичные примеры.","Для labor-intensive high-volume categories дальние источники могут оставаться конкурентнее."]},{"heading":"6. Market access между Türkiye и Balkans","paragraphs":["Nearshoring влияет и на продажи. Производитель в Türkiye может соединить shorter lead times с distributors, local e-commerce и B2B partners в Balkan markets.","Regional websites, local language, payment methods и commercial partners превращают близость в sales advantage."]},{"heading":"7. Decision matrix","table":{"headers":["Критерий","Distant source","Nearshore source","Вопрос"],"rows":[["Unit cost","Часто ниже","Средний","Каков landed-cost gap?"],["Lead time","Длинный","Короткий","Как влияет на inventory?"],["MOQ","Может быть выше","Гибче","Подходит ли спросу?"],["Factory access","Сложнее","Проще","Ускоряет ли quality/sample?"],["Risk","Route/geopolitical","Regional","Где ниже total risk?"]]},"paragraphs":["Nearshoring должен быть количественным решением по cost, lead time, inventory и risk."]},{"heading":"8. Частые вопросы","paragraphs":["Лучшая nearshoring-модель превращает близость в operational speed и commercial flexibility."],"faq":[{"question":"Nearshoring всегда дороже?","answer":"Factory price может быть выше, но freight, inventory, lead time и flexibility меняют итоговую экономику."},{"question":"Можно ли считать Balkans единым рынком?","answer":"Нет. Региональная стратегия возможна, но язык, regulation, payments и distribution требуют country-level решений."},{"question":"Почему важна Türkiye?","answer":"Близость к Европе, manufacturing depth и regional distribution делают её сильной альтернативой для отдельных categories."}]}],
    tr: [
      { heading:'5. Hangi kategoriler nearshoring için daha uygun?', paragraphs:[
        'Yüksek navlun etkisi, kısa teslim süresi ihtiyacı, sık ürün değişimi veya küçük/orta lotlarla çalışma gerektiren kategoriler nearshoring’den daha fazla fayda görebilir. Ağır ürünler, moda/tekstil, özel üretim parçalar ve hızlı replenishment gereken ürünler buna örnektir.',
        'Çok düşük işçilik maliyetinin belirleyici olduğu, yüksek hacimli ve uzun planlama döngülü ürünlerde uzak kaynaklar hâlâ daha rekabetçi olabilir.'
      ]},
      { heading:'6. Türkiye-Balkanlar hattında pazar erişimi', paragraphs:[
        'Nearshoring sadece tedarik değil satış tarafında da önemlidir. Türkiye’de üretim yapan bir şirket Balkanlarda distribütör, yerel e-commerce veya B2B partner modeliyle daha kısa lead time ve daha esnek stok yapısı kurabilir.',
        'Bölgesel web varlığı, yerel dil, uygun ödeme yöntemi ve yerel ticari partnerler fiziksel yakınlığın gerçek satış avantajına dönüşmesini sağlar.'
      ]},
      { heading:'7. Değerlendirme matrisi', table:{ headers:['Kriter','Uzak kaynak','Nearshore kaynak','Karar sorusu'], rows:[
        ['Unit cost','Genellikle düşük','Orta','Landed cost farkı nedir?'],
        ['Lead time','Uzun','Kısa','Stok maliyetini nasıl etkiliyor?'],
        ['MOQ','Daha yüksek olabilir','Daha esnek olabilir','Talep dalgalanmasına uygun mu?'],
        ['Factory access','Zor','Daha kolay','Kalite/numune döngüsü hızlanıyor mu?'],
        ['Risk','Rota/jeopolitik','Bölgesel','Gerçek toplam risk hangisinde düşük?']
      ]}, paragraphs:['Nearshoring kararı ideolojik değil sayısal olmalıdır. Aynı ürün için cost, lead time, inventory ve risk birlikte değerlendirilmelidir.']},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'Nearshoring her zaman daha pahalı mı?', answer:'Factory price daha yüksek olabilir, ancak freight, inventory, lead time ve esneklik hesaba katıldığında toplam ekonomik sonuç farklılaşabilir.' },
        { question:'Balkanlar tek pazar gibi ele alınabilir mi?', answer:'Hayır. Bölgesel strateji kurulabilir ancak dil, regülasyon, ödeme davranışı ve dağıtım yapısı ülke bazında değerlendirilmelidir.' },
        { question:'Türkiye neden önemli?', answer:'Avrupa’ya yakınlığı, üretim çeşitliliği ve bölgesel dağıtım kabiliyeti nedeniyle bazı kategorilerde güçlü bir nearshore ve hub alternatifi sunar.' }
      ], paragraphs:['Doğru nearshoring modeli coğrafi yakınlığı operasyonel hız ve ticari esnekliğe çevirebilen modeldir.']}
    ],
    en: [
      { heading:'5. Which categories benefit most from nearshoring?', paragraphs:[
        'Categories with high freight sensitivity, short lead-time requirements, frequent product changes or smaller production lots can benefit more from nearshoring. Heavy products, fashion, customised components and fast-replenishment categories are common examples.',
        'For labour-intensive, very high-volume products with long planning cycles, distant sourcing may still remain more competitive.'
      ]},
      { heading:'6. Market access across Türkiye and the Balkans', paragraphs:[
        'Nearshoring also affects the sales side. A manufacturer in Türkiye can combine shorter lead times with distributors, local e-commerce or B2B partners across Balkan markets.',
        'Regional websites, local language, suitable payment methods and commercial partners are what turn physical proximity into a sales advantage.'
      ]},
      { heading:'7. Decision matrix', table:{ headers:['Criterion','Distant source','Nearshore source','Decision question'], rows:[
        ['Unit cost','Often lower','Medium','What is the landed-cost gap?'],
        ['Lead time','Long','Short','How does it affect inventory cost?'],
        ['MOQ','Can be higher','Can be more flexible','Does it match demand volatility?'],
        ['Factory access','Harder','Easier','Does quality/sample speed improve?'],
        ['Risk','Route/geopolitical','Regional','Which has lower total risk?']
      ]}, paragraphs:['Nearshoring should be a numerical decision, not an ideological one. Cost, lead time, inventory and risk need to be evaluated together.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Is nearshoring always more expensive?', answer:'Factory price can be higher, but freight, inventory, lead time and flexibility can change the total economic result.' },
        { question:'Can the Balkans be treated as one market?', answer:'No. A regional strategy is possible, but language, regulation, payments and distribution still require country-level decisions.' },
        { question:'Why is Türkiye strategically relevant?', answer:'Its proximity to Europe, manufacturing depth and regional distribution position create a strong nearshore option for selected categories.' }
      ], paragraphs:['The best nearshoring model converts geographic proximity into operational speed and commercial flexibility.']}
    ]
  },
  'cross-border-ecommerce-2026-operasyon-sistemi': {
    ru: [{"heading":"5. Как выбирать рынок?","paragraphs":["Нельзя опираться только на population или общий e-commerce size. Product demand, competition, logistics cost, payment behaviour, returns, regulation и support capacity нужно оценивать вместе.","Практично сравнить несколько рынков по scorecard и запустить небольшой pilot для реальных conversion и margin data."]},{"heading":"6. Что входит в local operations?","paragraphs":["Кроме language и currency, это payment methods, carriers, return address, tax display, support hours и promotion calendar.","При росте content, inventory, pricing и campaigns должны управляться централизованно, но с local rules."]},{"heading":"7. Cross-border KPI set","table":{"headers":["Область","KPI","Зачем"],"rows":[["Demand","Conversion rate","Показывает buying intent"],["Economics","Contribution margin","Меряет прибыль, не только revenue"],["Logistics","Delivery SLA","Влияет на experience/returns"],["Payment","Payment success rate","Показывает checkout friction"],["Returns","Return rate","Показывает fit и cost"],["Support","Tickets per order","Показывает нагрузку"]]},"paragraphs":["Без market-level P&L global revenue может вводить в заблуждение."]},{"heading":"8. Частые вопросы","paragraphs":["Cross-border e-commerce — это market-level operating design, а не только перевод."],"faq":[{"question":"В какую страну выходить первой?","answer":"Универсального ответа нет. Demand, landed cost, payments, logistics и support capacity нужно оценивать вместе."},{"question":"Нужен отдельный сайт на каждую страну?","answer":"Не всегда. Можно использовать market/language routes, но content, pricing, payments и SEO signals должны быть локализованы."},{"question":"Главная ошибка при cross-border росте?","answer":"Масштабировать demand до готовности operations."}]}],
    tr: [
      { heading:'5. Pazar seçimi nasıl yapılmalı?', paragraphs:[
        'Yeni ülkeye giriş sadece toplam nüfus veya e-commerce büyüklüğüne bakılarak yapılmamalıdır. Ürün talebi, rekabet, lojistik maliyeti, ödeme alışkanlığı, iade oranı, regülasyon ve customer support kapasitesi birlikte değerlendirilmelidir.',
        'En sağlıklı yöntem, birkaç aday pazarı aynı scorecard üzerinde karşılaştırmak ve önce küçük kontrollü pilot ile gerçek conversion ve margin verisi toplamaktır.'
      ]},
      { heading:'6. Lokal operasyon hangi katmanlardan oluşur?', paragraphs:[
        'Dil ve para biriminin yanında ödeme yöntemi, kargo şirketi, iade adresi, vergi gösterimi, müşteri destek saatleri ve kampanya takvimi lokal operasyonun parçasıdır.',
        'Pazar büyüdükçe içerik yönetimi, stok, fiyat ve kampanya değişikliklerinin merkezi sistemden ama yerel kurallarla yönetilmesi gerekir.'
      ]},
      { heading:'7. Cross-border KPI seti', table:{ headers:['Alan','KPI','Neden önemli?'], rows:[
        ['Talep','Conversion rate','Pazarın gerçek satın alma niyetini gösterir'],
        ['Ekonomi','Contribution margin','Ciro değil kârlılığı ölçer'],
        ['Lojistik','Delivery SLA','Müşteri deneyimi ve iade riskini etkiler'],
        ['Ödeme','Payment success rate','Checkout sürtünmesini gösterir'],
        ['İade','Return rate','Ürün/pazar uyumunu ve maliyeti etkiler'],
        ['Destek','Tickets per order','Operasyon yükünü gösterir']
      ]}, paragraphs:['Pazar bazlı P&L olmadan global ciro büyümesi yanıltıcı olabilir. Her ülkenin gerçek contribution margin’i ayrı izlenmelidir.']},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'İlk hangi ülkeye açılmalıyız?', answer:'Tek bir genel cevap yoktur. Ürün talebi, landed cost, ödeme, lojistik ve destek kapasitesi birlikte değerlendirilmelidir.' },
        { question:'Her ülke için ayrı site gerekir mi?', answer:'Her zaman değil. Aynı platform üzerinde dil/pazar route’ları kullanılabilir; ancak içerik, fiyat, ödeme ve SEO sinyalleri pazara göre ayrılmalıdır.' },
        { question:'Cross-border büyümede en büyük hata nedir?', answer:'Talep üretimini operasyon hazırlığından önce ölçeklemek. Lojistik, stok, ödeme ve support hazır değilse büyüme marjı bozabilir.' }
      ], paragraphs:['Cross-border e-commerce bir çeviri projesi değil, pazar bazlı operasyon tasarımıdır.']}
    ],
    en: [
      { heading:'5. How should markets be selected?', paragraphs:[
        'Country selection should not rely only on population or total e-commerce size. Product demand, competition, logistics cost, payment behaviour, returns, regulation and support capacity all matter.',
        'A practical method is to score candidate markets consistently, then launch a controlled pilot to collect real conversion and margin data.'
      ]},
      { heading:'6. What local operations actually include', paragraphs:[
        'Beyond language and currency, local operations include payment methods, carriers, return addresses, tax display, support hours and promotional calendars.',
        'As volume grows, content, inventory, pricing and campaigns should remain centrally manageable while respecting local market rules.'
      ]},
      { heading:'7. Cross-border KPI set', table:{ headers:['Area','KPI','Why it matters'], rows:[
        ['Demand','Conversion rate','Shows real buying intent.'],
        ['Economics','Contribution margin','Measures profitability, not only revenue.'],
        ['Logistics','Delivery SLA','Affects customer experience and return risk.'],
        ['Payment','Payment success rate','Shows checkout friction.'],
        ['Returns','Return rate','Signals product-market fit and cost.'],
        ['Support','Tickets per order','Shows operational load.']
      ]}, paragraphs:['Without market-level P&L, global revenue growth can be misleading. Contribution margin should be visible by country.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Which country should we enter first?', answer:'There is no universal answer. Demand, landed cost, payments, logistics and support capacity should be evaluated together.' },
        { question:'Do we need a separate website for every country?', answer:'Not always. One platform can use market/language routes, but content, pricing, payments and SEO signals still need local treatment.' },
        { question:'What is the biggest cross-border mistake?', answer:'Scaling demand before operations are ready. Weak logistics, inventory, payments or support can destroy margin.' }
      ], paragraphs:['Cross-border e-commerce is not a translation project; it is market-level operating design.']}
    ]
  },
  'first-party-measurement-2026-ga4-server-side-ai': {
    ru: [{"heading":"5. Как строить event taxonomy?","paragraphs":["Event naming должен следовать business logic, а не platform logic. Если одно действие по-разному называется в web, app, WhatsApp и CRM, анализ становится хрупким.","Стоит стандартизировать event name, source, campaign, product/service, lead ID, customer ID и timestamp."]},{"heading":"6. Когда нужен server-side tracking?","paragraphs":["Он полезен при multiple domains, ad channels, e-commerce и critical conversion flows, но добавляет техническую стоимость и обслуживание.","Сначала исправьте event design и consent, затем добавляйте server-side как data-quality и governance layer."]},{"heading":"7. Measurement maturity","table":{"headers":["Уровень","Состояние","Следующий шаг"],"rows":[["1","Pageviews only","Определить commercial events"],["2","GA4 conversions","Связать source + CRM"],["3","CRM attribution","Добавить revenue/margin"],["4","First-party model","Добавить server-side + QA"],["5","Clean data layer","AI analysis / agentic optimisation"]]},"paragraphs":["Maturity определяется качеством решений, а не количеством установленных tools."]},{"heading":"8. Частые вопросы","paragraphs":["Хорошая measurement system должна создавать меньше неопределённости, а не больше dashboards."],"faq":[{"question":"GA4 достаточно?","answer":"Для базовой web-видимости — да, но lead quality, CRM outcome и revenue требуют дополнительных layers."},{"question":"Server-side обязателен?","answer":"Нет. Он должен быть оправдан business needs; слабый event model он не исправит."},{"question":"Как AI использует measurement data?","answer":"Clean event/CRM data создают базу для anomaly detection, summaries, segmentation и agentic optimisation."}]}],
    tr: [
      { heading:'5. Event taksonomisi nasıl kurulmalı?', paragraphs:[
        'Event isimleri platform mantığıyla değil iş mantığıyla oluşturulmalıdır. Aynı ticari aksiyon web, app, WhatsApp ve CRM tarafında farklı isimlerle tutulursa analiz zorlaşır.',
        'Event name, source, campaign, product/service, lead ID, customer ID ve timestamp gibi ortak alanlar mümkün olduğunca standardize edilmelidir.'
      ]},
      { heading:'6. Server-side ne zaman anlamlı?', paragraphs:[
        'Server-side tracking özellikle birden fazla domain, reklam kanalı, e-commerce veya kritik conversion akışı olduğunda veri kontrolünü artırabilir. Ancak teknik maliyet ve bakım yükü de oluşturur.',
        'Önce event model ve consent yapısı doğru kurulmalı; server-side mimari daha sonra veri kalitesini ve governance’ı güçlendiren katman olarak eklenmelidir.'
      ]},
      { heading:'7. Measurement maturity tablosu', table:{ headers:['Seviye','Durum','Sonraki adım'], rows:[
        ['1','Sadece pageview','Ticari event tanımla'],
        ['2','GA4 conversion var','Source + CRM bağla'],
        ['3','CRM attribution var','Revenue/margin ekle'],
        ['4','First-party model var','Server-side + QA ekle'],
        ['5','Temiz veri katmanı','AI analysis / agentic optimisation']
      ]}, paragraphs:['Measurement maturity teknoloji sayısıyla değil, verinin ticari karar kalitesiyle ölçülmelidir.']},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'GA4 tek başına yeterli mi?', answer:'Basit sitelerde temel görünürlük sağlar; ancak lead quality, CRM outcome ve gelir bağlamak için ek veri katmanları gerekir.' },
        { question:'Server-side tracking zorunlu mu?', answer:'Hayır. İş ihtiyacına göre değerlendirilmelidir. Yanlış event model üzerine server-side eklemek sorunu çözmez.' },
        { question:'AI measurement’ı nasıl kullanır?', answer:'Temiz ve standardize event/CRM verisi, anomaly detection, özetleme, segment analizi ve agentic optimisation için daha güvenilir zemin sağlar.' }
      ], paragraphs:['İyi measurement sistemi daha fazla dashboard değil, daha az belirsizlik üretmelidir.']}
    ],
    en: [
      { heading:'5. How should event taxonomy be designed?', paragraphs:[
        'Event naming should follow business logic rather than platform logic. If the same commercial action has different names across web, app, WhatsApp and CRM, analysis becomes fragile.',
        'Standardise common fields such as event name, source, campaign, product/service, lead ID, customer ID and timestamp wherever practical.'
      ]},
      { heading:'6. When does server-side tracking make sense?', paragraphs:[
        'Server-side tracking can improve control when a business operates multiple domains, ad channels, e-commerce or critical conversion flows, but it also adds technical cost and maintenance.',
        'Fix event design and consent first; then use server-side architecture as a governance and data-quality layer.'
      ]},
      { heading:'7. Measurement maturity model', table:{ headers:['Level','Current state','Next step'], rows:[
        ['1','Pageviews only','Define commercial events.'],
        ['2','GA4 conversions','Connect source and CRM.'],
        ['3','CRM attribution','Add revenue and margin.'],
        ['4','First-party model','Add server-side and QA.'],
        ['5','Clean data layer','AI analysis / agentic optimisation.']
      ]}, paragraphs:['Measurement maturity should be judged by decision quality, not by the number of tools installed.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Is GA4 enough on its own?', answer:'It can cover basic web visibility, but lead quality, CRM outcomes and revenue usually require additional data layers.' },
        { question:'Is server-side tracking mandatory?', answer:'No. It should be justified by business needs. Adding it on top of a weak event model does not solve the core problem.' },
        { question:'How does AI benefit from measurement data?', answer:'Clean event and CRM data provide a stronger base for anomaly detection, summaries, segmentation and agentic optimisation.' }
      ], paragraphs:['A good measurement system should create less uncertainty, not more dashboards.']}
    ]
  },
  'b2b-dijital-guven-supplier-verification-rfq': {
    ru: [{"heading":"5. Какие сигналы проверяет B2B buyer?","paragraphs":["Покупатели смотрят не только на дизайн. Company name, domain history, address, LinkedIn presence, phone, legal records, certificates, factory evidence, product consistency и third-party sources можно cross-check.","Несовпадающие адреса, названия и unverifiable certificates быстро разрушают доверие."]},{"heading":"6. Почему RFQ quality ускоряет продажи?","paragraphs":["Incomplete RFQ создаёт вопросы, inaccurate pricing и delay. Strong RFQ заранее фиксирует technical/commercial assumptions и делает quotations comparable.","Quantity, packing, destination, Incoterm, quality, certification, payment и delivery expectation стоит стандартизировать."]},{"heading":"7. Пример evidence stack","table":{"headers":["Слой","Evidence","Verification"],"rows":[["Identity","Legal entity / registration","Official registry"],["Capacity","Factory / line / monthly output","Documents + site/third party"],["Quality","Certificate / COA","Issuer / validity"],["Trade","Export history / references","Document/reference check"],["Digital","Website / domain / profiles","Consistency check"],["Performance","Delivery / claim history","Operational records"]]},"paragraphs":["Evidence stack сильнее одного документа, потому что объединяет разные типы доказательств."]},{"heading":"8. Частые вопросы","paragraphs":["В B2B trust — результат consistent и verifiable evidence."],"faq":[{"question":"Professional website доказывает надёжность supplier?","answer":"Нет. Это лишь один сигнал. Company status, capacity, quality и trade history нужно проверять отдельно."},{"question":"Насколько подробным должен быть RFQ?","answer":"Он должен включать условия, влияющие на сравнение, без лишней бюрократии."},{"question":"Evidence-led content помогает SEO?","answer":"Да. Entity data, case studies, sources и technical documentation усиливают user trust и search/AI understanding."}]}],
    tr: [
      { heading:'5. B2B alıcı hangi sinyalleri kontrol eder?', paragraphs:[
        'Alıcılar artık yalnızca web sitesinin profesyonel görünümüne bakmıyor. Şirket adı, domain yaşı, adres, LinkedIn varlığı, telefon, ticari kayıtlar, sertifikalar, fabrika görselleri, ürün tutarlılığı ve üçüncü taraf kaynaklar birlikte incelenebiliyor.',
        'Bu yüzden dijital varlıkların birbiriyle çelişmemesi önemlidir. Farklı adres, farklı şirket adı veya doğrulanamayan sertifika güveni hızlı biçimde zedeler.'
      ]},
      { heading:'6. RFQ kalitesi neden satış hızını etkiler?', paragraphs:[
        'Eksik RFQ satıcı tarafında tekrar soru, yanlış fiyat ve gecikme yaratır. İyi RFQ ise teknik ve ticari varsayımları baştan netleştirir, teklifleri karşılaştırılabilir hale getirir.',
        'Özellikle uluslararası ticarette quantity, packing, destination, Incoterm, quality standard, certificate, payment ve delivery expectation alanlarının standartlaştırılması ciddi zaman kazandırır.'
      ]},
      { heading:'7. Evidence stack örneği', table:{ headers:['Katman','Örnek kanıt','Doğrulama'], rows:[
        ['Kimlik','Legal entity / registration','Resmi kayıt'],
        ['Kapasite','Factory / line / monthly output','Doküman + saha/üçüncü taraf'],
        ['Kalite','Certificate / COA','Issuer / validity check'],
        ['Ticaret','Export history / references','Belge / referans kontrolü'],
        ['Dijital','Website / domain / profiles','Tutarlılık kontrolü'],
        ['Performans','Delivery / claim history','Operasyon kaydı']
      ]}, paragraphs:['Evidence stack tek bir belgeye güvenmek yerine farklı kanıt türlerini üst üste koyarak daha güvenilir bir ticari resim oluşturur.']},
      { heading:'8. Sık sorulan sorular', faq:[
        { question:'Profesyonel web sitesi güvenilir tedarikçi anlamına gelir mi?', answer:'Hayır. Web sitesi yalnız bir sinyaldir; şirket, kapasite, kalite ve ticari geçmiş ayrıca doğrulanmalıdır.' },
        { question:'RFQ ne kadar detaylı olmalı?', answer:'Karşılaştırmayı etkileyen tüm teknik ve ticari şartları içermeli, ancak gereksiz bürokrasi yaratmamalıdır.' },
        { question:'Evidence-led growth SEO’ya da katkı sağlar mı?', answer:'Evet. Net entity bilgisi, case study, kaynak ve teknik dokümanlar hem kullanıcı güvenini hem search/AI understanding kalitesini güçlendirebilir.' }
      ], paragraphs:['B2B’de güven tasarımın sonucu değil, tutarlı ve doğrulanabilir kanıtların sonucudur.']}
    ],
    en: [
      { heading:'5. What signals do B2B buyers check?', paragraphs:[
        'Buyers increasingly look beyond visual quality. Company name, domain history, address, LinkedIn presence, phone, legal records, certificates, factory evidence, product consistency and third-party sources can all be cross-checked.',
        'Contradictory addresses, company names or unverifiable certificates quickly weaken trust.'
      ]},
      { heading:'6. Why RFQ quality affects sales speed', paragraphs:[
        'An incomplete RFQ creates follow-up questions, inaccurate pricing and delay. A strong RFQ clarifies technical and commercial assumptions early and makes quotations comparable.',
        'In international trade, standard fields for quantity, packing, destination, Incoterm, quality, certification, payment and delivery expectation save significant time.'
      ]},
      { heading:'7. Example evidence stack', table:{ headers:['Layer','Example evidence','Verification'], rows:[
        ['Identity','Legal entity / registration','Official registry'],
        ['Capacity','Factory / line / monthly output','Documents + site/third party'],
        ['Quality','Certificate / COA','Issuer / validity check'],
        ['Trade','Export history / references','Documents / reference check'],
        ['Digital','Website / domain / profiles','Consistency check'],
        ['Performance','Delivery / claim history','Operational records']
      ]}, paragraphs:['An evidence stack builds a stronger commercial picture by combining multiple proof types instead of trusting a single document.']},
      { heading:'8. Frequently asked questions', faq:[
        { question:'Does a professional website prove a supplier is reliable?', answer:'No. It is one signal. Corporate status, capacity, quality and trade history still need separate verification.' },
        { question:'How detailed should an RFQ be?', answer:'It should include the technical and commercial conditions that affect comparison without adding unnecessary bureaucracy.' },
        { question:'Does evidence-led content help SEO too?', answer:'Yes. Clear entity data, case studies, sources and technical documentation can strengthen both user trust and search/AI understanding.' }
      ], paragraphs:['In B2B, trust is not a design outcome; it is the result of consistent and verifiable evidence.']}
    ]
  }
};
