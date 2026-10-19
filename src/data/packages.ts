export interface FranchiseDefaults {
  daysPerMonth: number
  comboMixPct: number
  royaltyPct: number
  marketingPct: number
  rent: number
  staffing: number
  utilities: number
  dailyCups: number
}

export interface FranchisePackage {
  id: 'regular' | 'large' | 'jumbo'
  nameKey: string
  formatKey: string
  investmentMin: number
  investmentMax: number
  investmentMid: number
  spaceKey: string
  staffKey: string
  inclusionsKey: string
  defaults: FranchiseDefaults
}

export const CALCULATOR_DEFAULTS = {
  daysPerMonth: 26,
  comboMixPct: 55,
  royaltyPct: 5,
  marketingPct: 2,
}

export const FRANCHISE_PACKAGES: FranchisePackage[] = [
  {
    id: 'regular',
    nameKey: 'franchise.packages.regular.name',
    formatKey: 'franchise.packages.regular.format',
    investmentMin: 15_000_000,
    investmentMax: 25_000_000,
    investmentMid: 20_000_000,
    spaceKey: 'franchise.packages.regular.space',
    staffKey: 'franchise.packages.regular.staff',
    inclusionsKey: 'franchise.packages.regular.inclusions',
    defaults: {
      ...CALCULATOR_DEFAULTS,
      rent: 2_000_000,
      staffing: 2_500_000,
      utilities: 750_000,
      dailyCups: 40,
    },
  },
  {
    id: 'large',
    nameKey: 'franchise.packages.large.name',
    formatKey: 'franchise.packages.large.format',
    investmentMin: 40_000_000,
    investmentMax: 70_000_000,
    investmentMid: 55_000_000,
    spaceKey: 'franchise.packages.large.space',
    staffKey: 'franchise.packages.large.staff',
    inclusionsKey: 'franchise.packages.large.inclusions',
    defaults: {
      ...CALCULATOR_DEFAULTS,
      rent: 3_500_000,
      staffing: 7_000_000,
      utilities: 1_500_000,
      dailyCups: 90,
    },
  },
  {
    id: 'jumbo',
    nameKey: 'franchise.packages.jumbo.name',
    formatKey: 'franchise.packages.jumbo.format',
    investmentMin: 120_000_000,
    investmentMax: 200_000_000,
    investmentMid: 160_000_000,
    spaceKey: 'franchise.packages.jumbo.space',
    staffKey: 'franchise.packages.jumbo.staff',
    inclusionsKey: 'franchise.packages.jumbo.inclusions',
    defaults: {
      ...CALCULATOR_DEFAULTS,
      rent: 9_000_000,
      staffing: 24_000_000,
      utilities: 3_600_000,
      dailyCups: 200,
    },
  },
]
