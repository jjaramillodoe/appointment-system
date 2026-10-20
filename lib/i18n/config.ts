export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Pick a supported locale from an Accept-Language header (e.g. "es-US,es;q=0.9,en;q=0.8"). */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  for (const part of (header || '').split(',')) {
    const base = part.split(';')[0].trim().toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Replace {name} placeholders: fmt('Hi {name}', { name: 'Ana' }) */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}
