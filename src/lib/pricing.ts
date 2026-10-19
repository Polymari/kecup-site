export const HPP_TARGET = 0.6

export function hppPercent(price: number, hpp: number): number {
  if (price <= 0) return 0
  return (hpp / price) * 100
}

export function suggestedPrice(hpp: number, target: number = HPP_TARGET): number {
  const raw = hpp / target
  const snapped = Math.round(raw)
  const cleaned = Math.abs(raw - snapped) < 1e-6 ? snapped : raw
  return Math.ceil(cleaned / 500) * 500
}

export interface PricingInsight {
  hpp: number
  price: number
  hppPct: number
  overTarget: boolean
  suggestion: number | null
}

export function pricingInsight(price: number, hpp: number, target: number = HPP_TARGET): PricingInsight {
  const pct = hppPercent(price, hpp)
  const overTarget = pct > target * 100
  return {
    hpp,
    price,
    hppPct: pct,
    overTarget,
    suggestion: overTarget ? suggestedPrice(hpp, target) : null,
  }
}
