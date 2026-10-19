const integerFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

function normalizeGrouping(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, '.')
}

export function formatRupiah(amount: number): string {
  return `Rp ${normalizeGrouping(integerFormatter.format(Math.round(amount)))}`
}

export function formatRupiahExact(amount: number): string {
  return `Rp ${normalizeGrouping(decimalFormatter.format(amount))}`
}

export function formatK(amount: number): string {
  const thousands = amount / 1000
  if (Number.isInteger(thousands)) return `${thousands}k`
  const rounded = Math.round(thousands * 10) / 10
  return `${rounded.toFixed(1).replace('.', ',')}k`
}
