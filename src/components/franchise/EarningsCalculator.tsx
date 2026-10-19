import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CALCULATOR_DEFAULTS } from '@/data/packages'
import { calculateEarnings, defaultEarningsInput } from '@/lib/franchise'
import { formatRupiah } from '@/lib/money'
import { Card } from '@/components/brand/Card'

const COMBO_PRICE = 31333
const COMBO_COGS = 17390
const ALA_PRICE = 19200
const ALA_COGS = 9466

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

function Slider({ label, value, min, max, step, onChange, format }: SliderProps) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-ink">
      <span className="flex items-center justify-between gap-2">
        {label}
        <span className="font-mono text-xs text-brick">
          {format ? format(value) : value.toLocaleString('id-ID')}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-ketchup"
      />
    </label>
  )
}

export function EarningsCalculator() {
  const { t } = useTranslation()
  const [dailyCups, setDailyCups] = useState(40)
  const [daysPerMonth, setDaysPerMonth] = useState(CALCULATOR_DEFAULTS.daysPerMonth)
  const [comboMixPct, setComboMixPct] = useState(CALCULATOR_DEFAULTS.comboMixPct)
  const [investment, setInvestment] = useState(20_000_000)
  const [rent, setRent] = useState(2_000_000)
  const [staffing, setStaffing] = useState(2_500_000)
  const [utilities, setUtilities] = useState(750_000)

  const result = useMemo(
    () =>
      calculateEarnings(
        defaultEarningsInput({
          dailyCups,
          daysPerMonth,
          comboMixPct,
          investment,
          rent,
          staffing,
          utilities,
          comboPrice: COMBO_PRICE,
          comboCogs: COMBO_COGS,
          alaCartePrice: ALA_PRICE,
          alaCarteCogs: ALA_COGS,
          royaltyPct: CALCULATOR_DEFAULTS.royaltyPct,
          marketingPct: CALCULATOR_DEFAULTS.marketingPct,
        }),
      ),
    [dailyCups, daysPerMonth, comboMixPct, investment, rent, staffing, utilities],
  )

  return (
    <Card className="p-6">
      <h3 className="font-display text-2xl font-semibold text-ink">{t('franchise.calcTitle')}</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Slider
          label={t('franchise.calculator.dailyCups')}
          value={dailyCups}
          min={10}
          max={300}
          step={5}
          onChange={setDailyCups}
        />
        <Slider
          label={t('franchise.calculator.daysPerMonth')}
          value={daysPerMonth}
          min={20}
          max={31}
          step={1}
          onChange={setDaysPerMonth}
        />
        <Slider
          label={t('franchise.calculator.comboMix')}
          value={comboMixPct}
          min={0}
          max={100}
          step={5}
          onChange={setComboMixPct}
          format={(value) => `${value}%`}
        />
        <Slider
          label={t('franchise.calculator.investment')}
          value={investment}
          min={5_000_000}
          max={250_000_000}
          step={5_000_000}
          onChange={setInvestment}
          format={formatRupiah}
        />
        <Slider
          label={t('franchise.calculator.rent')}
          value={rent}
          min={0}
          max={20_000_000}
          step={500_000}
          onChange={setRent}
          format={formatRupiah}
        />
        <Slider
          label={t('franchise.calculator.staffing')}
          value={staffing}
          min={0}
          max={30_000_000}
          step={500_000}
          onChange={setStaffing}
          format={formatRupiah}
        />
        <Slider
          label={t('franchise.calculator.utilities')}
          value={utilities}
          min={0}
          max={10_000_000}
          step={250_000}
          onChange={setUtilities}
          format={formatRupiah}
        />
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-ink bg-cream-deep px-4 py-3">
          <dt className="font-mono text-xs uppercase text-brick">{t('franchise.calculator.revenue')}</dt>
          <dd className="font-display text-xl font-semibold text-ink">
            {formatRupiah(result.revenue)}
          </dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-cream-deep px-4 py-3">
          <dt className="font-mono text-xs uppercase text-brick">{t('franchise.calculator.cogs')}</dt>
          <dd className="font-display text-xl font-semibold text-ink">{formatRupiah(result.cogs)}</dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-cream-deep px-4 py-3">
          <dt className="font-mono text-xs uppercase text-brick">{t('franchise.calculator.gross')}</dt>
          <dd className="font-display text-xl font-semibold text-ink">
            {formatRupiah(result.grossProfit)}
          </dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-lime px-4 py-3">
          <dt className="font-mono text-xs uppercase text-brick">{t('franchise.calculator.net')}</dt>
          <dd className="font-display text-xl font-semibold text-ink">
            {formatRupiah(result.netProfit)}
          </dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-cream-deep px-4 py-3">
          <dt className="font-mono text-xs uppercase text-brick">{t('franchise.calculator.payback')}</dt>
          <dd className="font-display text-xl font-semibold text-ink">
            {result.paybackMonths === null
              ? '—'
              : t('franchise.calculator.months', {
                  n: Math.round(result.paybackMonths * 10) / 10,
                })}
          </dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-cream-deep px-4 py-3">
          <dt className="font-mono text-xs uppercase text-brick">{t('franchise.calculator.breakeven')}</dt>
          <dd className="font-display text-xl font-semibold text-ink">
            {t('franchise.calculator.cupsPerDay', {
              n: Math.round(result.breakevenCupsPerDay * 10) / 10,
            })}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-brick">{t('franchise.disclaimer')}</p>
    </Card>
  )
}
