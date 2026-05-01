/**
 * Locale wiring.
 *
 * - `useLocale()` exposes the user's preference (`'system' | 'en' | 'nl'`)
 *   and the resolved locale we actually use for rendering.
 * - `<LocaleProvider>` syncs `i18next.changeLanguage` with the resolved
 *   locale and re-mounts its children whenever the locale changes, so
 *   every `S.*` access in the tree picks up the new translations without
 *   per-component subscriptions.
 *
 * Source-of-truth order: `AppSettings.locale` (manual choice) > navigator
 * (only when the manual choice is `'system'`). i18next's own detector is
 * intentionally not used — we drive `changeLanguage` directly.
 */
import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import i18n, { detectNavigatorLocale, type SupportedLocale } from '@/lib/i18n';
import { getSettings, subscribeSettings, updateSettings } from '@/lib/storage';
import type { AppSettings } from '@/types';

type LocalePreference = AppSettings['locale'];

function resolveLocale(pref: LocalePreference): SupportedLocale {
  return pref === 'system' ? detectNavigatorLocale() : pref;
}

export function useLocale(): {
  locale: LocalePreference;
  resolvedLocale: SupportedLocale;
  setLocale: (next: LocalePreference) => void;
} {
  const [locale, setLocaleState] = useState<LocalePreference>(
    () => getSettings().locale,
  );

  useEffect(() => {
    return subscribeSettings(() => {
      setLocaleState(getSettings().locale);
    });
  }, []);

  const setLocale = useCallback((next: LocalePreference) => {
    updateSettings({ locale: next });
  }, []);

  return { locale, resolvedLocale: resolveLocale(locale), setLocale };
}

/**
 * Push the resolved locale into i18next and re-mount children on change.
 *
 * The `key` on the wrapping fragment-equivalent forces React to remount
 * the subtree, which is what makes the getter-based `S` accessor reflect
 * the new strings everywhere without `useTranslation()` subscriptions.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { resolvedLocale } = useLocale();

  useEffect(() => {
    if (i18n.language !== resolvedLocale) {
      void i18n.changeLanguage(resolvedLocale);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = resolvedLocale;
    }
  }, [resolvedLocale]);

  // Keying a Fragment forces a full remount of children whenever the
  // locale flips. Cheap (rare action) and avoids touching every call site.
  return <Fragment key={resolvedLocale}>{children}</Fragment>;
}
