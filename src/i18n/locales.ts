export const locales = ['tr', 'en', 'ru', 'fa', 'mk', 'sr', 'sq', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
  fa: 'فارسی',
  mk: 'Македонски',
  sr: 'Srpski',
  sq: 'Shqip',
  zh: '中文',
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
