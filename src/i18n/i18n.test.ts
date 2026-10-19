import { describe, expect, it } from 'vitest'
import en from './en.json'
import id from './id.json'
import i18n, { detectLanguage, setLanguage } from './index'

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('i18n dictionaries', () => {
  it('have identical key sets (EN/ID parity)', () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(id).sort())
  })

  it('never contain empty values', () => {
    const check = (dict: unknown, path = ''): void => {
      if (typeof dict === 'string') {
        expect(dict.trim(), path).not.toBe('')
        return
      }
      for (const [key, child] of Object.entries(dict as Record<string, unknown>)) {
        check(child, path ? `${path}.${key}` : key)
      }
    }
    check(en)
    check(id)
  })

  it('interpolates variables with double braces', () => {
    expect(i18n.t('build.saved', { amount: '7.000' })).toBe('You saved Rp 7.000')
    expect(i18n.t('franchise.calculator.months', { n: 3.7 })).toBe('3.7 months')
    expect(en.build.saved).toContain('{{amount}}')
    expect(id.build.saved).toContain('{{amount}}')
  })

  it('keeps brand and menu names untranslated', () => {
    for (const key of ['nachosBolo', 'nachosMush', 'nachosCheese', 'teaCloudy', 'teaFizzy', 'comboBolo', 'comboMush', 'comboCheese']) {
      expect(en.menu.items[key as keyof typeof en.menu.items].name).toBe(
        id.menu.items[key as keyof typeof id.menu.items].name,
      )
    }
    expect(en.hero.tagline).toBe(id.hero.tagline)
    expect(en.combo.title).not.toBe(id.combo.title)
  })
})

describe('language detection & switching', () => {
  it('detects from localStorage first', () => {
    localStorage.setItem('kecup.lang', 'id')
    expect(detectLanguage()).toBe('id')
    localStorage.setItem('kecup.lang', 'en')
    expect(detectLanguage()).toBe('en')
  })

  it('falls back to the browser locale', () => {
    localStorage.removeItem('kecup.lang')
    expect(['en', 'id']).toContain(detectLanguage())
  })

  it('persists the chosen language and updates the html lang', () => {
    setLanguage('id')
    expect(localStorage.getItem('kecup.lang')).toBe('id')
    expect(document.documentElement.lang).toBe('id')
    setLanguage('en')
    expect(localStorage.getItem('kecup.lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
