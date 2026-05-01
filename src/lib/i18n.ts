/**
 * i18next initialization. Imported once from `main.tsx`.
 *
 * Wires English + Dutch resources, no language detector — locale selection
 * lives in `AppSettings.locale` and is applied via `useLocale`. When that hook
 * resolves `'system'`, it derives the language from `navigator.language`
 * itself, so we keep a single source of truth.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '@/locales/en';
import { nl } from '@/locales/nl';

export type SupportedLocale = 'en' | 'nl';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'nl'] as const;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    nl: { translation: nl },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  pluralSeparator: '_',
});

export default i18n;

/**
 * Resolve a locale tag (e.g. `nl-NL`, `en-US`) to one of our supported
 * locales, falling back to English when there's no match.
 */
export function resolveSupportedLocale(tag: string | undefined): SupportedLocale {
  if (!tag) return 'en';
  const lower = tag.toLowerCase();
  for (const locale of SUPPORTED_LOCALES) {
    if (lower === locale || lower.startsWith(`${locale}-`)) return locale;
  }
  return 'en';
}

/**
 * Detect the supported locale that best matches the navigator's language list.
 * Used when `AppSettings.locale === 'system'`.
 */
export function detectNavigatorLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'en';
  const candidates: string[] = [];
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  if (navigator.language) candidates.push(navigator.language);
  for (const tag of candidates) {
    const lower = tag.toLowerCase();
    for (const locale of SUPPORTED_LOCALES) {
      if (lower === locale || lower.startsWith(`${locale}-`)) return locale;
    }
  }
  return 'en';
}
