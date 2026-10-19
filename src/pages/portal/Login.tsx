import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Lips } from '@/components/brand/Lips'
import { Wordmark } from '@/components/brand/Wordmark'
import { useAuth } from '@/lib/auth'
import { SITE } from '@/config/site'
import { cn } from '@/lib/cn'

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const failure = await signIn(email, password)
    setBusy(false)
    if (failure) {
      setError(true)
      return
    }
    navigate('/portal/dashboard')
  }

  const useDemo = async () => {
    setEmail(import.meta.env.VITE_DEMO_LOGIN_EMAIL || 'anggrek.franchisee@example.com')
    setPassword(import.meta.env.VITE_DEMO_LOGIN_PASSWORD || 'demo-kecup')
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col items-center justify-center gap-6 bg-ketchup lg:flex">
        <Wordmark className="h-20 w-auto" />
        <Lips className="h-10 w-20 text-cream" />
        <p className="font-script text-4xl text-cream">{t('footer.tagline')}</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form
          onSubmit={submit}
          className={cn(
            'w-full max-w-sm rounded-2xl border-[3px] border-ink bg-cream p-8 shadow-sticker',
            error && 'animate-[shake_0.4s_ease-in-out]',
          )}
          onAnimationEnd={() => setError(false)}
        >
          <h1 className="font-display text-3xl font-bold text-ink">{t('portal.login.title')}</h1>

          <div className="mt-6 grid gap-3">
            <div className="grid gap-1">
              <label htmlFor="login-email" className="text-sm font-semibold text-ink">
                {t('portal.login.email')}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-1">
              <label htmlFor="login-password" className="text-sm font-semibold text-ink">
                {t('portal.login.password')}
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-ketchup">
                {t('portal.login.error')}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-full border-[3px] border-ink bg-ketchup px-6 py-3 font-display text-lg font-semibold text-cream shadow-sticker disabled:opacity-50"
          >
            {t('portal.login.signIn')}
          </button>

          {SITE.showDemoLogin ? (
            <button
              type="button"
              onClick={useDemo}
              className="mt-3 w-full rounded-full border-[3px] border-ink bg-butter px-6 py-2 font-display font-semibold text-ink"
            >
              {t('portal.login.demo')}
            </button>
          ) : null}
        </form>
      </div>

      <style>{`@keyframes shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }`}</style>
    </div>
  )
}
