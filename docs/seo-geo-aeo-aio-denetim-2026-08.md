# Teyfik Gökdemir Web Sitesi
## SEO · GEO · AEO · AIO Denetimi ve Premium İyileştirme Raporu

**Denetim tarihi:** 13 Ağustos 2026  
**İncelenen alan adı:** [teyfikgokdemir.com](https://teyfikgokdemir.com/)  
**Kaynak depo:** [teyfikgokdemir/teyfikgokdemir](https://github.com/teyfikgokdemir/teyfikgokdemir)

## Yönetici özeti

Site, temel teknik SEO açısından zayıf bir başlangıç noktası değil; tersine canonical, çok dilli URL yapısı, `hreflang`, JSON-LD, sitemap, robots, sosyal paylaşım etiketleri, erişilebilirlik için skip-link, görsel `alt` metinleri, lazy loading ve güvenlik başlıkları zaten kurulmuş durumda. Yerleşik üretim denetimi 136 sayfa, 135 indekslenebilir URL ve 155 kalıcı yönlendirme buldu; canonical, hreflang, şema, sitemap, robots, yönlendirmeler ve iç bağlantılar için uyarı üretmedi.

En önemli canlı teknik problem, `www.teyfikgokdemir.com/` adresinin kök sayfada 200 döndürerek non-`www` adresle aynı içeriği sunmasıydı. Bu, canonical etiketi doğru olsa bile host seviyesinde yinelenen erişim ve sinyal bölünmesi riski oluşturuyordu. Cloudflare zone dynamic redirect ruleset’i güncellendi; `www` ana sayfası ve `www` alt yolları artık query string’i koruyarak `https://teyfikgokdemir.com/...` adresine 301 yönleniyor. Canonical kök 200, `/tr/` ise 301 ile `/` olarak doğrulandı.

Premium yükseltmede amaç, hazır şablon veya yapay zekâ üretimi izlenimi oluşturan gösterişli katmanlar eklemek değil; mevcut kişisel marka ve ticari platform yapısını daha rafine, daha okunabilir ve daha karar-verdirici hale getirmekti. Bu nedenle görsel dil korunarak hero altına editoryal konumlandırma şeridi, ana sayfaya görünür ve çok dilli ticari soru-cevap bölümü, buna karşılık gelen FAQPage şeması ve güvenli WebPage şema birleşimi eklendi.

## Durum puanlaması

Aşağıdaki puanlar üçüncü taraf bir skor aracının sonucu değildir; kaynak kodu, üretim çıktısı, canlı HTTP yanıtları ve kullanıcı deneyimi incelemesine dayalı profesyonel durum değerlendirmesidir.

| Alan | Uygulama öncesi durum | Güncel değerlendirme | Öncelik |
|---|---|---|---|
| Teknik SEO | Güçlü; canonical, sitemap, robots, hreflang ve güvenlik başlıkları mevcut | Güçlü; `www` host canonical problemi canlıda giderildi | Tamamlandı |
| On-page SEO | Değer önerisi ve uzmanlık alanları açık; bazı bölümler uzun akış içinde geç bulunuyor | Hero hiyerarşisi korunarak konumlandırma şeridi ve daha net soru-cevap sinyali eklendi | Yüksek |
| GEO | Kişi, CTSEG ve girişimler JSON-LD ile ilişkilendirilmiş; görünür kanıt ve konu kümeleri geliştirilebilir | Entity consistency ve cevaplanabilir içerik güçlendirildi; kanıt-temelli içerik yol haritası gerekli | Orta-yüksek |
| AEO | Blog yazılarında FAQ verisi vardı; ana kurucu sayfasında görünür ticari SSS yoktu | 7 ana dil varyantında görünür SSS + eşleşen FAQPage JSON-LD mevcut | Tamamlandı |
| AIO | `llms.txt` ve okunabilir metin güçlü; Google tarafında özel AI işaretlemesi gerekmiyor | AI görünürlüğü için temel SEO, kaynaklı içerik, net entity dili ve ölçüm altyapısı önceliklendirildi | Sürekli |
| UX ve premium algı | Güçlü portre, renk ve tipografi; uzun sayfa akışı ve orta genişliklerde yoğunlaşma riski var | Editoryal bilgi şeridi, sakin FAQ akışı, reduced-motion uyumu ve daha net karar katmanı eklendi | Büyük ölçüde tamamlandı |
| Performans | Görsellerde responsive/lazy yaklaşım mevcut; gerçek CWV ölçümü alınamadı | Derleme ve asset düzeni temiz; Search Console/CrUX verisiyle saha ölçümü bekliyor | Orta |

## Uygulanan değişiklikler

`src/components/FounderPage.astro` içinde hero sonuna, beş temel çalışma odağını numaralı ve yatay bir editoryal şerit olarak taşıyan yeni bir bölüm eklendi. Bu bölüm, mevcut konumlandırma dilini tekrar ederken görsel ritmi kuvvetlendiriyor; yeni bir slogan yığını veya yapay bir istatistik üretmiyor. Dar ekranlarda iki ve üç sütunlu kırılımlara iner, metin taşmasını önler ve `prefers-reduced-motion` tercihine saygı gösterir.

Aynı bileşene, ziyaretçilerin karar vermeden önce sorduğu dört soruyu yanıtlayan `common-questions` bölümü eklendi. İçerik Türkçe, İngilizce, Rusça, Makedonca, Sırpça, Arnavutça ve Farsça olarak `src/data/homeFaq.ts` içinde merkezi hale getirildi. Sorular; çalışma yöntemini, kişisel site ile CTSEG ayrımını, uygun ticari fırsatları ve ilk görüşmede gerekli bilgileri açıklıyor. Böylece içerik hem kullanıcı için okunabilir hem de cevap motorlarının alıntılayabileceği net bir paragraf yapısına sahip.

Ana sayfa rotaları görünür SSS içeriğini `FAQPage` JSON-LD ile eşleştiriyor. `BaseLayout.astro` içinde page-specific şema eklendiğinde `WebPage` düğümünün kaybolması engellendi; böylece FAQ, BlogPosting veya başka bir özel şema ile WebPage bağlamı birlikte korunuyor. Google’ın resmî rehberine göre yapılandırılmış veri, sayfada kullanıcıya sunulan içerikle uyumlu olmalı; uygulama bu ilkeye göre görünür SSS ile birebir eşleştirildi [2].

Yeni `npm run verify:premium` komutu, yedi ana dil sayfasının birer `h1` taşımasını, canonical ve `lang` değerlerini, konumlandırma şeridini, görünür SSS’yi, `FAQPage` ve `WebPage` düğümlerini doğruluyor. Üretim derlemesi, SEO denetimi, bu yeni kontrol ve `git diff --check` son kontrolde başarıyla tamamlandı.

Cloudflare tarafında mevcut disabled `Canonical root to Turkish` kuralı korunarak, etkin `Canonical HTTPS non-www` kuralının ifadesi kök yolu da kapsayacak şekilde güncellendi. Son canlı kontrollerde `https://www.teyfikgokdemir.com/` 301 ile `https://teyfikgokdemir.com/` adresine, `https://www.teyfikgokdemir.com/en/?source=canonical-test` ise query string korunarak `https://teyfikgokdemir.com/en/?source=canonical-test` adresine yönlendi.

## SEO/GEO/AEO/AIO için hâlâ gerekenler

Teknik temel artık güçlü olsa da arama görünürlüğü yalnızca etiket ve şemadan oluşmaz. Google, AI Overviews ve AI Mode için ayrı bir işaretleme veya özel teknik gereksinim olmadığını; mevcut teknik SEO, taranabilirlik, iç bağlantılar, iyi sayfa deneyimi, metinsel içerik ve görünür içerikle uyumlu yapılandırılmış verinin esas olduğunu belirtiyor [3]. Bu nedenle `llms.txt` yardımcı bir makine-okunabilir kaynak olarak korunabilir ancak tek başına sıralama veya AI alıntısı sağlamaz.

GEO açısından bir sonraki seviye, Teyfik Gökdemir ve CTSEG kimliğini farklı yüzeylerde aynı ifadelerle ve doğrulanabilir kaynaklarla güçlendirmektir. LinkedIn, GitHub, girişim siteleri, CTSEG hizmet sayfaları ve ürün üreticisi kaynaklarında isim, rol, şirket ilişkisi, lokasyon ve uzmanlık ifadeleri tutarlı kalmalıdır. Gerçek müşteri sonucu, ciro, hacim, sertifika veya başarı metriği paylaşılacaksa bunlar kullanıcı tarafından sağlanan birincil kanıtla desteklenmeli; mevcut sitede bulunmayan iddialar üretilmemelidir.

AEO için ana sayfa SSS’si tamamlandı; fakat büyümenin devamı için her hizmet ve ürün kümesinin kendi karar sorularını yanıtlayan, kaynaklı ve güncel içeriklere ihtiyacı var. Özellikle stratejik tedarik, tedarikçi doğrulama, RFQ, İran halısı, toptan tekstil, private label ve REFLEX B2B portföyü ayrı içerik kümeleri olarak birbirine bağlanmalı. Her makalede net başlıklar, kısa doğrudan cevaplar, karşılaştırma tabloları, güncelleme tarihi, yazar kimliği, birincil kaynaklar ve ilgili hizmet sayfasına bağlanan bir sonraki adım bulunmalı.

Bing’in Şubat 2026’da duyurduğu AI Performance görünümü, hangi URL’lerin Copilot ve Bing’in AI özetlerinde kaynak olarak gösterildiğini, grounding sorgularını ve sayfa düzeyinde alıntı aktivitesini ölçmeye başlıyor [4]. Bu nedenle Bing Webmaster Tools mülkü doğrulanmalı; Google Search Console ve Bing verileri aylık olarak sorgu, gösterim, tıklama, indeksleme, alıntı alan URL ve dönüşüm bazında izlenmelidir. Bu oturumda Search Console mülküne doğrulanmış erişim bulunmadığı için gerçek sorgu ve CWV verisi rapora eklenemedi.

## Önerilen 90 günlük büyüme sırası

| Dönem | Öncelikli iş | Beklenen çıktı |
|---|---|---|
| İlk 2 hafta | Google Search Console ve Bing Webmaster Tools doğrulaması; sitemap gönderimi; Core Web Vitals ve indeksleme hatalarının kaydı | Gerçek saha verisiyle baseline |
| 3–4. hafta | Tedarikçi doğrulama, RFQ, uluslararası ticaret ve B2B ürün seçimi için dört uzmanlık sayfası | Daha net konu kümeleri ve iç bağlantı ağı |
| 5–8. hafta | Her ana konuda kaynaklı, birinci el deneyimi açıklayan iki makale; güncelleme ve yazar bilgisi | GEO/AEO için alıntılanabilir özgün içerik |
| 9–12. hafta | Ürün ve hizmet sayfalarında FAQ, karşılaştırma, belge/kaynak bağlantıları ve ölçülebilir CTA’lar | Daha iyi karar desteği ve dönüşüm ölçümü |

Bu planın en önemli ilkesi, “AI için yazılmış” görünen metinler üretmemektir. İçerik, gerçek ticari kararların nasıl alındığını; hangi bilgilerin doğrulandığını, hangi risklerin değerlendirildiğini ve hangi koşullarda CTSEG’e geçildiğini açıkça anlatmalıdır. Bu yaklaşım hem insanlar için daha güvenilir hem de arama sistemleri için daha ayırt edici bir birinci el kaynak üretir.

## References

[1]: https://developers.google.com/search/docs/specialty/international/localized-versions "Google Search Central — Tell Google about localized versions of your page"

[2]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data "Google Search Central — Introduction to structured data markup in Google Search"

[3]: https://developers.google.com/search/docs/appearance/ai-features "Google Search Central — AI features and your website"

[4]: https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview "Bing Webmaster Blog — Introducing AI Performance in Bing Webmaster Tools Public Preview"
