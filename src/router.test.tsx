import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RouterProvider } from 'react-router/dom'
import { router } from './router'
import './i18n'

describe('router', () => {
  it('renders the home page with navigation', async () => {
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'KeCup' })).toBeInTheDocument()
    const mainNav = within(screen.getByRole('navigation', { name: 'Main' }))
    expect(mainNav.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu')
    expect(mainNav.getByRole('link', { name: 'Build a Cup' })).toHaveAttribute('href', '/build')
  })

  it('navigates to the menu page', async () => {
    const user = userEvent.setup()
    render(<RouterProvider router={router} />)
    const mainNav = within(await screen.findByRole('navigation', { name: 'Main' }))
    await user.click(mainNav.getByRole('link', { name: 'Menu' }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Menu')
    })
    expect(window.location.pathname).toBe('/menu')
  })
})
