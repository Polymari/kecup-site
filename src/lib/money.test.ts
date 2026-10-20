import { describe, expect, it } from 'vitest'
import { formatCompact, formatK, formatRupiah, formatRupiahExact } from './money'

describe('formatRupiah', () => {
  it('formats integer rupiah with dot grouping', () => {
    expect(formatRupiah(25000)).toBe('Rp 25.000')
    expect(formatRupiah(7000)).toBe('Rp 7.000')
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000')
  })

  it('never emits non-breaking spaces', () => {
    const output = formatRupiah(1234567)
    expect(output).not.toMatch(/[\u00a0\u202f]/)
  })

  it('rounds to whole rupiah', () => {
    expect(formatRupiah(25499.6)).toBe('Rp 25.500')
    expect(formatRupiah(10350)).toBe('Rp 10.350')
  })
})

describe('formatRupiahExact', () => {
  it('keeps decimals for cost figures', () => {
    expect(formatRupiahExact(2908.333)).toBe('Rp 2.908,33')
    expect(formatRupiahExact(240)).toBe('Rp 240')
  })
})

describe('formatCompact', () => {
  it('uses Indonesian short scale for chart axes', () => {
    expect(formatCompact(700000)).toBe('700\u00a0rb')
    expect(formatCompact(1400000)).toBe('1,4\u00a0jt')
    expect(formatCompact(2800000)).toBe('2,8\u00a0jt')
    expect(formatCompact(0)).toBe('0')
  })
})

describe('formatK', () => {
  it('formats whole thousands with k', () => {
    expect(formatK(25000)).toBe('25k')
    expect(formatK(42000)).toBe('42k')
    expect(formatK(7000)).toBe('7k')
  })

  it('formats fractional thousands with one decimal', () => {
    expect(formatK(4840)).toBe('4,8k')
  })
})
