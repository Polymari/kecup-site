// Tests are hermetic: never pick up real Supabase credentials from .env.local.
import.meta.env.VITE_SUPABASE_URL = ''
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = ''
import.meta.env.VITE_DEMO_LOGIN_EMAIL = ''
import.meta.env.VITE_DEMO_LOGIN_PASSWORD = ''

import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from './src/i18n'

void i18n.changeLanguage('en')

afterEach(() => {
  cleanup()
})

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof window.IntersectionObserver
window.ResizeObserver = MockResizeObserver as unknown as typeof window.ResizeObserver

// Tests run with prefers-reduced-motion so animation code paths skip.
window.matchMedia = ((query: string): MediaQueryList =>
  ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia

// jsdom's window.scrollTo exists but only logs "not implemented" noise.
window.scrollTo = (() => {}) as unknown as typeof window.scrollTo
