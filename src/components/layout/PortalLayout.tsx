import { NavLink, Outlet, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Store,
} from 'lucide-react'
import { CheckerBand } from '@/components/brand/CheckerBand'
import { Wordmark } from '@/components/brand/Wordmark'
import { useAuth } from '@/lib/auth'

const NAV_ITEMS = [
  { to: '/portal/dashboard', key: 'portal.nav.dashboard', icon: LayoutDashboard },
  { to: '/portal/cashier', key: 'portal.nav.cashier', icon: Store },
  { to: '/portal/inventory', key: 'portal.nav.inventory', icon: Boxes },
  { to: '/portal/sales', key: 'portal.nav.sales', icon: Receipt },
  { to: '/portal/analytics', key: 'portal.nav.analytics', icon: BarChart3 },
  { to: '/portal/settings', key: 'portal.nav.settings', icon: Settings },
]

export function PortalLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-dvh bg-cream">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-[3px] border-ink bg-cream-deep md:flex">
        <div className="px-5 py-6">
          <Wordmark className="h-9 w-auto" />
        </div>
        <CheckerBand cell={14} rows={1} />
        <nav aria-label="Portal" className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-[3px] border-ink bg-butter text-ink shadow-sticker'
                        : 'border-[3px] border-transparent text-ink hover:bg-cream'
                    }`
                  }
                >
                  <Icon size={17} aria-hidden />
                  {t(key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            navigate('/portal/login')
          }}
          className="m-3 flex items-center gap-2 rounded-xl border-[3px] border-ink bg-cream px-3 py-2 font-display text-sm font-semibold text-ink shadow-sticker"
        >
          <LogOut size={16} aria-hidden />
          {t('portal.nav.logout')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav
          aria-label="Portal"
          className="flex gap-1 overflow-x-auto border-b-[3px] border-ink bg-cream-deep px-2 py-2 md:hidden"
        >
          {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-semibold ${
                  isActive ? 'bg-butter text-ink' : 'text-ink'
                }`
              }
            >
              <Icon size={14} aria-hidden />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
