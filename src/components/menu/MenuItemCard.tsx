import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { MenuItem } from '@/data/types'
import { formatK } from '@/lib/money'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { Photo } from '@/components/brand/Photo'
import { PriceTag } from '@/components/brand/PriceTag'
import { Sticker } from '@/components/brand/Sticker'
import { useCart } from '@/store/cart'

type MenuItemCardProps = {
  item: MenuItem
  available: boolean
}

export function MenuItemCard({ item, available }: MenuItemCardProps) {
  const { t } = useTranslation()
  const add = useCart((state) => state.add)
  const savings = item.comparePrice ? item.comparePrice - item.price : 0

  return (
    <Card as="article" className="relative flex flex-col p-4">
      {item.kind === 'combo' ? (
        <div className="absolute -right-2 -top-3 z-10">
          <Sticker tone="lime">{t('combo.bestValue')}</Sticker>
        </div>
      ) : null}

      <Photo photoKey={item.photoKey} className="w-full" imgClassName="aspect-square" />

      <h3 className="mt-3 font-display text-xl font-semibold text-ink">{t(item.nameKey)}</h3>
      <p className="mt-1 text-sm text-ink/80">{t(item.descKey)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriceTag
          price={formatK(item.price)}
          compare={item.comparePrice ? formatK(item.comparePrice) : undefined}
        />
        {savings > 0 ? <Badge tone="ketchup">{`${t('menu.compare')} ${formatK(savings)}`}</Badge> : null}
      </div>

      <button
        type="button"
        disabled={!available}
        onClick={() =>
          add({
            menuItemId: item.id,
            qty: 1,
            drinkChoice: item.kind === 'combo' ? item.drinkChoices?.[0] : undefined,
          })
        }
        className={`mt-4 inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-ink px-4 py-2 font-display font-semibold transition-transform ${
          available
            ? 'bg-ketchup text-cream shadow-sticker hover:-translate-y-0.5 active:translate-y-0'
            : 'cursor-not-allowed bg-cream-deep text-brick'
        }`}
      >
        <Plus size={16} aria-hidden />
        {available ? t('menu.addToCup') : t('menu.soldOut')}
      </button>
    </Card>
  )
}
