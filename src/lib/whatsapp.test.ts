import { describe, expect, it } from 'vitest'
import {
  buildFranchiseMessage,
  buildMailto,
  buildOrderMessage,
  buildWhatsAppLink,
  orderCode,
  sanitizePhone,
} from './whatsapp'

describe('sanitizePhone', () => {
  it('converts local 0-prefixed numbers to 62', () => {
    expect(sanitizePhone('0812-3456-7890')).toBe('6281234567890')
  })

  it('converts 8-prefixed numbers to 62', () => {
    expect(sanitizePhone('81234567890')).toBe('6281234567890')
  })

  it('keeps existing 62 numbers and strips separators', () => {
    expect(sanitizePhone('+62 812-3456-7890')).toBe('6281234567890')
    expect(sanitizePhone('62 812 3456 7890')).toBe('6281234567890')
  })
})

describe('orderCode', () => {
  it('produces KC-XXXX codes', () => {
    for (let i = 0; i < 20; i++) {
      expect(orderCode()).toMatch(/^KC-[0-9A-F]{4}$/)
    }
  })
})

describe('buildOrderMessage', () => {
  const base = {
    outletName: 'BINUS Anggrek',
    lines: [
      { qty: 1, name: 'Bolognese Craving Cup', drinkName: 'Cloudy Tea', lineTotal: 35000 },
      { qty: 2, name: 'Golden Cheese Nachos', lineTotal: 34000 },
    ],
    total: 69000,
    pickupTime: '12:30',
    customerName: 'Tari',
    notes: 'Less ice',
    code: 'KC-7F3A',
  }

  it('builds the English message', () => {
    const message = buildOrderMessage({ ...base, locale: 'en' })
    expect(message).toContain("Hi KeCup BINUS Anggrek! 🧋🧀 I'd like to order:")
    expect(message).toContain('• 1× Bolognese Craving Cup (Cloudy Tea) — Rp 35.000')
    expect(message).toContain('• 2× Golden Cheese Nachos — Rp 34.000')
    expect(message).toContain('Total: Rp 69.000')
    expect(message).toContain('Pickup: 12:30')
    expect(message).toContain('Name: Tari')
    expect(message).toContain('Notes: Less ice')
    expect(message).toContain('Order code: KC-7F3A')
    expect(message).toContain('(sent from the KeCup website)')
  })

  it('builds the Indonesian message', () => {
    const message = buildOrderMessage({ ...base, locale: 'id', notes: undefined })
    expect(message).toContain('Halo KeCup BINUS Anggrek! 🧋🧀 Mau pesan:')
    expect(message).toContain('Ambil: 12:30')
    expect(message).toContain('Catatan: -')
    expect(message).toContain('Kode pesanan: KC-7F3A')
    expect(message).toContain('(dikirim dari website KeCup)')
  })
})

describe('buildWhatsAppLink', () => {
  it('sanitizes the phone and URL-encodes the message', () => {
    const message = buildOrderMessage({
      outletName: 'BINUS Anggrek',
      lines: [{ qty: 1, name: 'Cloudy Tea', lineTotal: 17000 }],
      total: 17000,
      pickupTime: 'ASAP',
      customerName: 'Tari',
      code: 'KC-0001',
      locale: 'en',
    })
    const link = buildWhatsAppLink('0812-3456-7890', message)
    expect(link.startsWith('https://wa.me/6281234567890?text=')).toBe(true)
    const encoded = link.split('?text=')[1]
    expect(decodeURIComponent(encoded)).toBe(message)
    expect(encoded).not.toMatch(/[ \n]/)
  })
})

describe('buildFranchiseMessage / buildMailto', () => {
  it('builds a locale-aware franchise message', () => {
    const message = buildFranchiseMessage({
      name: 'Tari',
      city: 'Jakarta',
      budget: 'Rp 20.000.000',
      packageLabel: 'Regular',
      message: 'Ready to start',
      locale: 'en',
    })
    expect(message).toContain('franchise partner')
    expect(message).toContain('Package: Regular')
  })

  it('builds a mailto link', () => {
    const link = buildMailto('partner@example.com', 'Franchise: Regular', 'Hello there')
    expect(link).toBe(
      'mailto:partner@example.com?subject=Franchise%3A%20Regular&body=Hello%20there',
    )
  })
})
