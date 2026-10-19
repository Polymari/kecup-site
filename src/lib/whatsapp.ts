export function sanitizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) digits = `62${digits}`
  return digits
}

export function orderCode(): string {
  const bytes = new Uint8Array(2)
  globalThis.crypto.getRandomValues(bytes)
  const hex = ((bytes[0] << 8) | bytes[1]).toString(16).toUpperCase().padStart(4, '0')
  return `KC-${hex}`
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`
}

export interface OrderMessageLine {
  qty: number
  name: string
  drinkName?: string
  lineTotal: number
}

export interface OrderMessageInput {
  outletName: string
  lines: OrderMessageLine[]
  total: number
  pickupTime: string
  customerName: string
  notes?: string
  code: string
  locale: 'en' | 'id'
}

function formatAmount(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID').replace(/[\u00a0\u202f]/g, '.')}`
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const { locale } = input
  const lineText = input.lines
    .map((line) => {
      const drink = line.drinkName ? ` (${line.drinkName})` : ''
      return `• ${line.qty}× ${line.name}${drink} — ${formatAmount(line.lineTotal)}`
    })
    .join('\n')

  if (locale === 'id') {
    return [
      `Halo KeCup ${input.outletName}! 🧋🧀 Mau pesan:`,
      '',
      lineText,
      `Total: ${formatAmount(input.total)}`,
      `Ambil: ${input.pickupTime}`,
      `Nama: ${input.customerName}`,
      `Catatan: ${input.notes || '-'}`,
      '',
      `Kode pesanan: ${input.code}`,
      '(dikirim dari website KeCup)',
    ].join('\n')
  }

  return [
    `Hi KeCup ${input.outletName}! 🧋🧀 I'd like to order:`,
    '',
    lineText,
    `Total: ${formatAmount(input.total)}`,
    `Pickup: ${input.pickupTime}`,
    `Name: ${input.customerName}`,
    `Notes: ${input.notes || '-'}`,
    '',
    `Order code: ${input.code}`,
    '(sent from the KeCup website)',
  ].join('\n')
}

export interface FranchiseMessageInput {
  name: string
  city: string
  budget: string
  packageLabel: string
  message: string
  locale: 'en' | 'id'
}

export function buildFranchiseMessage(input: FranchiseMessageInput): string {
  if (input.locale === 'id') {
    return [
      'Halo KeCup! 🧋 Saya tertarik jadi mitra franchise.',
      `Nama: ${input.name}`,
      `Kota/Lokasi: ${input.city}`,
      `Paket: ${input.packageLabel}`,
      `Budget: ${input.budget}`,
      `Pesan: ${input.message || '-'}`,
    ].join('\n')
  }
  return [
    'Hi KeCup! 🧋 I am interested in becoming a franchise partner.',
    `Name: ${input.name}`,
    `City/Location: ${input.city}`,
    `Package: ${input.packageLabel}`,
    `Budget: ${input.budget}`,
    `Message: ${input.message || '-'}`,
  ].join('\n')
}

export function buildMailto(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
