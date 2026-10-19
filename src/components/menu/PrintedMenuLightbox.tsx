import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { asset } from '@/lib/asset'

export function PrintedMenuLightbox() {
  const { t } = useTranslation()

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="rounded-full border-[3px] border-ink bg-cream px-5 py-2 font-display font-semibold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
        >
          {t('menu.viewPrinted')}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border-[3px] border-ink bg-cream p-5">
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="font-display text-2xl font-semibold text-ink">
              {t('menu.viewPrinted')}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t('common.close')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-butter text-ink"
            >
              <X size={16} aria-hidden />
            </Dialog.Close>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <img
              src={asset('brand/menu2.jpeg')}
              alt="KeCup printed menu"
              className="w-full rounded-xl border-[3px] border-ink"
            />
            <img
              src={asset('brand/menu-1.jpeg')}
              alt="KeCup Make Your Own Cup menu"
              className="w-full rounded-xl border-[3px] border-ink"
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
