import { useTranslation } from 'react-i18next'
import { CheckerBand } from '@/components/brand/CheckerBand'
import { Wordmark } from '@/components/brand/Wordmark'
import { TransitionLink } from '@/anim/TransitionLink'
import { SITE } from '@/config/site'
import { useKisses } from '@/store/kisses'

const EXPLORE = [
  { to: '/menu', key: 'nav.menu' },
  { to: '/build', key: 'nav.build' },
  { to: '/outlets', key: 'nav.outlets' },
]

const PARTNER = [
  { to: '/franchise', key: 'nav.franchise' },
  { to: '/portal/login', key: 'nav.portalLogin' },
]

export function PublicFooter() {
  const { t } = useTranslation()
  const kisses = useKisses((state) => state.count)

  return (
    <footer className="mt-24">
      <CheckerBand cell={22} rows={2} />
      <div className="bg-cream-deep px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Wordmark className="h-12 w-auto" />
            <p className="mt-3 font-script text-2xl text-ketchup">{t('footer.tagline')}</p>
            <p className="mt-4 max-w-sm text-sm text-ink/80">{t('footer.disclaimer')}</p>
          </div>

          <nav aria-label={t('footer.explore')}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brick">
              {t('footer.explore')}
            </h2>
            <ul className="mt-3 space-y-2">
              {EXPLORE.map((link) => (
                <li key={link.to}>
                  <TransitionLink to={link.to} className="text-sm text-ink hover:text-ketchup">
                    {t(link.key)}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('footer.partner')}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brick">
              {t('footer.partner')}
            </h2>
            <ul className="mt-3 space-y-2">
              {PARTNER.map((link) => (
                <li key={link.to}>
                  <TransitionLink to={link.to} className="text-sm text-ink hover:text-ketchup">
                    {t(link.key)}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brick">
              {t('footer.social')}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              <li>
                <a
                  href={`https://instagram.com/${SITE.instagram.replace('@', '')}`}
                  className="hover:text-ketchup"
                  rel="noreferrer"
                  target="_blank"
                >
                  {SITE.instagram}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.contactEmail}`} className="hover:text-ketchup">
                  {SITE.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-brick">
            © {new Date().getFullYear()} {SITE.brandName} · {t('footer.tagline')}
          </p>
          <p className="font-mono text-xs text-brick">
            {t('footer.kissCounter')}: <span className="font-bold text-ketchup">{kisses}</span> 💋
          </p>
        </div>
      </div>
      <CheckerBand cell={22} rows={2} flip />
    </footer>
  )
}
