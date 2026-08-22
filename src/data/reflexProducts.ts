export interface ReflexVariantSpec {
  color: string;
  size: string;
  productCode: string;
  boxQuantity: string;
  cartonQuantity: string;
  palletQuantity: string;
  boxDimensions: string;
  cartonDimensions: string;
  boxBarcode: string;
  cartonBarcode: string;
}

export interface ReflexProduct {
  id: string;
  slug: string;
  material: string;
  powderStatus: string;
  latexStatus: string;
  siliconeStatus: string;
  sterilityStatus: string;
  foodContact: boolean;
  colors: string[];
  sizes: string[];
  images: {
    main: string;
    packaging: string;
    gallery: string[];
  };
  variants: ReflexVariantSpec[];
  i18n: Record<string, {
    name: string;
    tagline: string;
    description: string;
    features: string[];
    applications: string[];
    materialName: string;
    faq?: { question: string; answer: string }[];
  }>;
}

export const reflexProducts: ReflexProduct[] = [
  {
    id: 'flex-hi-tech',
    slug: 'flex-hi-tech',
    material: 'TPE (Termoplastik Elastomer)',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Siyah', 'Şeffaf', 'Mavi'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      main: '/images/reflex/flex-hi-tech/flex-hi-tech-main.jpg',
      packaging: '/images/reflex/flex-hi-tech/flex-hi-tech-packaging.jpg',
      gallery: [
        '/images/reflex/flex-hi-tech/flex-hi-tech-detail-1.jpg',
        '/images/reflex/flex-hi-tech/flex-hi-tech-detail-2.jpg',
        '/images/reflex/flex-hi-tech/flex-hi-tech-detail-3.jpg',
        '/images/reflex/flex-hi-tech/flex-hi-tech-detail-4.jpg',
        '/images/reflex/flex-hi-tech/flex-hi-tech-detail-5.jpg',
        '/images/reflex/flex-hi-tech/flex-hi-tech-detail-6.jpg'
      ]
    },
    variants: [
      {
        color: 'Siyah',
        size: 'S',
        productCode: '2082',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030716',
        cartonBarcode: '8683206030723'
      },
      {
        color: 'Siyah',
        size: 'M',
        productCode: '2081',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030693',
        cartonBarcode: '8683206030709'
      },
      {
        color: 'Siyah',
        size: 'L',
        productCode: '2080',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030679',
        cartonBarcode: '8683206030686'
      },
      {
        color: 'Siyah',
        size: 'XL',
        productCode: '2079',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030655',
        cartonBarcode: '8683206030662'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay Hybrid TPE FLEX Hi-Tech",
      "tagline": "Công nghệ Hybrid thế hệ mới",
      "description": "Giải pháp thay thế kinh tế cho latex và nitrile. Kết cấu mềm mại, độ co giãn cao và không chứa bột.",
      "features": [
            "Không chứa Latex",
            "Không bột",
            "Phù hợp thực phẩm",
            "Độ đàn hồi cao"
      ],
      "applications": [
            "Chế biến thực phẩm",
            "Dịch vụ ăn uống",
            "Vệ sinh công nghiệp",
            "Sử dụng hàng ngày"
      ],
      "materialName": "TPE (Thermoplastic Elastomer)"
},
      zh: {
        "name": "Flex Hi-Tech 高弹防护手套",
        "tagline": "新一代复合高弹 TPE 技术，卓越拉伸性能与高灵敏触感。",
        "description": "Flex Hi-Tech 采用新一代复合 TPE (热塑性弹性体) 技术，作为传统丁腈与 PVC 手套的高环保、高性价比替代方案而研发。人体工学贴合设计紧密包裹手掌与手指，无异味无味道配方，在食品深加工及严苛卫生操作中表现出色。",
        "materialName": "TPE (热塑性弹性体)",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 完全符合食品接触标准",
        "features": [
                "贴合手型与指部的人体工学设计",
                "触感极其柔软、无异味、亲肤配方",
                "100% 适用于油性及易滑食品接触",
                "高拉伸弹性与优异抗撕裂强度",
                "不含乳胶与硅油，有效降低过敏风险",
                "生产周期短，具备显著采购成本优势"
        ],
        "applications": [
                "食品深加工与餐饮分餐",
                "精细卫生与清洁作业",
                "HoReCa 酒店餐饮连锁",
                "美容美发与个人护理",
                "通用工业接触与日常防护"
        ],
        "faq": [
                {
                        "question": "Flex Hi-Tech 手套采用什么材质，是否无粉？",
                        "answer": "Flex Hi-Tech 采用新一代高弹复合 TPE (热塑性弹性体) 材质制成，全系列为无粉、不含乳胶、不含硅油配方。"
                },
                {
                        "question": "Flex Hi-Tech 是否符合直接接触食品标准？",
                        "answer": "是的，100% 符合食品级接触标准，无异味无味道，特别适合处理油性及易滑食材。"
                },
                {
                        "question": "有哪些可选颜色与尺码规格？",
                        "answer": "提供黑色、透明和蓝色三种颜色，尺码覆盖 S、M、L 和 XL。"
                },
                {
                        "question": "包装与托盘装载规格是怎样的？",
                        "answer": "标准包装为每盒 100 只，每箱 20 盒 (共 2,000 只/箱)，单托盘装载 70 箱。"
                }
        ]
},
      ru: {
        "name": "Reflex Flex Hi-Tech",
        "tagline": "Перчатки премиум-класса из эластичного ТПЭ",
        "description": "Одноразовые перчатки Reflex Flex Hi-Tech изготавливаются из высококачественного ТПЭ. Обладают высокой эластичностью и прочностью.",
        "materialName": "ТПЭ (Термопластичный эластомер)",
        "powderStatus": "Неопудренные",
        "features": [
                "Соответствует стандарту контакта с пищевыми продуктами",
                "Не содержит пудры, латекса и силикона",
                "Высокая эластичность и прочность на разрыв",
                "Экономичная альтернатива нитрилу"
        ],
        "applications": [
                "Пищевое производство и HoReCa",
                "Клининг и хозяйственные работы",
                "Косметология и салоны красоты",
                "Упаковка и сборка"
        ]
},
      tr: {
        name: 'Flex Hi-Tech Eldiven',
        tagline: 'Yeni nesil hibrit elastomer teknoloji, üstün esneklik ve hassas dokunuş.',
        description: 'Flex Hi-Tech, nitril ve vinil eldivenlere sürdürülebilir ve ekonomik bir alternatif olarak geliştirilmiş hibrit TPE teknolojisine sahiptir. Eli ve parmakları mükemmel kavrayan ergonomik yapısı, kokusuz ve tatsız formülü ile gıda işleme ve hassas temas gerektiren profesyonel alanlarda yüksek performans sağlar.',
        features: [
          'Eli ve parmakları anatomik biçimde kavrar',
          'Çok yumuşak, kokusuz ve cilt dostu doku',
          'Yağlı ve kaygan gıdalarla temasa %100 uygun',
          'Yüksek elastikiyet ve yırtılma direnci',
          'Silikon ve latex içermez, alerji riskini azaltır',
          'Maliyet avantajlı ve hızlı tedarik imkanı'
        ],
        applications: [
          'Gıda İşleme ve Servis',
          'Hassas Hijyen & Temizlik',
          'Restoran & Gıda Hizmetleri',
          'Kozmetik & Güzellik Salonları',
          'Genel Endüstriyel Temas'
        ],
        colors: ["Siyah","Şeffaf","Mavi"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Siyah","Şeffaf","Mavi"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'TPE (Termoplastik Elastomer)',
        faq: [
          {
                    "question": "Flex Hi-Tech eldiven hangi malzemeden üretilmiştir ve pudrasız mıdır?",
                    "answer": "Flex Hi-Tech eldiven, TPE (Termoplastik Elastomer) hibrit malzemeden üretilmiştir. Pudrasız, latekssiz ve silikonsuz yapıya sahiptir."
          },
          {
                    "question": "Flex Hi-Tech gıda temasına uygun mudur?",
                    "answer": "Evet, %100 gıda temasına uygun olup kokusuz ve tatsız formülü ile özellikle yağlı ve kaygan gıdalarla temasa uygundur."
          },
          {
                    "question": "Hangi renk ve beden seçenekleri mevcuttur?",
                    "answer": "Siyah, Şeffaf ve Mavi renk seçenekleri mevcut olup S, M, L ve XL bedenlerinde sunulmaktadır."
          },
          {
                    "question": "Ambalaj ve koli detayları nelerdir?",
                    "answer": "Her kutuda 100 adet eldiven yer alır. 1 kolide 20 kutu (2.000 adet) ve 1 palette 70 koli bulunmaktadır."
          }
]
      },
      en: {
        name: 'Flex Hi-Tech Glove',
        tagline: 'Next-generation hybrid elastomer technology, superior stretch and touch precision.',
        description: 'Flex Hi-Tech is powered by hybrid TPE technology developed as an eco-conscious and cost-effective alternative to Nitrile and Vinyl gloves. Its ergonomic fit closely hugs hands and fingers, offering high tactile sensitivity for professional food handling and hygienic applications.',
        features: [
          'Anatomical fit hugging hand and fingers',
          'Ultra-soft, odorless, skin-friendly texture',
          '100% compliant with fatty and slippery food contact',
          'High elasticity and tear resistance',
          'Latex-free & Silicone-free formula reducing allergy risks',
          'Cost-effective with rapid production cycles'
        ],
        applications: [
          'Food Processing & Handling',
          'Hygienic Cleaning Operations',
          'HoReCa & Food Service',
          'Beauty & Personal Care',
          'General Industrial Operations'
        ],
        colors: ["Black","Clear","Blue"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Black","Clear","Blue"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'TPE (Thermoplastic Elastomer)',
        faq: [
          {
                    "question": "What material is Flex Hi-Tech made of and is it powder-free?",
                    "answer": "Flex Hi-Tech is made of hybrid Thermoplastic Elastomer (TPE). It is powder-free, latex-free, and silicone-free."
          },
          {
                    "question": "Is Flex Hi-Tech suitable for direct food contact?",
                    "answer": "Yes, it is 100% compliant with food contact standards, offering an odorless and neutral-tasting formulation suited for handling fatty foods."
          },
          {
                    "question": "What sizes and colors are available?",
                    "answer": "Available in Black, Clear, and Blue across S, M, L, and XL sizes."
          },
          {
                    "question": "What are the packaging and logistics specifications?",
                    "answer": "Packed with 100 gloves per box, 20 boxes per carton (2,000 gloves/carton), and 70 cartons per pallet."
          }
]
      },
      mk: {
        name: 'Flex Hi-Tech Ракавица',
        tagline: 'Нова генерација хибридна еластомер технологија со висока еластичност.',
        description: 'Flex Hi-Tech користи хибридна TPE технологија развиена како економична и одржлива алтернатива за нитрилни и винилни ракавици. Неговата ергономска форма идеално се прилагодува на раката и обезбедува висока прецизност при работа во прехранбената индустрија и хигиенските сектори.',
        features: [
          'Анатомско прилагодување на раката и прстите',
          'Многу мека текстура без мирис, пријатна за кожата',
          '100% соодветно за контакт со мрсна и лизгава храна',
          'Висока еластичност и отпорност на кинење',
          'Без латекс и силикон - без ризик од алергии',
          'Економична цена со брза испорака'
        ],
        applications: [
          'Преработка и сервирање храна',
          'Хигиенско чистење',
          'Ugostitelstvo & HoReCa',
          'Козметички салони',
          'Индустриска употреба'
        ],
        colors: ["Црна","Проѕирна","Сина"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Црна","Проѕирна","Сина"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'TPE (Термопластичен Еластомер)',
        faq: [
          {
                    "question": "Од кој материјал се изработени Flex Hi-Tech ракавиците?",
                    "answer": "Flex Hi-Tech ракавиците се изработени од TPE (Термопластичен Еластомер) материјал. Се без пудра, без латекс и без силикон."
          },
          {
                    "question": "Дали се соодветни за контакт со храна?",
                    "answer": "Да, 100% се соодветни за контакт со храна, без мирис и без вкус."
          },
          {
                    "question": "Кои бои и димензии се достапни?",
                    "answer": "Достапни се во црна, проѕирна и сина боја во димензии S, M, L и XL."
          },
          {
                    "question": "Кои се деталите за пакувањето?",
                    "answer": "Секоја кутија содржи 100 ракавици. Една коли содржи 20 кутии (2.000 парчиња) и една палета содржи 70 коли."
          }
]
      },
      sr: {
        name: 'Flex Hi-Tech Rukavica',
        tagline: 'Nova generacija hibridne elastomer tehnologije, izuzetna elastičnost i preciznost.',
        description: 'Flex Hi-Tech rukavice koriste hibridnu TPE tehnologiju razvijenu kao održiva i ekonomična alternativa nitrilnim i vinilnim rukavicama. Njihov anatomski oblik omogućava odličan opseg pokreta i taktilnu osetljivost u pripremi hrane i higijenskim radnim okruženjima.',
        features: [
          'Anatomsko prianjanje uz šaku i prste',
          'Veoma meka struktura bez mirisa, nežna za kožu',
          '100% bezbedno za kontakt sa masnom i klizavom hranom',
          'Visoka elastičnost i otpornost na habanje',
          'Bez lateksa i silikona',
          'Povoljna cena i brza isporuka'
        ],
        applications: [
          'Prerada i rukovanje hranom',
          'Higijensko čišćenje',
          'Restorani i ugostiteljstvo',
          'Kozmetički saloni',
          'Opšta industrijska primena'
        ],
        colors: ["Crna","Providna","Plava"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Crna","Providna","Plava"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'TPE (Termoplastični Elastomer)',
        faq: [
          {
                    "question": "Od kog materijala su izrađene Flex Hi-Tech rukavice?",
                    "answer": "Flex Hi-Tech rukavice su izrađene od TPE (Termoplastični Elastomer) materijala. Bez pudera su, bez lateksa i bez silikona."
          },
          {
                    "question": "Da li su bezbedne za kontakt sa hranom?",
                    "answer": "Da, 100% su bezbedne za kontakt sa hranom, bez mirisa i ukusa, pogodne i za masnu hranu."
          },
          {
                    "question": "Koje boje i veličine su dostupne?",
                    "answer": "Dostupne su u crnoj, providnoj i plavoj boji u veličinama S, M, L i XL."
          },
          {
                    "question": "Kakva su pakovanja i logistika?",
                    "answer": "U kutiji se nalazi 100 komada. Karton sadrži 20 kutija (2.000 komada), a na paleti se nalazi 70 kartona."
          }
]
      },
      sq: {
        name: 'Doreza Flex Hi-Tech',
        tagline: 'Teknologji hibride elastomere e gjeneratës së re, elasticitet dhe precizion i lartë.',
        description: 'Dorezat Flex Hi-Tech përdorin teknologji hibride TPE të zhvilluar si një alternativë ekonomike dhe ekologjike ndaj dorezave nitrile dhe vinil. Forma anatomike përshtatet me saktësi në dorë duke ofruar komfort dhe siguri gjatë kontaktit me ushqimin dhe punëve higjienike.',
        features: [
          'Përshtatje anatomike në dorë dhe gishta',
          'Teksturë shumë e butë, pa erë dhe miqësore me lëkurën',
          '100% e përshtatshme për kontakt me ushqime me yndyrë',
          'Elasticitet i lartë dhe rezistencë ndaj grisjes',
          'Pa lateks dhe pa silikon',
          'Çmim ekonomik dhe furnizim i shpejtë'
        ],
        applications: [
          'Përpunim dhe shërbim ushqimi',
          'Pastroi dhe higjienë',
          'Restorante & HoReCa',
          'Salone bukurie',
          'Përdorim i përgjithshëm industrial'
        ],
        colors: ["E Zezë","Transparente","Blu"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["E Zezë","Transparente","Blu"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'TPE (Elastomer Termoplastik)',
        faq: [
          {
                    "question": "Prej çfarë materiali përbëhet doreza Flex Hi-Tech?",
                    "answer": "Flex Hi-Tech është e prodhuar nga material TPE (Elastomer Termoplastik). Është pa pluhur, pa lateks dhe pa silikon."
          },
          {
                    "question": "A është e përshtatshme për kontakt me ushqimin?",
                    "answer": "Po, është 100% e përshtatshme për kontakt me ushqimin, pa erë dhe pa shije."
          },
          {
                    "question": "Cilat ngjyra dhe përmasa janë në dispozicion?",
                    "answer": "Është e disponueshme në ngjyrë të zezë, transparente dhe blu në përmasat S, M, L dhe XL."
          },
          {
                    "question": "Cilat janë detajet e paketimit?",
                    "answer": "Çdo kuti përmban 100 copë. Një karton përmban 20 kuti (2.000 copë) dhe një paletë ka 70 kartona."
          }
]
      }
    ,
      fa: {
        "name": "دستکش هیبریدی Flex Hi-Tech رفلکس",
        "tagline": "فناوری الاستومر هیبریدی نسل جدید با انعطاف‌پذیری فوق‌العاده و دقت لمس بالا.",
        "description": "دستکش Flex Hi-Tech با استفاده از فناوری TPE هیبریدی به عنوان جایگزینی اقتصادی و سازگار با محیط زیست برای دستکش‌های نیتریل و وینیل توسعه یافته است. طراحی ارگونومیک آن کاملاً بر روی دست قرار می‌گیرد.",
        "features": [
                "پوشش آناتومیک دست و انگشتان",
                "بافت بسیار نرم، بدون بو و سازگار با پوست",
                "۱۰۰٪ مناسب برای تماس با مواد غذایی چرب",
                "انعطاف‌پذیری و مقاومت بالا در برابر پارگی",
                "بدون لاتکس و سیلیکون - کاهش خطر آلرژی",
                "قیمت اقتصادی و تامین سریع"
        ],
        "applications": [
                "فرآوری و توزیع مواد غذایی",
                "خدمات بهداشتی و نظافت",
                "رستوران‌ها و کترینگ",
                "سالن‌های زیبایی و آرایشی",
                "کاربردهای عمومی صنعتی"
        ],
        colors: ["مشکی","شفاف","آبی"],
        sizes: ["S","M","L","XL"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "TPE (الاستومر ترموپلاستیک)"
},
    }
  },
  {
    id: 'flex-kids',
    slug: 'flex-kids',
    material: 'TPE (Geri Dönüştürülebilir Termoplastik)',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Şeffaf'],
    sizes: ['Çocuk Standart'],
    images: {
      main: '/images/reflex/flex-kids/flex-kids-main.jpg',
      packaging: '/images/reflex/flex-kids/flex-kids-packaging.jpg',
      gallery: [
        '/images/reflex/flex-kids/flex-kids-detail-1.jpg',
        '/images/reflex/flex-kids/flex-kids-detail-2.jpg',
        '/images/reflex/flex-kids/flex-kids-detail-3.jpg'
      ]
    },
    variants: [
      {
        color: 'Şeffaf',
        size: 'Çocuk Standart',
        productCode: '886',
        boxQuantity: '50 Adet',
        cartonQuantity: '40 Kutu',
        palletQuantity: '80 Koli',
        boxDimensions: '210x110x20 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8697405391868',
        cartonBarcode: '8697405391875'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay trẻ em trong suốt FLEX Kids",
      "tagline": "Kích cỡ chuyên dụng cho trẻ em (3-9 tuổi)",
      "description": "Găng tay an toàn không chứa latex thiết kế cho hoạt động thủ công, trường học và tiếp xúc thực phẩm của trẻ nhỏ.",
      "features": [
            "Không chứa Latex",
            "Dành riêng cho trẻ 3-9 tuổi",
            "An toàn tiếp xúc thực phẩm",
            "Chống bám bẩn"
      ],
      "applications": [
            "Trường mầm non & tiểu học",
            "Vẽ tranh & thủ công",
            "Tiếp xúc thực phẩm",
            "Hoạt động dã ngoại"
      ],
      "materialName": "TPE không chứa Latex"
},
      zh: {
        "name": "Flex Kids 儿童专属防护手套",
        "tagline": "专为儿童手型量身定制的卫生防护与创意活动手套。",
        "description": "Flex Kids 专为儿童娇嫩手型量身研发，采用 100% 安全无毒、不含乳胶及有害添加剂的复合 TPE 材质。在学校手工作业、食品烹饪体验及日常卫生防护中提供舒适安心的贴合保护。",
        "materialName": "TPE (热塑性弹性体)",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 完全符合标准",
        "features": [
                "专为儿童手掌比例优化的贴合版型",
                "食品级安全标准，无气味无化学残留",
                "无粉不含乳胶，呵护儿童敏感肌肤",
                "柔软高弹，不影响握笔与精细手工操作",
                "彩色趣味设计，提高儿童佩戴意愿"
        ],
        "applications": [
                "儿童美术与手工实践课堂",
                "烘焙亲子体验与食品制作",
                "学校与幼儿园卫生日常",
                "儿童游乐场与探索活动"
        ],
        "faq": [
                {
                        "question": "Flex Kids 适合什么年龄段的儿童？",
                        "answer": "专为学龄前及学龄期儿童手型比例设计，版型贴合舒适。"
                },
                {
                        "question": "材质对儿童皮肤是否安全？",
                        "answer": "采用 100% 食品级安全 TPE 材质，无毒无味，不含天然乳胶与硅油，防止过敏。"
                },
                {
                        "question": "包装规格如何？",
                        "answer": "每盒 100 只，每箱 20 盒，单托盘 70 箱。"
                }
        ]
},
      ru: {
        "name": "Reflex Flex Kids",
        "tagline": "Гигиеничные одноразовые перчатки ТПЭ специального детского размера",
        "description": "Разработаны специально для детей. Идеальны для школьных мероприятий, творческих мастерских и гигиены.",
        "materialName": "ТПЭ (Термопластичный эластомер)",
        "powderStatus": "Неопудренные",
        "features": [
                "Специально адаптированный детский размер",
                "Безопасно для контакта с пищей",
                "Не вызывает аллергии на латекс",
                "Прочный и мягкий материал"
        ],
        "applications": [
                "Школы и детские сады",
                "Творческие студии и мастер-классы",
                "Кулинарные занятия для детей",
                "Личная гигиена"
        ]
},
      tr: {
        name: 'Flex Kids Şeffaf Çocuk Eldiveni',
        tagline: 'Çocuklar için özel ergonomik tasarım, %100 geri dönüştürülebilir eldiven.',
        description: 'Flex Kids, çocukların el yapısına özel boyutlandırılmış, lateks ve pudra içermeyen hijyenik çocuk eldivenidir. Okul etkinlikleri, gıda teması, resim/atölye çalışmaları ve günlük kişisel koruma için çevre dostu TPE materyalden üretilmiştir.',
        features: [
          'Çocuk ergonomisine uygun özel küçük beden',
          '%100 doğa dostu ve geri dönüştürülebilir',
          'Pudrasız ve lateks içermeyen hipoalerjenik yapı',
          'Gıda ile temasa tamamen uygundur',
          'Yumuşak doku ile çocukların rahat kullanımı',
          'Pratik 50 adetlik hijyen kutusu ambalajı'
        ],
        applications: [
          'Okul ve Anaokulu Etkinlikleri',
          'Gıda Hizmetleri ve Yemek Alanları',
          'Sanat, Resim ve Atölye Çalışmaları',
          'Günlük Hijyen ve Kişisel Koruma'
        ],
        colors: ["Şeffaf"],
        sizes: ["Çocuk Standart"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Şeffaf"],
        sizes: ["Çocuk Standart"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'Geri Dönüştürülebilir TPE',
        faq: [
          {
                    "question": "Flex Kids eldiveni kimler içindir ve malzemesi nedir?",
                    "answer": "Flex Kids, çocukların el anatomisine özel boyutlandırılmış, %100 geri dönüştürülebilir TPE malzemeden üretilmiş çocuk eldivenidir."
          },
          {
                    "question": "Çocuk eldiveni pudra veya lateks içerir mi?",
                    "answer": "Hayır, pudrasız ve latekssiz hipoalerjenik yapıya sahiptir."
          },
          {
                    "question": "Hangi beden ve ambalaj detaylarına sahiptir?",
                    "answer": "Çocuk Standart bedeninde, Şeffaf renkte sunulmaktadır. Bir kutuda 50 adet eldiven bulunur; 1 kolide 40 kutu ve 1 palette 80 koli yer alır."
          },
          {
                    "question": "Hangi kullanım alanları için uygundur?",
                    "answer": "Okul ve anaokulu etkinlikleri, çocuk gıda hazırlığı, resim ve el sanatları atölyeleri için uygundur."
          }
]
      },
      en: {
        name: 'Flex Kids Transparent Kids Glove',
        tagline: 'Specially engineered ergonomic fit for children, 100% recyclable.',
        description: 'Flex Kids is a powder-free and latex-free disposable glove specially sized for children. Made from eco-friendly TPE, it is designed for school activities, workshops, arts and crafts, and safe food contact.',
        features: [
          'Specially sized for children hands',
          '100% eco-friendly and fully recyclable',
          'Powder-free and latex-free hypoallergenic material',
          'Certified for direct food contact safety',
          'Soft texture ensuring comfortably natural grip',
          'Convenient 50-piece box packaging'
        ],
        applications: [
          'School & Kindergarten Activities',
          'Children Food Preparation',
          'Arts, Crafts & Painting Workshops',
          'Daily Hygiene & Protection'
        ],
        colors: ["Clear"],
        sizes: ["Kids Standard"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Clear"],
        sizes: ["Kids Standard"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'Recyclable TPE',
        faq: [
          {
                    "question": "Who is Flex Kids designed for and what material is used?",
                    "answer": "Flex Kids is a powder-free and latex-free disposable glove specially sized for children, made from 100% recyclable TPE."
          },
          {
                    "question": "Does Flex Kids contain latex or powder?",
                    "answer": "No, it is powder-free and latex-free with a hypoallergenic composition."
          },
          {
                    "question": "What are the available size and packaging specs?",
                    "answer": "Available in Kids Standard size in Clear color. Packed with 50 gloves per box, 40 boxes per carton, and 80 cartons per pallet."
          },
          {
                    "question": "What applications is it suited for?",
                    "answer": "Ideal for school and kindergarten activities, children food preparation, and painting or crafting workshops."
          }
]
      },
      mk: {
        name: 'Flex Kids Проѕирна Детска Ракавица',
        tagline: 'Специјален ергономски дизајн за деца, 100% рециклирачка ракавица.',
        description: 'Flex Kids е хигиенска детска ракавица без латекс и пудра, прилагодена на детската рака. Направена од еколошки TPE материјал, таа е совршена за училишни активности, храна и разни детски работилници.',
        features: [
          'Специјална димензија за детски раце',
          '100% еколошка и рециклирачка',
          'Хипоалерген материјал без латекс и пудра',
          'Безбедно за контакт со храна',
          'Мека текстура за лесна употреба',
          'Практично пакување од 50 парчиња'
        ],
        applications: [
          'Училишни и градински активности',
          'Подготовка на храна за деца',
          'Уметнички работилници',
          'Секојдневна детска хигиена'
        ],
        colors: ["Проѕирна"],
        sizes: ["Детски стандард"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Проѕирна"],
        sizes: ["Детски стандард"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'Рециклирачки TPE',
        faq: [
          {
                    "question": "За кого се наменети Flex Kids ракавиците?",
                    "answer": "Flex Kids се детски ракавици со димензија за детски раце, изработени од 100% рециклирачки TPE материјал."
          },
          {
                    "question": "Дали содржат латекс или пудра?",
                    "answer": "Не, тие се без пудра и без латекс со хипоалерген состав."
          },
          {
                    "question": "Кои се димензиите и пакувањето?",
                    "answer": "Достапни се во детски стандард во проѕирна боја. Кутијата содржи 50 парчиња, коли содржи 40 кутии, а палета содржи 80 коли."
          },
          {
                    "question": "За кои активности се соодветни?",
                    "answer": "Соодветни се за училишни активности, храна за деца и уметнички работилници."
          }
]
      },
      sr: {
        name: 'Flex Kids Providna Dečija Rukavica',
        tagline: 'Specijalno dizajnirana za decu, 100% reciklabilna rukavica.',
        description: 'Flex Kids je jednokratna dečija rukavica bez pudera i lateksa, prilagođena anatomiji dečije šake. Izrađena je od ekološkog TPE materijala idealnog za školske aktivnosti, radionice i kontakt sa hranom.',
        features: [
          'Veličina prilagođena dečijim rukama',
          '100% ekološki materijal pogodan za reciklažu',
          'Hipoalergenska struktura bez lateksa i pudera',
          'Sertifikovano za kontakt sa hranom',
          'Udobna i meka za svakodnevno nošenje',
          'Pakovanje od 50 komada u kutiji'
        ],
        applications: [
          'Školske i predškolske aktivnosti',
          'Priprema dečije hrane',
          'Kreativne i slikarske radionice',
          'KID higijena'
        ],
        colors: ["Providna"],
        sizes: ["Dečiji standard"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Providna"],
        sizes: ["Dečiji standard"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'Reciklabilni TPE',
        faq: [
          {
                    "question": "Kome su namenjene Flex Kids rukavice?",
                    "answer": "Flex Kids su dečije rukavice prilagođene anatomiji dečije šake, izrađene od 100% reciklabilnog TPE materijala."
          },
          {
                    "question": "Da li sadrže lateks ili puder?",
                    "answer": "Ne, bez pudera su i bez lateksa sa hipoalergenskom strukturom."
          },
          {
                    "question": "Koje su dimenzije i pakovanja?",
                    "answer": "Dostupne su u dečijoj standardnoj veličini i providnoj boji. Kutija sadrži 50 komada, karton sadrži 40 kutija, a paleta 80 kartona."
          },
          {
                    "question": "Za koje namene su pogodne?",
                    "answer": "Pogodne su za školske i predškolske aktivnosti, pripremu hrane za decu i radionice."
          }
]
      },
      sq: {
        name: 'Doreza për Fëmijë Flex Kids',
        tagline: 'Dizajn ergonomik special për fëmijë, 100% e riciklueshme.',
        description: 'Flex Kids është dorezë mbrojtëse njëpërdorimëshe për fëmijë, pa lateks dhe pa pluhur. Zhvilluar nga material ekologjik TPE për përdorim në aktivitete shkollore, ushqim dhe punëtori artizanale.',
        features: [
          'Madhësi e veçantë për duart e fëmijëve',
          '100% ekologjike dhe plotësisht e riciklueshme',
          'Strukturë hipoalergjike pa lateks dhe pluhur',
          'Sigurt për kontakt me ushqimin',
          'Cilësi e butë për komfort të lartë',
          'Paketim praktik prej 50 copësh'
        ],
        applications: [
          'Aktivitete shkollore dhe kopshte',
          'Përgatitje ushqimi për fëmijë',
          'Punëtori arti dhe vizatimi',
          'Higjienë e përditshme'
        ],
        colors: ["Transparente"],
        sizes: ["Fëmijë Standard"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["Transparente"],
        sizes: ["Fëmijë Standard"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'TPE i Riciklueshëm',
        faq: [
          {
                    "question": "Për kë janë dizajnuar dorezat Flex Kids?",
                    "answer": "Flex Kids janë doreza njëpërdorimëshe për fëmijë, të prodhuara nga material TPE 100% i riciklueshëm."
          },
          {
                    "question": "A përmbajnë lateks apo pluhur?",
                    "answer": "Jo, janë pa pluhur dhe pa lateks me përbërje hipoalergjike."
          },
          {
                    "question": "Cilat janë përmasat dhe paketimi?",
                    "answer": "Ofrohen në përmasën fëmijë standard në ngjyrë transparente. Kutia përmban 50 copë, kartoni 40 kuti dhe paleta 80 kartona."
          },
          {
                    "question": "Për cilat përdorime janë të përshtatshme?",
                    "answer": "Të përshtatshme për aktivitete shkollore, përgatitje ushqimi për fëmijë dhe punëtori artizanale."
          }
]
      }
    ,
      fa: {
        "name": "دستکش شفاف کودک Flex Kids",
        "tagline": "طراحی ارگونومیک ویژه کودکان، دستکش ۱۰۰٪ قابل بازیافت.",
        "description": "دستکش Flex Kids بدون پودر و لاتکس، مخصوص آناتومی دست کودکان طراحی شده است. ساخته شده از TPE دوستدار محیط زیست برای فعالیت‌های آموزشگاهی، کارگاه‌ها و تماس ایمن با غذا.",
        "features": [
                "سایز اختصاصی ارگونومیک برای کودکان",
                "۱۰۰٪ دوستدار محیط زیست و قابل بازیافت",
                "بدون پودر و لاتکس با ترکیب ضد آلرژی",
                "دارای تاییدیه تماس مستقیم با مواد غذایی",
                "بافت نرم برای استفاده راحت کودکان",
                "بسته‌بندی کاربردی ۵۰ عددی"
        ],
        "applications": [
                "فعالیت‌های مدارس و مهدکودک‌ها",
                "آماده‌سازی غذای کودکان",
                "کارگاه‌های نقاشی و صنایع دستی",
                "بهداشت روزانه کودکان"
        ],
        colors: ["شفاف"],
        sizes: ["استاندارد کودک"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "TPE قابل بازیافت"
},
    }
  },
  {
    id: 'winlyex-powder-free',
    slug: 'winlyex-powder-free',
    material: 'Termo Vinil / TPE Hibrit',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Şeffaf', 'Mavi', 'Siyah'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      main: '/images/reflex/winlyex-powder-free/winlyex-powder-free-main.jpg',
      packaging: '/images/reflex/winlyex-powder-free/winlyex-powder-free-packaging.jpg',
      gallery: [
        '/images/reflex/winlyex-powder-free/winlyex-powder-free-packaging.jpg'
      ]
    },
    variants: [
      {
        color: 'Şeffaf',
        size: 'S',
        productCode: '2086',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030792',
        cartonBarcode: '8683206030808'
      },
      {
        color: 'Şeffaf',
        size: 'M',
        productCode: '2085',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030778',
        cartonBarcode: '8683206030785'
      },
      {
        color: 'Şeffaf',
        size: 'L',
        productCode: '2084',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030754',
        cartonBarcode: '8683206030761'
      },
      {
        color: 'Şeffaf',
        size: 'XL',
        productCode: '2083',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030730',
        cartonBarcode: '8683206030747'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay không bột WINLYEX",
      "tagline": "Chuẩn mực không bột sạch sẽ & ngăn mùi",
      "description": "Găng tay bảo hộ tiêu chuẩn giúp ngăn ngừa lây nhiễm chéo và mùi trong quá trình chuẩn bị thực phẩm và vệ sinh.",
      "features": [
            "Không bột",
            "Kháng mùi",
            "Đa năng",
            "Bảo vệ tay thoải mái"
      ],
      "applications": [
            "Bếp thương mại",
            "Dịch vụ dọn phòng",
            "Chế biến thực phẩm nguội",
            "Vệ sinh nhẹ"
      ],
      "materialName": "TPE không bột cao cấp"
},
      zh: {
        "name": "Winlyex 无粉乙烯基防护手套",
        "tagline": "经典无粉 PVC 材质，严谨质控，通用型高性价比之选。",
        "description": "Winlyex 无粉手套选用高纯度 PVC 原料制成，具备出色的防尘隔离与平滑穿戴体验。广泛应用于食品零售、轻工业流水线与日常清洁防护。",
        "materialName": "PVC (聚氯乙烯)",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 适用于常规食品",
        "features": [
                "表面平滑无粉，穿脱顺畅",
                "不含天然乳胶，防止乳胶过敏反应",
                "优异的防潮与轻度化学品阻隔性",
                "严谨的批次质控与包装密封性",
                "大宗采购经济适用"
        ],
        "applications": [
                "超市生鲜与熟食零售",
                "餐饮备料与轻度清洁",
                "实验室轻度检查",
                "电子元器件轻工组装"
        ],
        "faq": [
                {
                        "question": "Winlyex 无粉手套的主要材质是什么？",
                        "answer": "采用优质聚氯乙烯 (PVC / Vinyl) 树脂原料，经现代化无粉工艺精制而成。"
                },
                {
                        "question": "是否容易引起过敏？",
                        "answer": "不含天然乳胶蛋白，对于乳胶敏感人群极为安全友好。"
                }
        ]
},
      ru: {
        "name": "Reflex Winlyex Pudrasız",
        "tagline": "Неопудренные виниловые перчатки повышенной прочности",
        "description": "Одноразовые неопудренные виниловые перчатки Winlyex обеспечивают надежную защиту рук при выполнении ежедневных задач.",
        "materialName": "Винил (ПВХ)",
        "powderStatus": "Неопудренные",
        "features": [
                "Без пудры и без латекса",
                "Гладкая поверхность и точная посадка",
                "Устойчивость к химическим растворам",
                "Высокий уровень гигиены"
        ],
        "applications": [
                "Общие гигиенические процедуры",
                "Уборка и обслуживание",
                "Пищевой сервис",
                "Легкая промышленность"
        ]
},
      tr: {
        name: 'Reflex Winlyex Pudrasız Eldiven',
        tagline: 'Çok amaçlı koruma, yüksek kavrama gücü ve pudrasız hijyen standartları.',
        description: 'Reflex Winlyex Pudrasız Eldiven, genel hijyen ve gıda hazırlık süreçlerinde yüksek koruma sağlayan ekonomik bir eldiven çözümüdür. Cilt uyumu yüksek yapısı, esnek dokusu ve pudrasız formülü ile el izi bırakmadan temiz çalışma imkanı sunar.',
        features: [
          'Çok amaçlı kullanım için ideal dayanıklılık',
          'Pudrasız iç yüzey ile lekesiz temas',
          'Silikon ve lateks içermeyen hipoalerjenik formül',
          'Gıda hazırlama ve servis süreçlerine tam uyum',
          'Kullanım kolaylığı ve ergonomik el kavraması',
          'Yüksek adetli ticari kullanım avantajı'
        ],
        applications: [
          'Gıda Üretimi ve Paketleme',
          'Genel Hizmet ve Kurumsal Temizlik',
          'Catering ve Restoran Hizmetleri',
          'Perakende ve Gıda Satış Noktaları'
        ],
        colors: ["Şeffaf","Mavi","Siyah"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Şeffaf","Mavi","Siyah"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'Pudrasız Hibrit Polimer',
        faq: [
          {
                    "question": "Winlyex Pudrasız eldivenin malzemesi nedir?",
                    "answer": "Winlyex Pudrasız, çok amaçlı kullanım için pudrasız hibrit polimer malzemeden üretilmiştir."
          },
          {
                    "question": "Kullanım sırasında pudra izi bırakır mı?",
                    "answer": "Hayır, pudrasız iç yüzeyi leke ve kalıntı bırakmasını engeller."
          },
          {
                    "question": "Hangi renk ve beden seçenekleri mevcuttur?",
                    "answer": "Şeffaf, Mavi ve Siyah renklerinde S, M, L ve XL bedenlerinde sunulmaktadır."
          },
          {
                    "question": "Ambalaj detayları nelerdir?",
                    "answer": "Her kutuda 100 adet, 1 kolide 20 kutu (2.000 adet) ve 1 palette 70 koli yer almaktadır."
          }
]
      },
      en: {
        name: 'Reflex Winlyex Powder-Free Glove',
        tagline: 'Multipurpose protection, excellent tactile grip and powder-free hygiene.',
        description: 'Reflex Winlyex Powder-Free Glove is an economical single-use glove solution engineered for general hygiene and food service tasks. Its residue-free surface ensures clean handling without leaving powder marks.',
        features: [
          'Durable construction for multipurpose applications',
          'Powder-free smooth interior avoiding surface marks',
          'Hypoallergenic latex-free & silicone-free compound',
          'Fully safe for food handling and service',
          'Easy donut-cuff donning with comfortable grip',
          'Cost-efficient bulk supply structure'
        ],
        applications: [
          'Food Manufacturing & Packaging',
          'Institutional Cleaning Services',
          'Catering & Food Outlets',
          'Retail & Deli Counter Operations'
        ],
        colors: ["Clear","Blue","Black"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Clear","Blue","Black"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'Powder-Free Hybrid Polymer',
        faq: [
          {
                    "question": "What is the material of Winlyex Powder-Free gloves?",
                    "answer": "Winlyex Powder-Free is a multipurpose disposable glove manufactured from a powder-free hybrid polymer formulation."
          },
          {
                    "question": "Does it leave powder marks on surfaces?",
                    "answer": "No, its smooth powder-free interior avoids leaving powder residue on surfaces or food."
          },
          {
                    "question": "What sizes and colors are available?",
                    "answer": "Available in Clear, Blue, and Black in S, M, L, and XL sizes."
          },
          {
                    "question": "What are the packaging details?",
                    "answer": "Packed 100 pieces per box, 20 boxes per carton (2,000 pieces/carton), and 70 cartons per pallet."
          }
]
      },
      mk: {
        name: 'Reflex Winlyex Ракавица Без Пудра',
        tagline: 'Повеќенаменска заштита, сигурен зафат и хигиена без пудра.',
        description: 'Reflex Winlyex ракавиците без пудра нудат економично решение за хигиенски процеси и подготовка на храна. Специјалната формула без пудра гарантира работа без траги на површините.',
        features: [
          'Повеќенаменска издржливост',
          'Внатрешност без пудра за чисто ракување',
          'Без латекс и силикон',
          'Погодна за подготовка на храна',
          'Лесно облекување и добро прилагодување',
          'Поволни услови за големопродажба'
        ],
        applications: [
          'Производство на храна',
          'Општо чистење',
          'Кетеринг и ресторани',
          'Продажба на мало'
        ],
        colors: ["Проѕирна","Сина","Црна"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Проѕирна","Сина","Црна"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'Хибриден Полимер Без Пудра',
        faq: [
          {
                    "question": "Кој е материјалот на Winlyex ракавиците без пудра?",
                    "answer": "Winlyex без пудра е повеќенаменска ракавица изработена од хибриден полимер без пудра."
          },
          {
                    "question": "Дали оставаат траги на површините?",
                    "answer": "Не, внатрешноста без пудра спречува оставање бели траги."
          },
          {
                    "question": "Кои бои и димензии се достапни?",
                    "answer": "Достапни се во проѕирна, сина и црна боја во димензии S, M, L и XL."
          },
          {
                    "question": "Кои се деталите за пакувањето?",
                    "answer": "Пакувани се по 100 парчиња во кутија, 20 кутии во коли (2.000 парчиња) и 70 коли на палета."
          }
]
      },
      sr: {
        name: 'Reflex Winlyex Rukavica Bez Pudera',
        tagline: 'Višenamenska zaštita, visok nivo higijene i komfora bez pudera.',
        description: 'Reflex Winlyex rukavice bez pudera pružaju pouzdanu zaštitu u radu sa hranom i pri održavanju higijene. Glatka unutrašnjost sprečava ostavljanje tragova i pruža udobnost pri dužem nošenju.',
        features: [
          'Izdržljive rukavice za širu komercijalnu upotrebu',
          'Bez pudera - ne ostavlja bele tragove',
          'Hipoalergenska formula bez lateksa i silikona',
          'Pogodno za kontakt sa hranom',
          'Ergonomski oblik i lako navlačenje',
          'Ekonomično rešenje za industriju'
        ],
        applications: [
          'Pakovanje i priprema hrane',
          'Higijensko održavanje',
          'Ketering i ugostiteljstvo',
          'Maloprodajni objekti'
        ],
        colors: ["Providna","Plava","Crna"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Providna","Plava","Crna"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'Hibridni Polimer Bez Pudera',
        faq: [
          {
                    "question": "Od kog materijala su napravljene Winlyex rukavice bez pudera?",
                    "answer": "Winlyex bez pudera su višenamenske rukavice napravljene od hibridnog polimera bez pudera."
          },
          {
                    "question": "Da li ostavljaju bele tragove pudera?",
                    "answer": "Ne, glatka unutrašnjost bez pudera ne ostavlja tragove na površinama i hrani."
          },
          {
                    "question": "Koje boje i veličine su dostupne?",
                    "answer": "Dostupne su u providnoj, plavoj i crnoj boji u veličinama S, M, L i XL."
          },
          {
                    "question": "Kakvo je pakovanje?",
                    "answer": "U kutiji se nalazi 100 komada, u kartonu 20 kutija (2.000 komada), a na paleti 70 kartona."
          }
]
      },
      sq: {
        name: 'Doreza Reflex Winlyex Pa Pluhur',
        tagline: 'Mbrojtje për shumë qëllime, kapje e mirë dhe higjienë pa pluhur.',
        description: 'Dorezat Reflex Winlyex Pa Pluhur janë zgjidhje ekonomike për përdorim në sektorin e ushqimit dhe pastrimit. Struktura pa pluhur mbron sipërfaqet nga njollat gjatë punës.',
        features: [
          'Qëndrueshmëri e lartë për përdorim të përgjithshëm',
          'Sipërfaqe e brendshme pa pluhur',
          'Pa lateks dhe pa silikon',
          'Sigurt për përgatitjen e ushqimit',
          'Përshtatje komode në dorë',
          'Zgjidhje me kosto të ulët për biznese'
        ],
        applications: [
          'Përpunim dhe paketim ushqimi',
          'Shërbime pastrimi',
          'Katering dhe restorante',
          'Sektori i shitjes me pakicë'
        ],
        colors: ["Transparente","Blu","E Zezë"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["Transparente","Blu","E Zezë"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'Polimer Hibrid Pa Pluhur',
        faq: [
          {
                    "question": "Cili është materiali i dorezave Winlyex Pa Pluhur?",
                    "answer": "Winlyex Pa Pluhur është dorezë për shumë përdorime e përbërë nga polimer hibrid pa pluhur."
          },
          {
                    "question": "A lënë njolla pluhuri gjatë përdorimit?",
                    "answer": "Jo, sipërfaqja e brendshme pa pluhur parandalon lënien e njollave."
          },
          {
                    "question": "Cilat ngjyra dhe përmasa ofrohen?",
                    "answer": "Ofrohen në ngjyrë transparente, blu dhe të zezë në përmasat S, M, L dhe XL."
          },
          {
                    "question": "Cilat janë detajet e paketimit?",
                    "answer": "Kutia përmban 100 copë, kartoni 20 kuti (2.000 copë) dhe paleta 70 kartona."
          }
]
      }
    ,
      fa: {
        "name": "دستکش بدون پودر Reflex Winlyex",
        "tagline": "محافظت چندمنظوره، چسبندگی فوق‌العاده و بهداشت بدون پودر.",
        "description": "دستکش بدون پودر Reflex Winlyex راهکاری اقتصادی و ایمن برای بهداشت عمومی و فرآوری مواد غذایی است. سطح بدون پودر آن از ایجاد لکه جلوگیری می‌کند.",
        "features": [
                "مقاومت بالا برای کاربردهای چندمنظوره",
                "سطح داخلی بدون پودر برای کار تمیز",
                "ترکیب ضد آلرژی بدون لاتکس و سیلیکون",
                "کاملاً ایمن برای تماس با مواد غذایی",
                "پوشش آسان و راحتی دست در زمان کار",
                "مزیت قیمتی برای خریدهای عمده B2B"
        ],
        "applications": [
                "تولید و بسته‌بندی مواد غذایی",
                "خدمات نظافت صنعتی و ارگان‌ها",
                "کترینگ و مراکز ارائه غذا",
                "فروشگاه‌ها و غرفه‌های پروتئینی"
        ],
        colors: ["شفاف","آبی","مشکی"],
        sizes: ["S","M","L","XL"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "پلیمر هیبریدی بدون پودر"
},
    }
  },
  {
    id: 'winlyex-thermo-vinyl',
    slug: 'winlyex-thermo-vinyl',
    material: 'Termo Vinil',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Mor', 'Şeffaf', 'Mavi'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      main: '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-main.jpg',
      packaging: '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-packaging.jpg',
      gallery: [
        '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-detail-1.jpg',
        '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-detail-2.jpg',
        '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-detail-3.jpg',
        '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-detail-4.jpg',
        '/images/reflex/winlyex-thermo-vinyl/winlyex-thermo-vinyl-detail-5.jpg'
      ]
    },
    variants: [
      {
        color: 'Mor',
        size: 'S',
        productCode: '2078',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030631',
        cartonBarcode: '8683206030648'
      },
      {
        color: 'Mor',
        size: 'M',
        productCode: '2077',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030617',
        cartonBarcode: '8683206030624'
      },
      {
        color: 'Mor',
        size: 'L',
        productCode: '2076',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030570',
        cartonBarcode: '8683206030587'
      },
      {
        color: 'Mor',
        size: 'XL',
        productCode: '2075',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030556',
        cartonBarcode: '8683206030563'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay Thermo Vinyl Siêu Dày WINLYEX Extra",
      "tagline": "Độ dày vượt trội & Bảo vệ hóa chất",
      "description": "Công thức thermo vinyl tăng cường độ dày mang lại khả năng kháng hóa chất cao và giảm 70% lượng khí thải carbon.",
      "features": [
            "Siêu bền dai",
            "Giảm 70% phát thải carbon",
            "Rào cản bảo vệ cao",
            "Chống rách"
      ],
      "applications": [
            "Vệ sinh công nghiệp nặng",
            "Pha chế hóa chất nhẹ",
            "Bảo trì",
            "Nông nghiệp & Làm vườn"
      ],
      "materialName": "Hợp chất Thermo Vinyl Composite"
},
      zh: {
        "name": "Winlyex 热成型乙烯基手套",
        "tagline": "热压一体成型工艺，高阻隔性，适合大批量消耗场景。",
        "description": "Winlyex 热成型乙烯基手套通过精密热压密封工艺成型，具有优良的防渗漏阻隔性能和极具竞争力的批量采购成本。",
        "materialName": "热成型 PVC / 乙烯基",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 完全符合标准",
        "features": [
                "热压封边工艺，无漏水隐患",
                "经济实惠，专为高周转消耗场景设计",
                "无粉配方，避免残留污染",
                "易于快速抽取佩戴",
                "大批量托盘现货储备"
        ],
        "applications": [
                "快餐连锁与外卖打包",
                "生鲜市场与肉禽处理",
                "保洁服务与垃圾清理",
                "农业采摘与初级分选"
        ],
        "faq": [
                {
                        "question": "热成型手套与常规浸胶手套有什么区别？",
                        "answer": "热成型手套采用膜材热压熔接工艺，厚度均匀、阻隔性好且单位成本更低，特别适合高频次更换场景。"
                }
        ]
},
      ru: {
        "name": "Reflex Winlyex Termo Vinil",
        "tagline": "Термовиниловые перчатки с повышенной термостойкостью и эластичностью",
        "description": "Специальный состав термовинила сочетает в себе гибкость ТПЭ и защитные свойства винила.",
        "materialName": "Термовинил",
        "powderStatus": "Неопудренные",
        "features": [
                "Улучшенная термостойкость",
                "Высокая прочность на растяжение",
                "Безопасно для пищевых продуктов",
                "Не содержит аллергенов латекса"
        ],
        "applications": [
                "Пищевая промышленность",
                "Рестораны и кейтеринг",
                "Лабораторные работы",
                "Уборка и дезинфекция"
        ]
},
      tr: {
        name: 'Winlyex Termo Vinil Eldiven',
        tagline: 'Ekstra kalınlaştırılmış termo vinil yapısı ile yüksek mukavemet ve ekstra dayanıklılık.',
        description: 'Winlyex Termo Vinil Eldiven, standart eldivenlere oranla daha kalın et kalınlığına ve yüksek yırtılma direncine sahip özel formüllü bir eldivendir. Estetik mor ve şeffaf renk seçenekleri ile özellikle zorlu hijyen ve temas gerektiren operasyonlarda tercih edilir.',
        features: [
          'Ekstra et kalınlığı ile üstün yırtılma mukavemeti',
          'Vücut sıcaklığı ile ele tam oturan termo yapı',
          'Pudrasız, silikonsuz ve latekssiz güvenli içerik',
          'Gıda uyumu onaylı hijyenik tasarım',
          'Uzun süreli işlerde yorulmayı önleyen esneklik',
          'Endüstriyel ve medikal dışı saha dayanıklılığı'
        ],
        applications: [
          'Ağır Gıda İşleme ve Et Tesisleri',
          'Temizlik ve Hijyen Firmaları',
          'Güzellik, Kuaför ve Dövme Salonları',
          'Laboratuvar Dışı Analiz & Montaj'
        ],
        colors: ["Mor","Şeffaf","Mavi"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Mor","Şeffaf","Mavi"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'Termo Vinil (Thermo Vinyl)',
        faq: [
          {
                    "question": "Winlyex Thermo Vinyl eldivenin temel özelliği nedir?",
                    "answer": "Elde ısınarak elin şeklini alan, yüksek yırtılma direncine sahip ekstra thermo vinil kalibreye sahiptir."
          },
          {
                    "question": "Lateks, pudra veya silikon içerir mi?",
                    "answer": "Hayır, pudrasız, latekssiz ve silikonsuz üretilmiştir."
          },
          {
                    "question": "Hangi renk ve bedenlerde sunulur?",
                    "answer": "Mor, Şeffaf ve Mavi renklerde S, M, L ve XL beden seçenekleri mevcuttur."
          },
          {
                    "question": "Koli ve palet ambalaj adetleri nedir?",
                    "answer": "Kutuda 100 adet, kolide 20 kutu (2.000 adet) ve palette 70 koli bulunur."
          }
]
      },
      en: {
        name: 'Winlyex Thermo Vinyl Glove',
        tagline: 'Extra thick thermo-vinyl formulation for enhanced tensile strength and durability.',
        description: 'Winlyex Thermo Vinyl Glove is manufactured with an augmented wall thickness for heavy-duty protection against tears and punctures. Softened by body heat, it contours nicely to fingers, making it ideal for demanding commercial environments.',
        features: [
          'Enhanced wall thickness for heavy-duty puncture resistance',
          'Thermo-responsive polymer conforming to hand shape',
          'Powder-free, silicone-free and latex-free composition',
          'Approved for food safety standards',
          'Vibrant color options (Purple/Clear/Blue) for departmental color-coding',
          'Reduces hand fatigue during extended shifts'
        ],
        applications: [
          'Meat & Poultry Processing Lines',
          'Industrial & Commercial Cleaning Services',
          'Cosmetology, Salons & Tattoo Studios',
          'General Maintenance & Assembly'
        ],
        colors: ["Purple","Clear","Blue"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Purple","Clear","Blue"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'Thermo Vinyl Polymer',
        faq: [
          {
                    "question": "What is the main feature of Winlyex Thermo Vinyl gloves?",
                    "answer": "It features an extra thick thermo-vinyl formulation providing enhanced tensile strength and puncture resistance."
          },
          {
                    "question": "Does it contain latex, powder, or silicone?",
                    "answer": "No, it is powder-free, latex-free, and silicone-free."
          },
          {
                    "question": "What colors and sizes are available?",
                    "answer": "Available in Purple, Clear, and Blue across S, M, L, and XL sizes."
          },
          {
                    "question": "What are the logistics and packaging counts?",
                    "answer": "100 gloves per box, 20 boxes per carton (2,000 gloves/carton), and 70 cartons per pallet."
          }
]
      },
      mk: {
        name: 'Winlyex Термо Винил Ракавица',
        tagline: 'Екстра дебела термо-винил структура за зголемена јачина и издржливост.',
        description: 'Winlyex Термо Винил ракавиците имаат поголема дебелина на ѕидот и висока отпорност на кинење. Тие се омекнуваат од телесната топлина и подобро се прилагодуваат на раката.',
        features: [
          'Екстра дебелина за максимална заштита',
          'Термо-форма што се прилагодува на топлината на раката',
          'Без пудра, латекс и силикон',
          'Сертифицирано за храна',
          'Атрактивни бои за секторско кодирање',
          'Намалува замор при долготрајна работа'
        ],
        applications: [
          'Преработка на месо и храна',
          'Индустриско чистење',
          'Салони за убавина',
          'Општо одржување'
        ],
        colors: ["Виолетова","Проѕирна","Сина"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Виолетова","Проѕирна","Сина"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'Термо Винил Полимер',
        faq: [
          {
                    "question": "Која е главната карактеристика на Winlyex Термо Винил ракавиците?",
                    "answer": "Имаат дебела термо-винил структура со зголемена отпорност на кинење која се прилагодува на топлината на раката."
          },
          {
                    "question": "Дали содржат латекс, пудра или силикон?",
                    "answer": "Не, тие се без пудра, без латекс и без силикон."
          },
          {
                    "question": "Кои бои и димензии се достапни?",
                    "answer": "Достапни се во виолетова, проѕирна и сина боја во димензии S, M, L и XL."
          },
          {
                    "question": "Кои се пакувањата?",
                    "answer": "100 парчиња во кутија, 20 кутии во коли (2.000 парчиња) и 70 коли на палета."
          }
]
      },
      sr: {
        name: 'Winlyex Termo Vinil Rukavica',
        tagline: 'Ekstra debela termo vinil struktura za maksimalnu izdržljivost i čvrstinu.',
        description: 'Winlyex Termo Vinil rukavice odlikuje dodatna debljina materijala koja pruža visok nivo zaštite od kidanja. Zahvaljujući termo svojstvima, rukavica se prilagođava toploti dlanova.',
        features: [
          'Povećana debljina za zahtevne poslove',
          'Termo-fleksibilna struktura prilagođena šaci',
          'Bez pudera, lateksa i silikona',
          '100% bezbedno za kontakt sa hranom',
          'Ljubičasta i providna varijanta za podelu po sektorima',
          'Udoban rad tokom celog radnog dana'
        ],
        applications: [
          'Industrija prerade mesa i hrane',
          'Komercijalno čišćenje i higijena',
          'Frizerski i kozmetički saloni',
          'Montažni i servisni radovi'
        ],
        colors: ["Ljubičasta","Providna","Plava"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Ljubičasta","Providna","Plava"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'Termo Vinil Polimer',
        faq: [
          {
                    "question": "Koja je glavna osobina Winlyex Termo Vinil rukavica?",
                    "answer": "Odlikuje ih dodatna debljina materijala koja pruža visok nivo zaštite od kidanja i prilagođava se toploti dlanova."
          },
          {
                    "question": "Da li sadrže lateks, puder ili silikon?",
                    "answer": "Ne, izrađene su bez pudera, lateksa i silikona."
          },
          {
                    "question": "Koje boje i veličine postoje?",
                    "answer": "Proizvode se u ljubičastoj, providnoj i plavoj boji u veličinama S, M, L i XL."
          },
          {
                    "question": "Kakva je ambalaža i logistika?",
                    "answer": "Pakovanje sadrži 100 komada u kutiji, 20 kutija u kartonu (2.000 komada) i 70 kartona na paleti."
          }
]
      },
      sq: {
        name: 'Doreza Termo Vinil Winlyex',
        tagline: 'Strukturë ekstra e trashë termo vinili për rezistencë maksimale.',
        description: 'Dorezat Winlyex Termo Vinil kanë trashësi më të madhe se dorezat standarde duke ofruar mbrojtje të lartë ndaj grisjes. Përshtaten me nxehtësinë e dorës për komfort të gjatë.',
        features: [
          'Trashësi ekstra për punë të rënda',
          'Formë termo-reaguese që merr formën e dorës',
          'Pa pluhur, pa lateks dhe pa silikon',
          'Certifikuar për kontakt me ushqimin',
          'Ngjyrë vjollcë e spikatur për klasifikim ambientesh',
          'Zvogëlon lodhjen e duarve gjatë punës'
        ],
        applications: [
          'Përpunim mishi dhe ushqimi të rëndë',
          'Shërbime pastrimi industrial',
          'Salone bukurie dhe parukeri',
          'Punë mirëmbajtjeje'
        ],
        colors: ["Vjollcë","Transparente","Blu"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["Vjollcë","Transparente","Blu"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'Polimer Termo Vinil',
        faq: [
          {
                    "question": "Cila është veçoria kryesore e dorezave Winlyex Termo Vinil?",
                    "answer": "Ato kanë trashësi ekstra termo vinili për rezistencë më të lartë ndaj grisjes që përshtatet me nxehtësinë e dorës."
          },
          {
                    "question": "A përmbajnë lateks, pluhur apo silikon?",
                    "answer": "Jo, janë prodhuar pa pluhur, pa lateks dhe pa silikon."
          },
          {
                    "question": "Cilat ngjyra dhe përmasa janë me opcione?",
                    "answer": "Të disponueshme në ngjyrë vjollcë, transparente dhe blu në përmasat S, M, L dhe XL."
          },
          {
                    "question": "Cilat janë sasisë e paketimit?",
                    "answer": "100 copë në kuti, 20 kuti në karton (2.000 copë) dhe 70 kartona në paletë."
          }
]
      }
    ,
      fa: {
        "name": "دستکش ترمو وینیل Winlyex",
        "tagline": "ضخامت تقویت‌شده ترمو وینیل برای مقاومت و کشسانی بیشتر.",
        "description": "دستکش ترمو وینیل Winlyex دارای ضخامت بیشتری نسبت به دستکش‌های استاندارد است که مقاومت بالایی در برابر پارگی ایجاد می‌کند. با گرمای دست نرم شده و فرم دست را می‌گیرد.",
        "features": [
                "ضخامت بیشتر برای مقاومت بالا در برابر پارگی",
                "ساختار ترمو منعطف با فرم‌پذیری با دمای دست",
                "بدون پودر، لاتکس و سیلیکون",
                "دارای تاییدیه بهداشتی مواد غذایی",
                "تنوع رنگی (بنفش، شفاف، آبی) برای تفکیک بخش‌ها",
                "کاهش خستگی دست در شیفت‌های طولانی"
        ],
        "applications": [
                "صنایع گوشت و پروتئین",
                "نظافت و بهداشت صنعتی",
                "سالن‌های زیبایی و آرایشگاه‌ها",
                "مونتاژ و نگهداری عمومی"
        ],
        colors: ["بنفش","شفاف","آبی"],
        sizes: ["S","M","L","XL"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "پلیمر ترمو وینیل"
},
    }
  },
  {
    id: 'medilex',
    slug: 'medilex',
    material: 'Sıhhi Polimer (Silikon & Lateks İçermez)',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Yeşil', 'Pembe', 'Mavi', 'Siyah'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      main: '/images/reflex/medilex/medilex-main.jpg',
      packaging: '/images/reflex/medilex/medilex-packaging.jpg',
      gallery: [
        '/images/reflex/medilex/medilex-detail-1.png',
        '/images/reflex/medilex/medilex-detail-2.jpg',
        '/images/reflex/medilex/medilex-detail-3.jpg',
        '/images/reflex/medilex/medilex-detail-4.jpg'
      ]
    },
    variants: [
      {
        color: 'Yeşil',
        size: 'S',
        productCode: '410',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x110x60 mm',
        cartonDimensions: '420x320x240 mm',
        boxBarcode: '8697405391677',
        cartonBarcode: '8697405391684'
      },
      {
        color: 'Yeşil',
        size: 'M',
        productCode: '411',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x110x60 mm',
        cartonDimensions: '420x320x240 mm',
        boxBarcode: '8697405391691',
        cartonBarcode: '8697405391707'
      },
      {
        color: 'Yeşil',
        size: 'L',
        productCode: '412',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x110x60 mm',
        cartonDimensions: '420x320x240 mm',
        boxBarcode: '8697405391714',
        cartonBarcode: '8697405391721'
      },
      {
        color: 'Yeşil',
        size: 'XL',
        productCode: '413',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x110x60 mm',
        cartonDimensions: '420x320x240 mm',
        boxBarcode: '8697405391738',
        cartonBarcode: '8697405391745'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay khám bệnh MEDILEX (Healthy Touch)",
      "tagline": "Khám lâm sàng và chăm sóc sức khỏe",
      "description": "Găng tay khám không tiệt trùng được thiết kế chuyên biệt cho môi trường thăm khám lâm sàng và y tế.",
      "features": [
            "Kiểm tra theo chứng từ",
            "Thẩm định theo thị trường",
            "Không tiệt trùng",
            "Cảm giác xúc giác tốt"
      ],
      "applications": [
            "Phòng khám đa khoa",
            "Chăm sóc bệnh nhân",
            "Xét nghiệm & Lấy mẫu",
            "Chăm sóc nha khoa"
      ],
      "materialName": "Hỗn hợp Polymer y tế / TPE"
},
      zh: {
        "name": "Medilex 医用及卫生级 TPE 手套",
        "tagline": "严苛卫生级标准制造，高抗拉伸强韧度，专为健康与检查设计。",
        "description": "Medilex 采用高纯度医用级 TPE 配方制造，严格遵循国际卫生标准。质地柔软细腻且具备极高韧性，适用于医疗机构常规检查、护理及实验室日常卫生防护。",
        "materialName": "医用级 TPE",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 符合食品与卫生标准",
        "features": [
                "医用级洁净制造工艺与标准",
                "极佳的触觉感知度与抗拉伸断裂性能",
                "100% 不含蛋白质乳胶过敏原",
                "双向左右手通用设计，快速更换",
                "多重国际质量认证合规"
        ],
        "applications": [
                "诊所与体检中心常规检查",
                "医护日常辅助与护理",
                "牙科及诊疗准备",
                "制药与生物实验室辅助"
        ],
        "faq": [
                {
                        "question": "Medilex 手套是否适用于医疗检查？",
                        "answer": "适用于非灭菌常规体检、基础护理、口腔卫生辅助及实验室日常操作。"
                },
                {
                        "question": "与天然乳胶手套相比有何优势？",
                        "answer": "彻底杜绝 I 型乳胶过敏反应，无粉无气味，储存稳定期更长。"
                }
        ]
},
      ru: {
        "name": "Reflex Medilex",
        "tagline": "Гигиенические виниловые перчатки медицинского и смотрового назначения",
        "description": "Перчатки Reflex Medilex разработаны для применения в смотровых кабинетах и санитарных зонах.",
        "materialName": "Винил медицинского качества",
        "powderStatus": "Неопудренные",
        "features": [
                "Высокий стандарт гигиенической защиты",
                "Без пудры, гипоаллергенно",
                "Анатомическая форма",
                "Высокая прочность материалов"
        ],
        "applications": [
                "Санитарно-гигиенический уход",
                "Смотровые процедуры",
                "Лаборатории и фармацевтика",
                "Косметологические центры"
        ]
},
      tr: {
        name: 'Medilex Muayene Eldiveni',
        tagline: 'Sıhhi temas ve hijyenik muayene standartlarına uygun, pudrasız koruyucu eldiven.',
        description: 'Medilex Muayene Eldiveni, hassas hijyen temasları ve muayene ortamları için özel geliştirilmiş sıhhi eldivendir. Silikon ve lateks içermeyen yapısı, cilt tahrişlerini önlerken renkli ambalaj ve eldiven seçenekleriyle bölümler arası hijyen takibini kolaylaştırır.',
        features: [
          'Sıhhi temas ve hijyenik ortamlar için üstün standart',
          'Pudrasız, latekssiz ve silikonsuz anti-alerjenik yapı',
          'Mükemmel dokunma hassasiyeti ve kavrama yeteneği',
          'Çeşitli renk seçenekleri (Yeşil, Pembe, Mavi, Siyah)',
          'Gıda ve kişisel bakım hijyenine %100 uygunluk',
          'Kolay ambalaj erişimi ve düzenli kutu tasarımı'
        ],
        applications: [
          'Genel Muayene & İlk Temas Hizmetleri',
          'Klinik & Bakım Merkezleri',
          'Estetik, Medikal Güzellik & Bakım',
          'Hassas Laboratuvar Dışı İncelemeler'
        ],
        colors: ["Yeşil","Pembe","Mavi","Siyah"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Yeşil","Pembe","Mavi","Siyah"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'Sıhhi Hijyen Polimeri',
        faq: [
          {
                    "question": "Medilex Muayene eldiveni hangi kullanım alanları için uygundur?",
                    "answer": "Sağlık, hijyenik muayene ve kişisel bakım merkezleri için tasarlanmıştır."
          },
          {
                    "question": "Alerjenik lateks veya silikon içerir mi?",
                    "answer": "Hayır, latekssiz, silikonsuz ve pudrasız hipoalerjenik yapıdadır."
          },
          {
                    "question": "Hangi renk seçenekleri sunulmaktadır?",
                    "answer": "Yeşil, Pembe, Mavi ve Siyah renk seçenekleri mevcuttur."
          },
          {
                    "question": "Kutu ve koli ölçüleri nedir?",
                    "answer": "S, M, L, XL bedenlerinde; kutu boyutu 200x110x60 mm, koli boyutu 420x320x240 mm (20 kutulu) olarak paketlenir."
          }
]
      },
      en: {
        name: 'Medilex Examination Glove',
        tagline: 'Compliant with sanitary contacts and hygienic examination standards, powder-free.',
        description: 'Medilex Examination Glove is engineered for hygienic care routines and sanitary contact requirements. Free from latex and silicone allergens, it protects sensitive skins while supporting strict cross-contamination controls.',
        features: [
          'High compliance with sanitary examination routines',
          'Latex-free, silicone-free & powder-free formulation',
          'Outstanding tactile sensitivity for detailed handling',
          'Color options (Green, Pink, Blue, Black) for color-coded hygiene zones',
          '100% compliant with food and personal care standards',
          'Ergonomic box dispenser packaging'
        ],
        applications: [
          'General Examination & First Care',
          'Personal Care & Wellness Centers',
          'Aesthetic & Beauty Practices',
          'Hygienic Surface & Sample Handling'
        ],
        colors: ["Green","Pink","Blue","Black"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Green","Pink","Blue","Black"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'Sanitary Hygiene Polymer',
        faq: [
          {
                    "question": "What applications are Medilex examination gloves suitable for?",
                    "answer": "Medilex is engineered for hygienic care routines, sanitary contacts, personal wellness, and aesthetic applications."
          },
          {
                    "question": "Does Medilex contain latex or silicone allergens?",
                    "answer": "No, it features a powder-free, latex-free, and silicone-free hypoallergenic composition."
          },
          {
                    "question": "What colors are available?",
                    "answer": "Available in Green, Pink, Blue, and Black for color-coded hygiene zones."
          },
          {
                    "question": "What are the dimensions and packaging specs?",
                    "answer": "Available in S, M, L, and XL. Box dimensions 200x110x60 mm, carton dimensions 420x320x240 mm with 20 boxes per carton."
          }
]
      },
      mk: {
        name: 'Medilex Ракавица за Преглед',
        tagline: 'Соодветна за санитарен контакт и прегледи, без пудра.',
        description: 'Medilex ракавиците за преглед се развиени за хигиенски среди и санитарни прегледи. Не содржат силикон и латекс, спречувајќи иритација на кожата и овозможувајќи одлична чувствителност.',
        features: [
          'Висок стандард за санитарен контакт',
          'Без латекс, силикон и пудра',
          'Одлична чувствителност при работа',
          'Повеќе бои (зелена, розева, сина, црна)',
          'Погодна за храна и лична нега',
          'Практично кутија-пакување'
        ],
        applications: [
          'Општи прегледи и нега',
          'Центри за лична нега',
          'Естетски салони',
          'Хигиенска анализа'
        ],
        colors: ["Зелена","Розева","Сина","Црна"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Зелена","Розева","Сина","Црна"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'Санитарен Хигиенски Полимер',
        faq: [
          {
                    "question": "За кои намени се развиени Medilex ракавиците за преглед?",
                    "answer": "Medilex се наменети за санитарен контакт, хигиенски прегледи и лична нега."
          },
          {
                    "question": "Дали содржат латекс или силикон?",
                    "answer": "Не, тие се без латекс, без силикон и без пудра со хипоалерген состав."
          },
          {
                    "question": "Кои бои се достапни?",
                    "answer": "Достапни се во зелена, розева, сина и црна боја."
          },
          {
                    "question": "Кои се димензиите на кутијата и колито?",
                    "answer": "Достапни во S, M, L и XL. Кутија 200x110x60 mm, коли 420x320x240 mm со 20 кутии во коли."
          }
]
      },
      sr: {
        name: 'Medilex Rukavica za Pregled',
        tagline: 'Namenjena sanitarnom kontaktu i pregledima, bez pudera i lateksa.',
        description: 'Medilex rukavice za pregled pružaju visok nivo zaštite u higijenskim i sanitarnim okruženjima. Materijal ne sadrži alergene poput lateksa i silikona, pružajući izuzetnu osetljivost prstiju.',
        features: [
          'Sanitarni standardi za pregled i higijenu',
          'Bez lateksa, silikona i pudera',
          'Izuzetna taktilna osetljivost',
          'Dostupno u više boja (zelena, roze, plava, crna)',
          'Sertifikovano za kontakt sa hranom i telom',
          'Ergonomsko dozator pakovanje'
        ],
        applications: [
          'Opšti pregledi i nega',
          'Kozmetička i estetska nega',
          'Higijenske ustanove',
          'Laboratorijske i analitičke usluge'
        ],
        colors: ["Zelena","Roze","Plava","Crna"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Zelena","Roze","Plava","Crna"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'Sanitarni Higijenski Polimer',
        faq: [
          {
                    "question": "Za koje primene su namenjene Medilex rukavice za pregled?",
                    "answer": "Medilex rukavice su razvijene za sanitarni kontakt, higijenske preglede i estetsku negu."
          },
          {
                    "question": "Da li sadrže lateks ili silikonske alergene?",
                    "answer": "Ne, izrađene su bez lateksa, silikona i pudera sa hipoalergenskom formulom."
          },
          {
                    "question": "U kojim bojama su dostupne?",
                    "answer": "Dostupne su u zelenoj, roze, plavoj i crnoj boji radi lakšeg razdvajanja sektora."
          },
          {
                    "question": "Koje su dimenzije ambalaže?",
                    "answer": "Dostupne u veličinama S, M, L, XL. Dimenzije kutije 200x110x60 mm, kartona 420x320x240 mm sa 20 kutija u kartonu."
          }
]
      },
      sq: {
        name: 'Doreza Medilex për Kontroll',
        tagline: 'Përputhje me standardet e kontrollit sanitar, pa pluhur.',
        description: 'Dorezat Medilex për Kontroll janë zhvilluar për përdorim në mjedise sanitare dhe kujdes higjienik. Formula pa lateks dhe pa silikon parandalon alergjitë e lëkurës.',
        features: [
          'Standard i lartë për përdorim sanitar',
          'Pa pluhur, pa lateks dhe pa silikon',
          'Sensitivitet i shkëlqyer i gishtave',
          'Variantet e ngjyrave (jeshile, rozë, blu, e zezë)',
          '100% e përshtatshme për ushqim dhe kujdes personal',
          'Paketim praktik me shpërndarës'
        ],
        applications: [
          'Kontrolle të përgjithshme sanitare',
          'Qendra bukurie dhe kujdesi',
          'Estetikë dhe parukeri',
          'Kujdes higjienik personal'
        ],
        colors: ["Jeshile","Rozë","Blu","E Zezë"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["Jeshile","Rozë","Blu","E Zezë"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'Polimer Sanitar Higjienik',
        faq: [
          {
                    "question": "Për cilat përdorime janë zhvilluar dorezat Medilex për kontroll?",
                    "answer": "Medilex janë zhvilluar për përdorim në mjedise sanitare, kontrolle higjienike dhe kujdes estetik."
          },
          {
                    "question": "A përmbajnë lateks apo silikon?",
                    "answer": "Jo, janë pa lateks, pa silikon dhe pa pluhur me përbërje hipoalergjike."
          },
          {
                    "question": "Cilat ngjyra janë në dispozicion?",
                    "answer": "Të disponueshme në ngjyrë jeshile, rozë, blu dhe të zezë."
          },
          {
                    "question": "Cilat janë përmasat e paketimit?",
                    "answer": "Ofrohen në S, M, L, XL. Përmasa e kutisë 200x110x60 mm, kartoni 420x320x240 mm me 20 kuti në karton."
          }
]
      }
    ,
      fa: {
        "name": "دستکش معاینه Medilex",
        "tagline": "مطابق با استانداردهای تماس بهداشتی و معاینه، بدون پودر.",
        "description": "دستکش معاینه Medilex برای مراقبت‌های بهداشتی و معاینات عمومی طراحی شده است. فاقد آلرژن‌های لاتکس و سیلیکون بوده و از پوست‌های حساس محافظت می‌کند.",
        "features": [
                "استاندارد بالا برای تماس‌های بهداشتی",
                "فرمولاسیون بدون لاتکس، سیلیکون و پودر",
                "حس لمس فوق‌العاده برای کارهای دقیق",
                "تنوع رنگی (سبز، صورتی، آبی، مشکی)",
                "۱۰۰٪ مطابق با استانداردهای بهداشتی و غذایی",
                "بسته‌بندی جعبه‌ای ارگونومیک"
        ],
        "applications": [
                "معاینات عمومی و مراقبت‌های اولیه",
                "مراکز مراقبت پوست و زیبایی",
                "کلینیک‌های زیبایی و استتیک",
                "نمونه‌برداری و بررسی‌های بهداشتی"
        ],
        colors: ["سبز","صورتی","آبی","مشکی"],
        sizes: ["S","M","L","XL"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "پلیمر بهداشتی Medilex"
},
    }
  },
  {
    id: 'florex',
    slug: 'florex',
    material: 'TPE (Termoplastik Elastomer)',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Mavi', 'Siyah', 'Şeffaf', 'Krem'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      main: '/images/reflex/florex/florex-main.jpg',
      packaging: '/images/reflex/florex/florex-detail-1.jpg',
      gallery: [
        '/images/reflex/florex/florex-detail-2.jpg',
        '/images/reflex/florex/florex-detail-3.jpg',
        '/images/reflex/florex/florex-detail-4.jpg',
        '/images/reflex/florex/florex-packaging.jpg'
      ]
    },
    variants: [
      {
        color: 'Mavi',
        size: 'S',
        productCode: '2074',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030594',
        cartonBarcode: '8683206030600'
      },
      {
        color: 'Mavi',
        size: 'M',
        productCode: '2073',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030433',
        cartonBarcode: '8683206030440'
      },
      {
        color: 'Mavi',
        size: 'L',
        productCode: '2072',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030419',
        cartonBarcode: '8683206030426'
      },
      {
        color: 'Mavi',
        size: 'XL',
        productCode: '2071',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '200x120x28.5 mm',
        cartonDimensions: '500x245x170 mm',
        boxBarcode: '8683206030396',
        cartonBarcode: '8683206030402'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay đa năng FLOREX",
      "tagline": "Thiết kế co giãn & Cảm giác mềm mại",
      "description": "Găng tay bảo hộ đa dụng tiện lợi cho hộ gia đình, dịch vụ ăn uống và vệ sinh tổng hợp.",
      "features": [
            "Mềm mại thoải mái",
            "Đa bề mặt",
            "Chi phí kinh tế",
            "Nhiều màu sắc"
      ],
      "applications": [
            "Hộ gia đình",
            "Nhà hàng & Quán cà phê",
            "Vệ sinh văn phòng",
            "Thẩm mỹ & Spa"
      ],
      "materialName": "Hỗn hợp Polymer co giãn"
},
      zh: {
        "name": "Florex 多功能彩色防护手套",
        "tagline": "缤纷多色区分管理，出众弹性，美容美发与餐饮首选。",
        "description": "Florex 彩色 TPE 系列提供多种亮丽色彩选择，便于企业实施 HACCP 分区交叉污染控制管理。高回弹性能与潮流视觉体验，深受专业沙龙与高端餐饮青睐。",
        "materialName": "彩色高弹 TPE",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 100% 安全接触",
        "features": [
                "多色可选（黑/蓝/紫/绿/粉），支持色标分区管理",
                "超柔软贴合配方，长时间佩戴舒适不易疲劳",
                "防滑表面纹理，湿滑环境下抓握稳固",
                "无粉低过敏原，保护操作者双手",
                "提升终端服务形象与专业感"
        ],
        "applications": [
                "美容美发沙龙与染发护发",
                "星级酒店与主题餐饮厨房",
                "纹身与美甲艺术工作室",
                "高端零售展陈与分拣"
        ],
        "faq": [
                {
                        "question": "Florex 为什么提供多种颜色？",
                        "answer": "多色系统便于在食品加工和大型厨房中按区域分色管理，有效防止交叉污染；同时满足沙龙美观需求。"
                },
                {
                        "question": "颜色是否会发生迁移或脱色？",
                        "answer": "颜料在原材料聚合阶段熔融混合，化学性能稳定，与食物和水接触不会发生色素脱落。"
                }
        ]
},
      ru: {
        "name": "Reflex Florex",
        "tagline": "Универсальные хозяйственные и профессиональные перчатки",
        "description": "Перчатки Florex предназначены для интенсивной уборки и хозяйственных нужд.",
        "materialName": "ПВХ / Винил",
        "powderStatus": "Неопудренные",
        "features": [
                "Повышенная износостойкость",
                "Защита от бытовой химии",
                "Комфортное прилегание",
                "Экономичный расход"
        ],
        "applications": [
                "Клининговые компании",
                "Хозяйственные работы",
                "Садоводство",
                "Обслуживание объектов"
        ]
},
      tr: {
        name: 'Florex Eldiven',
        tagline: 'Çok amaçlı elastik tasarım, yumuşak mikro doku ve ekonomik B2B tedarik çözümü.',
        description: 'Florex Eldiven, yüksek kullanım hacmine sahip işletmeler için özel olarak üretilen çok amaçlı TPE eldivendir. Esnek yapısı, hafifliği ve geniş renk yelpazesi ile mutfaklardan üretim hatlarına kadar geniş bir alanda pratik koruma sağlar.',
        features: [
          'Ergonomik mikro doku ile kaymaz tutuş',
          'Kokusuz, tatsız ve cilt dostu TPE formülü',
          'Pudrasız, latekssiz ve silikonsuz içerik',
          'Gıda hijyen yönetmeliklerine tam uyum',
          'Yüksek adetli siparişlerde cazip maliyet avantajı',
          'Hızlı giyme ve kolay çıkarma imkanı'
        ],
        applications: [
          'Endüstriyel Mutfak & Yemekhaneler',
          'Supermarket & Şarküteri Reyonları',
          'Genel Paketleme ve Montaj Lines',
          'Günlük Temizlik Operasyonları'
        ],
        colors: ["Mavi","Siyah","Şeffaf","Krem"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Mavi","Siyah","Şeffaf","Krem"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'Çok Amaçlı TPE',
        faq: [
          {
                    "question": "Florex eldivenin yüzey kavrama dokusu nasıldır?",
                    "answer": "Kaydırmaz TPE malzemeden üretilmiş mikro dokulu kavrama yüzeyine sahiptir."
          },
          {
                    "question": "Pudrasız ve latekssiz midir?",
                    "answer": "Evet, pudrasız, latekssiz ve silikonsuzdur; kokusuz formüllüdür."
          },
          {
                    "question": "Hangi renk ve beden seçenekleri mevcuttur?",
                    "answer": "Mavi, Siyah, Şeffaf ve Krem renklerde S, M, L ve XL bedenlerinde mevcuttur."
          },
          {
                    "question": "Koli ambalaj kapasitesi nedir?",
                    "answer": "Kutuda 100 adet, kolide 20 kutu (2.000 adet) ve palette 70 koli yer alır."
          }
]
      },
      en: {
        name: 'Florex Glove',
        tagline: 'Multipurpose elastic design, soft micro-texture and high-volume B2B supply value.',
        description: 'Florex Glove is a high-demand disposable TPE glove tailored for high-volume commercial users. Offering light flex elasticity and vibrant color choices, it ensures clean contact across kitchens, assembly lines, and retail counters.',
        features: [
          'Ergonomic micro-textured grip surface',
          'Odorless, neutral-tasting food grade TPE compound',
          'Powder-free, latex-free and silicone-free formula',
          'Complies with food safety regulations',
          'Strong cost-efficiency for bulk enterprise purchasing',
          'Fast donning donut cuff'
        ],
        applications: [
          'Commercial Kitchens & Bakeries',
          'Supermarket Deli Counters',
          'Light Packaging & Sorting Lines',
          'Daily Hygiene & Maintenance'
        ],
        colors: ["Blue","Black","Clear","Cream"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Blue","Black","Clear","Cream"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'Multipurpose TPE',
        faq: [
          {
                    "question": "What is the surface grip texture of Florex gloves?",
                    "answer": "Florex features an ergonomic micro-textured grip surface made of non-slip TPE material."
          },
          {
                    "question": "Is it latex-free and powder-free?",
                    "answer": "Yes, it is powder-free, latex-free, and silicone-free with an odorless food-grade compound."
          },
          {
                    "question": "What colors and sizes are available?",
                    "answer": "Available in Blue, Black, Clear, and Cream across S, M, L, and XL sizes."
          },
          {
                    "question": "What are the packaging details?",
                    "answer": "Packed with 100 pieces per box, 20 boxes per carton (2,000 pieces/carton), and 70 cartons per pallet."
          }
]
      },
      mk: {
        name: 'Florex Ракавица',
        tagline: 'Повеќенаменски еластичен дизајн, мека текстура и одличен квалитет.',
        description: 'Florex ракавиците се дизајнирани за компании со голем обем на работа. Овие TPE ракавици нудат практична хигиенска заштита за кујни, пакување и малопродажба.',
        features: [
          'Микро-текстура за подобро држење',
          'Без мирис и без вкус TPE материјал',
          'Без пудра, латекс и силикон',
          'Сертифицирано за храна',
          'Економична цена за поголеми количини',
          'Брзо и лесно облекување'
        ],
        applications: [
          'Комерцијални кујни',
          'Супермаркети и деликатес',
          'Линии за пакување',
          'Секојдневно чистење'
        ],
        colors: ["Сина","Црна","Проѕирна","Крем"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Сина","Црна","Проѕирна","Крем"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'Повеќенаменски TPE',
        faq: [
          {
                    "question": "Каква е површината на Florex ракавиците?",
                    "answer": "Florex ракавиците имаат микро-текстура за подобро држење изработена од TPE материјал."
          },
          {
                    "question": "Дали содржат пудра или латекс?",
                    "answer": "Без пудра, без латекс и без силикон, без мирис и без вкус."
          },
          {
                    "question": "Кои бои и димензии се достапни?",
                    "answer": "Достапни во сина, црна, проѕирна и крем боја во димензии S, M, L и XL."
          },
          {
                    "question": "Колку парчиња има во кутија и коли?",
                    "answer": "100 парчиња во кутија, 20 кутии во коли (2.000 парчиња) и 70 коли на палета."
          }
]
      },
      sr: {
        name: 'Florex Rukavica',
        tagline: 'Višenamenski elastični dizajn, meka tekstura i ekonomično B2B rešenje.',
        description: 'Florex rukavice su prilagođene velikim sistemima i pogonima kojima je potrebna pouzdana jednokratna zaštita. TPE materijal je lagan, rastegljiv i bezbedan u kontaktu sa hranom.',
        features: [
          'Mikro-tekstura protiv klizanja',
          'Bez mirisa i ukusa, prijatna za kožu',
          'Bez pudera, lateksa i silikona',
          'Potpuno bezbedna za hranu',
          'Visok nivo ekonomičnosti u nabavci',
          'Jednostavno oblačenje i skidanje'
        ],
        applications: [
          'Restoranske i kuhinjske operacije',
          'Deli odeljenja u supermarketima',
          'Pakovanje i sortiranje robe',
          'Svakodnevno održavanje higijene'
        ],
        colors: ["Plava","Crna","Providna","Krem"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Plava","Crna","Providna","Krem"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'Višenamenski TPE',
        faq: [
          {
                    "question": "Kakva je tekstura Florex rukavica?",
                    "answer": "Florex rukavice imaju mikro-teksturu protiv klizanja izrađenu od TPE materijala."
          },
          {
                    "question": "Da li sadrže puder ili lateks?",
                    "answer": "Bez pudera su, bez lateksa i bez silikona, prijatne za kožu i bez mirisa."
          },
          {
                    "question": "U kojim bojama i veličinama se proizvode?",
                    "answer": "Dostupne u plavoj, crnoj, providnoj i krem boji u veličinama S, M, L i XL."
          },
          {
                    "question": "Kakav je raspored pakovanja?",
                    "answer": "Kutija ima 100 komada, karton 20 kutija (2.000 komada), a paleta 70 kartona."
          }
]
      },
      sq: {
        name: 'Doreza Florex',
        tagline: 'Dizajn elastik për shumë përdorime, cilësi e butë dhe furnizim ekonomik B2B.',
        description: 'Dorezat Florex janë të projektuara posaçërisht për biznese me volum të lartë përdorimi. Materiali TPE ofron elasticitet, lehtësi dhe mbrojtje higjienike në kuzhina dhe linja paketimi.',
        features: [
          'Mikro-teksturë për kapje pa rrëshqitje',
          'Material TPE pa erë dhe pa shije',
          'Pa pluhur, pa lateks dhe pa silikon',
          'Përputhje e plotë me rregulloret ushqimore',
          'Kosto shumë avantazhuese për blerje me shumicë',
          'Veshje e shpejtë dhe praktike'
        ],
        applications: [
          'Kuzhina industriale dhe furra',
          'Raipe ushqimore në supermarkete',
          'Linja paketimi dhe montimi',
          'Pastrim i përditshëm'
        ],
        colors: ["Blu","E Zezë","Transparente","Krem"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["Blu","E Zezë","Transparente","Krem"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'TPE për Shumë Përdorime',
        faq: [
          {
                    "question": "Cila është tekstura e dorezave Florex?",
                    "answer": "Florex ka mikro-teksturë ergonomike për kapje pa rrëshqitje nga material TPE."
          },
          {
                    "question": "A përmbajnë pluhur apo lateks?",
                    "answer": "Janë pa pluhur, pa lateks dhe pa silikon, pa erë dhe pa shije."
          },
          {
                    "question": "Cilat ngjyra dhe përmasa janë me opcione?",
                    "answer": "Të disponueshme në ngjyrë blu, të zezë, transparente dhe krem në përmasat S, M, L dhe XL."
          },
          {
                    "question": "Cilat janë sasisë e paketimit?",
                    "answer": "100 copë në kuti, 20 kuti në karton (2.000 copë) dhe 70 kartona në paletë."
          }
]
      }
    ,
      fa: {
        "name": "دستکش Florex",
        "tagline": "طراحی الاستیک چندمنظوره، بافت میکرو نرم و مقرون‌به‌صرفه برای خریدهای B2B.",
        "description": "دستکش Florex یک دستکش مصرفی TPE برای مصارف حجیم تجاری است. با وزن سبک و انعطاف‌پذیری مناسب، محافظت بهداشتی عالی در آشپزخانه‌ها و خطوط بسته‌بندی ارائه می‌دهد.",
        "features": [
                "سطح میکرو برای گیرایی بدون لغزش",
                "ترکیب TPE بدون بو و بدون طعم",
                "بدون پودر، لاتکس و سیلیکون",
                "مطابق با مقررات بهداشت مواد غذایی",
                "مقرون‌به‌صرفه برای خریدهای عمده تجاری",
                "پوشش سریع و آسان"
        ],
        "applications": [
                "آشپزخانه‌های صنعتی و قنادی‌ها",
                "غرفه‌های پروتئینی و سوپرمارکت‌ها",
                "خطوط بسته‌بندی و سورتینگ",
                "نظافت روزانه و عمومی"
        ],
        colors: ["آبی","مشکی","شفاف","کرم"],
        sizes: ["S","M","L","XL"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "TPE چندمنظوره"
},
    }
  },
  {
    id: 'slimfit-copolymer',
    slug: 'slimfit-copolymer',
    material: 'Kopolimer Polimer',
    powderStatus: 'Pudrasız',
    latexStatus: 'Lateks İçermez',
    siliconeStatus: 'Silikon İçermez',
    sterilityStatus: 'Non-Steril',
    foodContact: true,
    colors: ['Krem', 'Şeffaf'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      main: '/images/reflex/slimfit-copolymer/slimfit-copolymer-main.jpg',
      packaging: '/images/reflex/slimfit-copolymer/slimfit-copolymer-packaging.jpg',
      gallery: [
        '/images/reflex/slimfit-copolymer/slimfit-copolymer-detail-1.jpg',
        '/images/reflex/slimfit-copolymer/slimfit-copolymer-detail-2.jpg'
      ]
    },
    variants: [
      {
        color: 'Krem',
        size: 'S',
        productCode: '30',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '190x100x60 mm',
        cartonDimensions: '400x320x210 mm',
        boxBarcode: '8683206030112',
        cartonBarcode: '8683206030129'
      },
      {
        color: 'Krem',
        size: 'M',
        productCode: '29',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '190x100x60 mm',
        cartonDimensions: '400x320x210 mm',
        boxBarcode: '8683206030099',
        cartonBarcode: '8683206030105'
      },
      {
        color: 'Krem',
        size: 'L',
        productCode: '28',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '190x100x60 mm',
        cartonDimensions: '400x320x210 mm',
        boxBarcode: '8683206030075',
        cartonBarcode: '8683206030082'
      },
      {
        color: 'Krem',
        size: 'XL',
        productCode: '27',
        boxQuantity: '100 Adet',
        cartonQuantity: '20 Kutu',
        palletQuantity: '70 Koli',
        boxDimensions: '190x100x60 mm',
        cartonDimensions: '400x320x210 mm',
        boxBarcode: '8683206030051',
        cartonBarcode: '8683206030068'
      }
    ],
    i18n: {
    vi: {
      "name": "Găng tay nhạy cảm Copolymer SLIMFIT",
      "tagline": "Thoáng khí & Chống mồ hôi tay",
      "description": "Phát triển với công nghệ thoáng khí giúp chống bí mồ hôi tay trong khi vẫn duy trì cảm giác cầm nắm xúc giác chính xác.",
      "features": [
            "Thoáng khí",
            "Chống mồ hôi tay",
            "Tái chế 100%",
            "Ôm sát ngón tay"
      ],
      "applications": [
            "Lắp ráp điện tử",
            "Thao tác tinh xảo",
            "Chia chọn thực phẩm",
            "Thẩm mỹ viện"
      ],
      "materialName": "Copolymer không bột"
},
      zh: {
        "name": "Slimfit 共聚物轻薄贴合手套",
        "tagline": "微米级共聚物材料，超轻薄裸感体验，高灵敏触觉反馈。",
        "description": "Slimfit 采用先进共聚物 (Copolymer) 聚合技术制造，具有超越传统塑料手套的轻薄厚度与惊人贴合度，为精密装配与精细餐饮操作带来近乎裸手的操作灵敏度。",
        "materialName": "共聚物 (Copolymer)",
        "powderStatus": "无粉",
        "latexStatus": "不含乳胶",
        "siliconeStatus": "不含硅油",
        "sterilityStatus": "非灭菌",
        "foodContactLabel": "是 / 完全符合标准",
        "features": [
                "极致轻薄裸感贴合，操作灵敏度极高",
                "微米级均匀厚度控制，兼具防漏阻隔",
                "无粉无味，环保可降解配方",
                "超低包装体积，极大降低跨境运输仓储成本",
                "高性价比的大批量替代方案"
        ],
        "applications": [
                "寿司制作与精细点心烘焙",
                "精密电子元件组装与质检",
                "光学仪器与钟表维护",
                "高频次快速更换的零售柜台"
        ],
        "faq": [
                {
                        "question": "共聚物材料有哪些核心特点？",
                        "answer": "Slimfit 共聚物材料延展性极好，触感非常轻薄，贴手度远超普通 PE 手套，且单重更轻，显著节省运输物流成本。"
                }
        ]
},
      ru: {
        "name": "Reflex Slimfit Copolymer",
        "tagline": "Тонкие и высокочувствительные сополимерные перчатки",
        "description": "Ультратонкие сополимерные перчатки Slimfit обеспечивают максимальную тактильную чувствительность.",
        "materialName": "Сополимер",
        "powderStatus": "Неопудренные",
        "features": [
                "Ультратонкий материал с высокой чувствительностью",
                "Подходит для контакта с продуктами",
                "Без пудры и без латекса",
                "Плотно прилегает к кисти"
        ],
        "applications": [
                "Точная сборка и электроника",
                "Пищевое оформление и кондитерские",
                "Косметология и макияж",
                "Лабораторные исследования"
        ]
},
      tr: {
        name: 'Reflex Slimfit Copolymer Eldiven',
        tagline: 'İnce kopolimer formülasyonu ile maksimum hassasiyet ve konforlu kavrama.',
        description: 'Reflex Slimfit Copolymer Eldiven, ekstra ince ve esnek kopolimer polimer teknolojisiyle üretilmiş özel bir üründür. Parmak hassasiyetinin ön planda olduğu ince işlerde, laboratuvar dışı hassas montajlarda ve gıda sunumlarında ikinci bir cilt hissi yaratır.',
        features: [
          'İnce et kalınlığı ile yüksek dokunma hassasiyeti',
          'Kopolimer özel karışım ile yüksek esneklik',
          'Pudrasız, latekssiz ve silikonsuz anti-alerjen yapı',
          'Ele tam oturan slimfit ergonomik kalıp',
          'Gıda temas onaylı güvenli yapı',
          'Estetik krem ve şeffaf renk görünümü'
        ],
        applications: [
          'Hassas Gıda Sunumu ve Pastacılık',
          'Kozmetik & Hassas Bakım Uygulamaları',
          'Elektronik & İnce Montaj İşleri',
          'Kişisel Hijyen & Genel Temas'
        ],
        colors: ["Krem","Şeffaf"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        colors: ["Krem","Şeffaf"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pudrasız",
        latexStatus: "Lateks İçermez",
        siliconeStatus: "Silikon İçermez",
        sterilityStatus: "Non-Steril",
        foodContactLabel: "Evet / Tam Uyumlu",
        materialName: 'Kopolimer Polimer',
        faq: [
          {
                    "question": "Slimfit Copolymer eldivenin öne çıkan özelliği nedir?",
                    "answer": "İkinci bir ten hissi yaratan ultra ince kopolimer yapısıyla maksimum dokunsal hassasiyet sağlar."
          },
          {
                    "question": "Hangi hassas işler için önerilir?",
                    "answer": "Pastacılık, gıda süsleme, cilt bakımı ve hassas montaj işleri için idealdir."
          },
          {
                    "question": "Pudra veya lateks barındırır mı?",
                    "answer": "Hayır, pudrasız, latekssiz ve silikonsuzdur."
          },
          {
                    "question": "Kutu ölçüleri ve renk seçenekleri nelerdir?",
                    "answer": "Krem ve Şeffaf renk seçeneklerinde S, M, L, XL bedenlerde sunulur. Kutu boyutu 190x100x60 mm, koli boyutu 400x320x210 mm'dir."
          }
]
      },
      en: {
        name: 'Reflex Slimfit Copolymer Glove',
        tagline: 'Thin copolymer formulation engineered for maximum tactile feel and slimfit comfort.',
        description: 'Reflex Slimfit Copolymer Glove features an ultra-thin copolymer matrix that creates a second-skin feel. Perfect for applications requiring delicate finger touch, precision assembly, or refined culinary presentation.',
        features: [
          'Ultra-thin gauge for maximum tactile sensitivity',
          'Special copolymer blend providing high elasticity',
          'Powder-free, latex-free and silicone-free formula',
          'Slimfit ergonomic contour hugging fingers',
          'Approved for food safety standards',
          'Refined Cream & Clear aesthetic appearance'
        ],
        applications: [
          'Fine Bakery & Gourmet Food Presentation',
          'Cosmetology & Precision Skincare',
          'Micro-Assembly & Delicate Handling',
          'Personal Hygiene & Touch Safety'
        ],
        colors: ["Cream","Clear"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        colors: ["Cream","Clear"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Powder-Free",
        latexStatus: "Latex-Free",
        siliconeStatus: "Silicone-Free",
        sterilityStatus: "Non-Sterile",
        foodContactLabel: "Yes / Fully Compliant",
        materialName: 'Copolymer Polymer',
        faq: [
          {
                    "question": "What is the distinguishing feature of Slimfit Copolymer gloves?",
                    "answer": "It features an ultra-thin copolymer matrix providing a second-skin feel and maximum tactile sensitivity."
          },
          {
                    "question": "What applications is it recommended for?",
                    "answer": "Ideal for delicate food presentation, gourmet bakery, cosmetology, and micro-assembly."
          },
          {
                    "question": "Does it contain latex or powder?",
                    "answer": "No, it is powder-free, latex-free, and silicone-free."
          },
          {
                    "question": "What are the dimensions and color choices?",
                    "answer": "Available in Cream and Clear in S, M, L, XL. Box size 190x100x60 mm, carton size 400x320x210 mm."
          }
]
      },
      mk: {
        name: 'Reflex Slimfit Copolymer Ракавица',
        tagline: 'Тенка кополимерна формула за максимална чувствителност и комфорт.',
        description: 'Reflex Slimfit Copolymer ракавиците се изработени со ултра-тенка кополимерна матрица што дава чувство на втора кожа. Совршени за прецизни работи, слаткарство и занаетчиство.',
        features: [
          'Ултра-тенки за максимална чувствителност',
          'Специјална кополимерна мешавина за висока еластичност',
          'Без пудра, латекс и силикон',
          'Slimfit ергономски облик',
          'Сертифицирано за храна',
          'Естегски крем и проѕирен изглед'
        ],
        applications: [
          'Слаткарство и декорација храна',
          'Козметика и прецизна нега',
          'Прецизно склапање',
          'Лична хигиена'
        ],
        colors: ["Крем","Проѕирна"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        colors: ["Крем","Проѕирна"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Без пудра",
        latexStatus: "Без латекс",
        siliconeStatus: "Без силикон",
        sterilityStatus: "Нон-стерилно",
        foodContactLabel: "Да / Соодветно",
        materialName: 'Кополимерен Полимер',
        faq: [
          {
                    "question": "Која е главната карактеристика на Slimfit Copolymer ракавиците?",
                    "answer": "Имаат ултра-тенка кополимерна структура што дава чувство на втора кожа и максимална чувствителност."
          },
          {
                    "question": "За кои намени се препорачуваат?",
                    "answer": "Идеални се за слаткарство, прецизна козметика и прецизно склапање."
          },
          {
                    "question": "Дали содржат латекс или пудра?",
                    "answer": "Не, тие се без пудра, без латекс и без силикон."
          },
          {
                    "question": "Кои се димензиите и боите?",
                    "answer": "Достапни во крем и проѕирна боја во S, M, L, XL. Кутија 190x100x60 mm, коли 400x320x210 mm."
          }
]
      },
      sr: {
        name: 'Reflex Slimfit Copolymer Rukavica',
        tagline: 'Tanka kopolimerna formulacija za maksimalnu osetljivost prstiju.',
        description: 'Reflex Slimfit Copolymer rukavice odlikuje izuzetno tanka struktura koja pruža osećaj druge kože. Namenjene su preciznim radovima, poslastičarstvu i estetskim tretmanima.',
        features: [
          'Izuzetno tanka za savršenu osetljivost dodira',
          'Kopolimerni sastav visoke elastičnosti',
          'Bez pudera, lateksa i silikona',
          'Slimfit kroj koji prianja uz prste',
          'Bezbedno u dodiru sa hranom',
          'Elegantna krem i providna boja'
        ],
        applications: [
          'Poslastičarstvo i aranžiranje hrane',
          'Kozmetika i estetski tretmani',
          'Precizna montaža i rukovanje',
          'Lična higijena'
        ],
        colors: ["Krem","Providna"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        colors: ["Krem","Providna"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Bez pudera",
        latexStatus: "Bez lateksa",
        siliconeStatus: "Bez silikona",
        sterilityStatus: "Non-sterilno",
        foodContactLabel: "Da / Bezbedno",
        materialName: 'Kopolimerni Polimer',
        faq: [
          {
                    "question": "Šta odlikuje Slimfit Copolymer rukavice?",
                    "answer": "Odlikuje ih izuzetno tanka kopolimerna struktura koja pruža osećaj druge kože i maksimalnu taktilnu osetljivost."
          },
          {
                    "question": "Za koje poslove su najbolje?",
                    "answer": "Idealne su za poslastičarstvo, estetske tretmane i preciznu montažu."
          },
          {
                    "question": "Da li sadrže puder ili lateks?",
                    "answer": "Ne, izrađene su bez pudera, lateksa i silikona."
          },
          {
                    "question": "Koje su dimenzije i boje?",
                    "answer": "Dostupne u krem i providnoj boji u S, M, L, XL. Kutija 190x100x60 mm, karton 400x320x210 mm."
          }
]
      },
      sq: {
        name: 'Doreza Reflex Slimfit Copolymer',
        tagline: 'Formulë e hollë kopolimerike për ndjeshmëri maksimale të gishtave.',
        description: 'Dorezat Reflex Slimfit Copolymer janë prodhuar me teknologji ultra të hollë kopolimerike që krijon ndjesinë e lëkurës së dytë. Ideale për punë precize, pastiçeri dhe kujdes estetik.',
        features: [
          'Trashësi ultra e hollë për ndjeshmëri maksimale',
          'Përzierje kopolimerike me elasticitet të lartë',
          'Pa pluhur, pa lateks dhe pa silikon',
          'Prerje ergonomike slimfit',
          'Certifikuar për kontakt me ushqimin',
          'Pamje elegante në ngjyrë krem dhe transparente'
        ],
        applications: [
          'Pastiçeri dhe prezantim ushqimesh',
          'Kujdes estetik dhe kozmetikë',
          'Montim i imët dhe punë precize',
          'Higjienë personale'
        ],
        colors: ["Krem","Transparente"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        colors: ["Krem","Transparente"],
        sizes: ["S","M","L","XL"],
        powderStatus: "Pa pluhur",
        latexStatus: "Pa lateks",
        siliconeStatus: "Pa silikon",
        sterilityStatus: "Jo-sterile",
        foodContactLabel: "Po / Plotësisht konform",
        materialName: 'Polimer Kopolimer',
        faq: [
          {
                    "question": "Cila është veçoria kryesore e dorezave Slimfit Copolymer?",
                    "answer": "Ato kanë strukturë ultra të hollë kopolimerike që krijon ndjesinë e lëkurës së dytë dhe ndjeshmëri maksimale."
          },
          {
                    "question": "Për cilat punë rekomandohen?",
                    "answer": "Ideale për pastiçeri, kujdes estetik dhe montim të imët."
          },
          {
                    "question": "A përmbajnë pluhur apo lateks?",
                    "answer": "Jo, janë pa pluhur, pa lateks dhe pa silikon."
          },
          {
                    "question": "Cilat janë përmasat dhe ngjyrat?",
                    "answer": "Të disponueshme në ngjyrë krem dhe transparente në S, M, L, XL. Kutia 190x100x60 mm, kartoni 400x320x210 mm."
          }
]
      }
    ,
      fa: {
        "name": "دستکش Slimfit Copolymer رفلکس",
        "tagline": "فرمولاسیون کوپلیمر نازک برای حداکثر حس لمس و راحتی اسلیم‌فیت.",
        "description": "دستکش Slimfit Copolymer رفلکس با فناوری کوپلیمر فوق نازک ساخته شده است تا حس پوست دوم را تداعی کند. عالی برای کارهای ظریف و تزئینات غذایی.",
        "features": [
                "ضخامت فوق نازک برای حداکثر حساسیت لمسی",
                "ترکیب کوپلیمر ویژه با کشسانی بالا",
                "بدون پودر، لاتکس و سیلیکون",
                "برش ارگونومیک اسلیم‌فیت چسبان",
                "دارای تاییدیه بهداشتی مواد غذایی",
                "ظاهر زیبا در رنگ‌های کرم و شفاف"
        ],
        "applications": [
                "قنادی و تزئین غذاهای گران‌قیمت",
                "مراقبت‌های پوستی و زیبایی دقیق",
                "مونتاژ قطعات ظریف",
                "بهداشت شخصی"
        ],
        colors: ["کرم","شفاف"],
        sizes: ["S","M","L","XL"],
        powderStatus: "بدون پودر",
        latexStatus: "بدون لاتکس",
        siliconeStatus: "بدون سیلیکون",
        sterilityStatus: "غیر استریل",
        foodContactLabel: "بله / کاملاً مناسب",
        "materialName": "پلیمر کوپلیمر"
},
    }
  }
];

export function getReflexProductBySlug(slug: string): ReflexProduct | undefined {
  return reflexProducts.find(p => p.slug === slug);
}
