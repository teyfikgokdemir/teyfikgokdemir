import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
let source = await readFile(path, 'utf8');

const legacyAnalytics = `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52GXBGWHFJ"></script>
    <script is:inline>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-52GXBGWHFJ');
    </script>
`;
if (source.includes(legacyAnalytics)) source = source.replace(legacyAnalytics, '');

const alternateNeedle = 'const alternateLinks = alternates ?? defaultAlternates;';
const alternateReplacement = 'const alternateLinks = alternates ?? (pathname ? {} : defaultAlternates);';
if (source.includes(alternateNeedle)) source = source.replace(alternateNeedle, alternateReplacement);

const studioNeedle = `      url: site.links.qctStudio,\n      founder: { '@id': site.origin + '/#person' },`;
const studioReplacement = `      url: site.links.qctStudio,\n      foundingDate: '2025',\n      founder: { '@id': site.origin + '/#person' },`;
if (source.includes(studioNeedle)) source = source.replace(studioNeedle, studioReplacement);
const commerceNeedle = `      url: site.links.qctCommerce,\n      founder: { '@id': site.origin + '/#person' },`;
const commerceReplacement = `      url: site.links.qctCommerce,\n      foundingDate: '2025',\n      founder: { '@id': site.origin + '/#person' },`;
if (source.includes(commerceNeedle)) source = source.replace(commerceNeedle, commerceReplacement);

const consent = `
    <aside class="cookie-consent" data-cookie-consent hidden aria-label="Cookie preferences">
      <div><strong data-cookie-title>Çerez tercihleri</strong><p data-cookie-copy>Analitik çerezleri yalnızca izninizle kullanıyoruz. Zorunlu çerezler her zaman aktiftir.</p></div>
      <div class="cookie-consent__actions"><button type="button" data-cookie-reject>Reddet</button><button type="button" data-cookie-accept>Kabul et</button></div>
    </aside>
    <button class="cookie-settings" type="button" data-cookie-settings aria-label="Çerez tercihlerini aç">Çerezler</button>
    <script is:inline>
      (() => {
        const key='tg-consent-v1';
        const box=document.querySelector('[data-cookie-consent]');
        const settings=document.querySelector('[data-cookie-settings]');
        const dict={tr:['Çerez tercihleri','Analitik çerezleri yalnızca izninizle kullanıyoruz. Zorunlu çerezler her zaman aktiftir.','Reddet','Kabul et','Çerezler'],en:['Cookie preferences','We use analytics cookies only with your permission. Essential cookies are always active.','Reject','Accept','Cookies'],fa:['تنظیمات کوکی','کوکی‌های تحلیلی فقط با اجازه شما استفاده می‌شوند. کوکی‌های ضروری همیشه فعال هستند.','رد','پذیرش','کوکی‌ها'],mk:['Поставки за колачиња','Аналитички колачиња користиме само со ваша дозвола. Неопходните се секогаш активни.','Одбиј','Прифати','Колачиња'],sr:['Podešavanja kolačića','Analitičke kolačiće koristimo samo uz vašu dozvolu. Neophodni su uvek aktivni.','Odbij','Prihvati','Kolačići'],sq:['Preferencat e kukive','Kukit analitike përdoren vetëm me lejen tuaj. Kukit e domosdoshme janë gjithmonë aktive.','Refuzo','Prano','Kukit']};
        const t=dict[document.documentElement.lang]||dict.en;
        box.querySelector('[data-cookie-title]').textContent=t[0];box.querySelector('[data-cookie-copy]').textContent=t[1];box.querySelector('[data-cookie-reject]').textContent=t[2];box.querySelector('[data-cookie-accept]').textContent=t[3];settings.textContent=t[4];
        const loadAnalytics=()=>{if(window.__tgAnalyticsLoaded)return;window.__tgAnalyticsLoaded=true;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-52GXBGWHFJ',{anonymize_ip:true});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-52GXBGWHFJ';document.head.appendChild(s)};
        const apply=(v)=>{localStorage.setItem(key,v);box.hidden=true;if(v==='accepted')loadAnalytics()};
        const saved=localStorage.getItem(key);if(saved==='accepted')loadAnalytics();else if(!saved)box.hidden=false;
        box.querySelector('[data-cookie-accept]').addEventListener('click',()=>apply('accepted'));box.querySelector('[data-cookie-reject]').addEventListener('click',()=>apply('rejected'));settings.addEventListener('click',()=>box.hidden=false);
      })();
    </script>
    <style is:global>
      .cookie-consent{position:fixed;z-index:9999;left:1rem;right:1rem;bottom:1rem;max-width:980px;margin:auto;padding:1rem 1.1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;border:1px solid #3a506b;border-radius:16px;background:rgba(7,13,22,.97);color:#f4f1e9;box-shadow:0 20px 60px rgba(0,0,0,.45)}.cookie-consent[hidden]{display:none}.cookie-consent p{margin:.25rem 0;color:#aab7c9;font-size:.9rem}.cookie-consent__actions{display:flex;gap:.6rem;flex:0 0 auto}.cookie-consent button,.cookie-settings{min-height:44px;padding:.65rem 1rem;border:1px solid #3a506b;border-radius:999px;background:#101c2b;color:#f4f1e9;font-weight:800;cursor:pointer}.cookie-consent [data-cookie-accept]{background:#f2aa8f;color:#09111d;border-color:#f2aa8f}.cookie-settings{position:fixed;z-index:9998;right:1rem;bottom:1rem;font-size:.75rem;opacity:.8}@media(max-width:700px){.cookie-consent{align-items:stretch;flex-direction:column}.cookie-consent__actions{width:100%}.cookie-consent__actions button{flex:1}}
    </style>`;
if (!source.includes('data-cookie-consent')) source = source.replace('  </body>', `${consent}\n  </body>`);

await writeFile(path, source, 'utf8');
console.log('Applied cookie consent, consent-first analytics, hreflang and founding-date fixes.');
