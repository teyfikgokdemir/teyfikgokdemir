import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/pages/fa/index.astro', import.meta.url);
let source = await readFile(path, 'utf8');

const mythborn = "  { name: 'Mythborn', region: 'برند فعال و مستقل · بین‌المللی', href: 'https://mythborn.co/', text: 'یک برند مستقل و چندزبانه برای تجربه‌های تاروت، کاتینا، طالع‌بینی و خودشناسی در یک پلتفرم دیجیتال.' },";
const ctseg = "  { name: 'CTSEG', region: 'تأمین و تجارت', href: 'https://ctseg.com.tr', text: 'ساختار تخصصی برای تأمین راهبردی، پژوهش و اعتبارسنجی تأمین‌کننده، RFQ، مذاکره تجاری و هماهنگی تجارت بین‌المللی.' },";
if (!source.includes("name: 'CTSEG'")) {
  source = source.replace(mythborn, `${mythborn}\n${ctseg}`);
}

const navNeedle = '<nav aria-label="ناوبری اصلی"><a href="#focus">حوزه‌های فعالیت</a><a href="#ventures">کسب‌وکارها</a><a href="#contact">تماس</a></nav>';
const navReplacement = '<nav aria-label="ناوبری اصلی"><a href="#focus">حوزه‌های فعالیت</a><a href="#ventures">کسب‌وکارها</a><a href="/fa/مشاهده-پذیری-در-جستجوی-هوش-مصنوعی/">دیده‌شدن در AI</a><a href="#contact">تماس</a></nav>';
if (source.includes(navNeedle)) source = source.replace(navNeedle, navReplacement);

const stylePatch = `.ventures{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:980px){.ventures{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.ventures{grid-template-columns:1fr}}`;
if (!source.includes('repeat(4,minmax(0,1fr))')) {
  source = source.replace('</style>', `${stylePatch}\n</style>`);
}

await writeFile(path, source, 'utf8');
console.log('Added CTSEG and Persian AI visibility navigation to the Persian homepage.');
