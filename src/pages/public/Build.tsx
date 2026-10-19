import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DrinkKey, FlavorKey } from '@/data/types'
import { MENU_BY_ID } from '@/data/menu'
import { cn } from '@/lib/cn'
import { orderCode } from '@/lib/whatsapp'
import { CupStage } from '@/components/build/CupStage'
import { CartPanel } from '@/components/build/CartPanel'
import type { CheckoutDetails } from '@/components/build/CartPanel'
import { ReceiptModal } from '@/components/build/ReceiptModal'
import { useCart } from '@/store/cart'
import type { CartLine } from '@/store/cart'
import { useSelectedOutlet } from '@/store/outlet'
import { useAvailability, useOutlets } from '@/hooks/useOutletLive'

const FLAVORS: { key: FlavorKey; menuItemId: string; labelKey: string }[] = [
  { key: 'bolo', menuItemId: 'nachos-bolo', labelKey: 'menu.items.nachosBolo.name' },
  { key: 'mush', menuItemId: 'nachos-mush', labelKey: 'menu.items.nachosMush.name' },
  { key: 'cheese', menuItemId: 'nachos-cheese', labelKey: 'menu.items.nachosCheese.name' },
]

const DRINKS: { key: DrinkKey; menuItemId: string; labelKey: string }[] = [
  { key: 'tea-cloudy', menuItemId: 'tea-cloudy', labelKey: 'menu.items.teaCloudy.name' },
  { key: 'tea-fizzy', menuItemId: 'tea-fizzy', labelKey: 'menu.items.teaFizzy.name' },
]

const SAUCE_COLORS: Record<FlavorKey, string> = {
  bolo: 'var(--color-checker)',
  mush: '#8B5E34',
  cheese: 'var(--color-sun)',
}

export default function Build() {
  const { t } = useTranslation()
  const [flavor, setFlavor] = useState<FlavorKey | null>(null)
  const [drink, setDrink] = useState<DrinkKey | null>(null)
  const [asCombo, setAsCombo] = useState(true)
  const [qty, setQty] = useState(1)
  const [details, setDetails] = useState<CheckoutDetails>({
    customerName: '',
    pickupTime: 'ASAP',
    notes: '',
  })
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptLines, setReceiptLines] = useState<CartLine[]>([])
  const [code, setCode] = useState('')

  const lines = useCart((state) => state.lines)
  const add = useCart((state) => state.add)
  const setQtyForLine = useCart((state) => state.setQty)
  const clear = useCart((state) => state.clear)

  const slug = useSelectedOutlet((state) => state.slug)
  const outlets = useOutlets()
  const outlet = outlets.find((entry) => entry.slug === slug) ?? outlets[0]
  const availability = useAvailability(outlet.slug)

  const addCustomCup = () => {
    if (!flavor || !drink) return
    if (asCombo) {
      add({ menuItemId: `combo-${flavor}`, qty, drinkChoice: drink })
    } else {
      add({ menuItemId: `nachos-${flavor}`, qty })
      add({ menuItemId: drink, qty })
    }
  }

  const checkout = () => {
    setReceiptLines(lines)
    setCode(orderCode())
    setReceiptOpen(true)
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl font-bold text-ketchup">{t('build.title')}</h1>
      <p className="mt-1 text-lg text-ink/80">{t('build.sub')}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-6">
              <fieldset>
                <legend className="font-display text-xl font-semibold text-ink">
                  1 · {t('build.sauce')}
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {FLAVORS.map((entry) => {
                    const available = availability[entry.menuItemId] !== false
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        disabled={!available}
                        onClick={() => setFlavor(entry.key)}
                        className={cn(
                          'flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px] border-ink font-display text-xs font-semibold transition-transform',
                          flavor === entry.key
                            ? 'scale-105 shadow-sticker'
                            : 'hover:-translate-y-0.5',
                          available ? 'text-ink' : 'cursor-not-allowed opacity-40',
                        )}
                        style={{ backgroundColor: SAUCE_COLORS[entry.key] }}
                      >
                        <span className="rounded-full bg-cream/80 px-2 py-0.5 text-center text-[11px] leading-tight text-ink">
                          {t(entry.labelKey)}
                        </span>
                        {!available ? t('menu.soldOut') : null}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-xl font-semibold text-ink">
                  2 · {t('build.sip')}
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {DRINKS.map((entry) => {
                    const available = availability[entry.menuItemId] !== false
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        disabled={!available}
                        onClick={() => setDrink(entry.key)}
                        className={cn(
                          'rounded-full border-[3px] border-ink px-5 py-2.5 font-display font-semibold transition-transform',
                          drink === entry.key
                            ? 'bg-ketchup text-cream shadow-sticker'
                            : 'bg-cream text-ink hover:-translate-y-0.5',
                          available ? '' : 'cursor-not-allowed opacity-40',
                        )}
                      >
                        {t(entry.labelKey)}
                        {!available ? ` · ${t('menu.soldOut')}` : null}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-xl font-semibold text-ink">
                  3 · {t('build.combo')}
                </legend>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAsCombo(true)}
                    className={cn(
                      'rounded-full border-[3px] border-ink px-5 py-2 font-display font-semibold',
                      asCombo ? 'bg-lime text-ink shadow-sticker' : 'bg-cream text-ink',
                    )}
                  >
                    {t('combo.title')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsCombo(false)}
                    className={cn(
                      'rounded-full border-[3px] border-ink px-5 py-2 font-display font-semibold',
                      !asCombo ? 'bg-lime text-ink shadow-sticker' : 'bg-cream text-ink',
                    )}
                  >
                    {t('menu.tabs.snacks')} + {t('menu.tabs.drinks')}
                  </button>
                </div>
              </fieldset>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl font-semibold text-ink">
                    4 · {t('build.qty')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={t('common.remove')}
                      onClick={() => setQty((value) => Math.max(1, value - 1))}
                      className="h-9 w-9 rounded-full border-[3px] border-ink bg-cream font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-lg">{qty}</span>
                    <button
                      type="button"
                      aria-label={t('common.add')}
                      onClick={() => setQty((value) => value + 1)}
                      className="h-9 w-9 rounded-full border-[3px] border-ink bg-cream font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!flavor || !drink}
                  onClick={addCustomCup}
                  className="rounded-full border-[3px] border-ink bg-butter px-6 py-2.5 font-display text-lg font-semibold text-ink shadow-sticker transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                >
                  {t('menu.addToCup')}
                </button>
              </div>

              <p className="text-sm text-ink/70">
                {flavor && drink
                  ? `${t('flavors.title')}: ${t(MENU_BY_ID[`combo-${flavor}`].nameKey)} · ${t(
                      MENU_BY_ID[drink].nameKey,
                    )}`
                  : t('build.empty')}
              </p>
            </div>

            <CupStage flavor={flavor} drink={drink} />
          </div>
        </div>

        <CartPanel
          lines={lines}
          outlet={outlet}
          details={details}
          onDetailsChange={setDetails}
          onQtyChange={setQtyForLine}
          onCheckout={checkout}
        />
      </div>

      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        lines={receiptLines}
        outlet={outlet}
        details={details}
        code={code}
        onSent={clear}
      />
    </section>
  )
}
