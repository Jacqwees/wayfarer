/**
 * SquadStay i18n
 *
 * Usage (client component):
 *   import { useT } from '@/lib/i18n'
 *   const t = useT()
 *   <h1>{t.dashboard.tiles.flights}</h1>
 *
 * Usage (server component / action):
 *   import { getT } from '@/lib/i18n'
 *   const t = getT()  // defaults to 'en'
 *
 * Adding a language:
 *   1. Create lib/i18n/fr.ts — export `const fr: Translation = { ... }`
 *   2. Add 'fr' to the `Locale` union and the `locales` map below.
 *   3. Pass locale from a cookie/header wherever getT() / useT() is called.
 */

import { useMemo } from 'react'
import { en } from './en'

export type { Translation } from './en'
export type Locale = 'en' // | 'fr' | 'es' | 'de' — add here as languages ship

export type { } // ensure this is treated as a module

const locales: Record<Locale, typeof en> = {
  en,
  // fr, es, de, ... — add imported locales here
}

/** Server-safe translation getter. Defaults to 'en'. */
export function getT(locale: Locale = 'en'): typeof en {
  return locales[locale] ?? locales.en
}

/** React hook for client components. Re-memoises only when locale changes. */
export function useT(locale: Locale = 'en'): typeof en {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getT(locale), [locale])
}
