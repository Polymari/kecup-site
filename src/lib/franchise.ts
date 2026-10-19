export interface EarningsInput {
  dailyCups: number
  daysPerMonth: number
  comboMixPct: number
  comboPrice: number
  comboCogs: number
  alaCartePrice: number
  alaCarteCogs: number
  rent: number
  staffing: number
  utilities: number
  royaltyPct: number
  marketingPct: number
  investment: number
}

export interface EarningsResult {
  monthlyCups: number
  comboCups: number
  alaCarteCups: number
  revenue: number
  cogs: number
  grossProfit: number
  royalty: number
  marketing: number
  fixedOpex: number
  netProfit: number
  paybackMonths: number | null
  breakevenCupsPerDay: number
}

export function calculateEarnings(input: EarningsInput): EarningsResult {
  const monthlyCups = input.dailyCups * input.daysPerMonth
  const comboCups = (monthlyCups * input.comboMixPct) / 100
  const alaCarteCups = monthlyCups - comboCups

  const revenue = comboCups * input.comboPrice + alaCarteCups * input.alaCartePrice
  const cogs = comboCups * input.comboCogs + alaCarteCups * input.alaCarteCogs
  const grossProfit = revenue - cogs

  const royalty = revenue * (input.royaltyPct / 100)
  const marketing = revenue * (input.marketingPct / 100)
  const fixedOpex = input.rent + input.staffing + input.utilities

  const netProfit = grossProfit - royalty - marketing - fixedOpex
  const paybackMonths = netProfit > 0 ? input.investment / netProfit : null

  const feeRate = (input.royaltyPct + input.marketingPct) / 100
  const comboMargin = input.comboPrice - input.comboCogs - input.comboPrice * feeRate
  const alaCarteMargin = input.alaCartePrice - input.alaCarteCogs - input.alaCartePrice * feeRate
  const marginPerCup = (comboCups * comboMargin + alaCarteCups * alaCarteMargin) / monthlyCups

  const breakevenCupsPerDay =
    marginPerCup > 0 ? fixedOpex / marginPerCup / input.daysPerMonth : 0

  return {
    monthlyCups,
    comboCups,
    alaCarteCups,
    revenue,
    cogs,
    grossProfit,
    royalty,
    marketing,
    fixedOpex,
    netProfit,
    paybackMonths,
    breakevenCupsPerDay,
  }
}

export function defaultEarningsInput(
  overrides: Partial<EarningsInput> & Pick<EarningsInput, 'investment'>,
): EarningsInput {
  return {
    dailyCups: 40,
    daysPerMonth: 26,
    comboMixPct: 55,
    comboPrice: 31333,
    comboCogs: 17390,
    alaCartePrice: 19200,
    alaCarteCogs: 9466,
    rent: 2_000_000,
    staffing: 2_500_000,
    utilities: 750_000,
    royaltyPct: 5,
    marketingPct: 2,
    ...overrides,
  }
}
