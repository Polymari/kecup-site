import { useState } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { TransitionLink } from '@/anim/TransitionLink'
import { Wordmark } from '@/components/brand/Wordmark'
import { LANGUAGES, setLanguage } from '@/i18n'
import type { Language } from '@/i18n'
import { useCart } from '@/store/cart'
import { cn } from '@/lib/cn'

const NAV_LINKS = [
  { to: '/menu', key: 'nav.menu' },
  { to: '/build', key: 'nav.build' },
  { to: '/outlets', key: 'nav.outlets' },
  { to: '/franchise', key: 'nav.franchise' },
]

function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = (i18n.language?.startsWith('id') ? 'id' : 'en') as Language

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center rounded-full border-[3px] border-ink bg-cream p-0.5"
    >
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => setLanguage(language)}
          aria-pressed={current === language}
          className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase transition-colors ${
            current === language ? 'bg-ketchup text-cream' : 'text-ink hover:bg-cream-deep'
          }`}
        >
          {language}
        </button>
      ))}
    </div>
  )
}

export function PublicNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const cartLines = useCart((state) => state.lines)
  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0)

  return (
    <header className="sticky top-4 z-40 mx-auto w-full max-w-5xl px-4">
      <nav
        aria-label="Main"
        className="flex items-center justify-between gap-3 rounded-full border-[3px] border-ink bg-cream/95 px-4 py-2 shadow-sticker backdrop-blur"
      >
        <TransitionLink to="/" className="shrink-0" onNavigate={() => setOpen(false)}>
          <Wordmark className="h-9 w-auto" title="KeCup home" />
        </TransitionLink>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to))
            return (
              <li key={link.to}>
                <TransitionLink
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-3 py-1.5 font-display text-sm font-semibold transition-colors',
                    isActive ? 'bg-butter text-ink shadow-sm' : 'text-ink hover:bg-butter/60',
                  )}
                >
                  {t(link.key)}
                </TransitionLink>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <TransitionLink
            to="/build"
            className="hidden rounded-full border-[3px] border-ink bg-ketchup px-4 py-1.5 font-display text-sm font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            {t('nav.order')}
          </TransitionLink>
          <TransitionLink
            to="/build"
            aria-label={`${t('nav.cart')}${cartCount > 0 ? ` (${cartCount})` : ''}`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-butter text-ink transition-transform hover:-translate-y-0.5"
          >
            <ShoppingBag size={16} aria-hidden />
            {cartCount > 0 ? (
              <span
                className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-ketchup px-1 font-mono text-[10px] font-bold text-cream shadow-sm"
                aria-hidden
              >
                {cartCount}
              </span>
            ) : null}
          </TransitionLink>
          <button
            type="button"
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink lg:hidden"
          >
            {open ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mt-2 rounded-3xl border-[3px] border-ink bg-cream p-4 shadow-sticker lg:hidden">
          <ul className="grid gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(link.to))
              return (
                <li key={link.to}>
                  <TransitionLink
                    to={link.to}
                    onNavigate={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'block rounded-2xl px-4 py-2 font-display text-lg font-semibold transition-colors',
                      isActive ? 'bg-butter text-ink' : 'text-ink hover:bg-butter/50',
                    )}
                  >
                    {t(link.key)}
                  </TransitionLink>
                </li>
              )
            })}
            <li>
              <TransitionLink
                to="/portal/login"
                onNavigate={() => setOpen(false)}
                className="block rounded-2xl px-4 py-2 font-mono text-sm text-brick hover:bg-cream-deep"
              >
                {t('nav.portalLogin')}
              </TransitionLink>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
