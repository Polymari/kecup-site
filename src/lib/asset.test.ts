import { describe, expect, it } from 'vitest'
import { asset, joinBase, routerBasename } from './asset'

describe('joinBase', () => {
  it('joins a root base', () => {
    expect(joinBase('/', 'brand/logo.jpeg')).toBe('/brand/logo.jpeg')
  })

  it('joins a sub-path base', () => {
    expect(joinBase('/kecup_site/', 'brand/logo.jpeg')).toBe('/kecup_site/brand/logo.jpeg')
  })

  it('adds a missing trailing slash to the base', () => {
    expect(joinBase('/kecup_site', 'brand/logo.jpeg')).toBe('/kecup_site/brand/logo.jpeg')
  })

  it('strips leading slashes from the asset path', () => {
    expect(joinBase('/kecup_site/', '/brand/logo.jpeg')).toBe('/kecup_site/brand/logo.jpeg')
  })
})

describe('routerBasename', () => {
  it('returns / for a root base', () => {
    expect(routerBasename('/')).toBe('/')
  })

  it('trims trailing slashes for sub-path bases', () => {
    expect(routerBasename('/kecup_site/')).toBe('/kecup_site')
    expect(routerBasename('/kecup_site')).toBe('/kecup_site')
  })
})

describe('asset', () => {
  it('resolves against the app base URL', () => {
    expect(asset('brand/logo.jpeg')).toBe('/brand/logo.jpeg')
  })
})
