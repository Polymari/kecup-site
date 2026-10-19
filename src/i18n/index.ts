import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import id from './id.json'

export const LANGUAGES = ['en', 'id'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'kecup.lang'

export function detectLanguage(): Language {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'id') return stored
  } catch {
    // storage unavailable — fall through to locale detection
  }
  const nav = globalThis.navigator?.language ?? 'en'
  return nav.toLowerCase().startsWith('id') ? 'id' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, language)
  } catch {
    // storage unavailable — language just won't persist
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language.startsWith('id') ? 'id' : 'en'
}

export default i18n
