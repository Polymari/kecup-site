import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import Login from './Login'
import { AuthProvider, RequireAuth } from '@/lib/auth'
import { usePortal } from '@/store/portal'
import '@/i18n'

function renderApp(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/portal/login', element: <Login /> },
      {
        path: '/portal/dashboard',
        element: (
          <RequireAuth>
            <div>Dashboard ready</div>
          </RequireAuth>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  )
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('portal login', () => {
  beforeEach(() => {
    localStorage.clear()
    usePortal.getState().resetDemo()
  })

  it('redirects unauthenticated visitors to the login page', async () => {
    renderApp('/portal/dashboard')
    expect(await screen.findByRole('heading', { name: 'Franchisee portal' })).toBeInTheDocument()
  })

  it('signs in and reaches the dashboard', async () => {
    const user = userEvent.setup()
    renderApp('/portal/login')

    await user.type(screen.getByLabelText('Email'), 'anggrek.franchisee@example.com')
    await user.type(screen.getByLabelText('Password'), 'demo-kecup')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Dashboard ready')).toBeInTheDocument()
    expect(localStorage.getItem('kecup.portal.session')).toContain('anggrek.franchisee@example.com')
  })

  it('rejects empty credentials', async () => {
    const user = userEvent.setup()
    renderApp('/portal/login')
    await user.click(screen.getByRole('button', { name: 'Use demo account' }))
    expect(screen.getByLabelText('Email')).toHaveValue('anggrek.franchisee@example.com')
  })
})
