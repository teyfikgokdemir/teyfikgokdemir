export const locales = ['tr', 'en', 'mk', 'sr', 'sq', 'fa'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  mk: 'Македонски',
  sr: 'Srpski',
  sq: 'Shqip',
  fa: 'فارسی',
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
