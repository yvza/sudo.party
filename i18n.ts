import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale, type Locale } from './lib/i18n-config'

// Re-export for convenience
export { locales, defaultLocale, type Locale } from './lib/i18n-config'

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request (set by middleware)
  let locale = await requestLocale

  // Fallback to default locale if not set or invalid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
