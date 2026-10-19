import { useTranslation } from 'react-i18next'
import { TransitionLink } from '@/anim/TransitionLink'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-brick">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-ketchup">{t('error.404')}</h1>
      <TransitionLink
        to="/"
        className="mt-8 rounded-full border-[3px] border-ink bg-butter px-6 py-2.5 font-display font-semibold text-ink shadow-sticker"
      >
        {t('error.home')}
      </TransitionLink>
    </section>
  )
}
