export const locales = ['id', 'en', 'zh'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'id'
