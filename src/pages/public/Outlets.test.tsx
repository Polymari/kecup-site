import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import Outlets from './Outlets'
import OutletDetail from './OutletDetail'
import '@/i18n'

function renderDetail(slug: string) {
  const router = createMemoryRouter(
    [
      { path: '/outlets/:slug', element: <OutletDetail /> },
    ],
    { initialEntries: [`/outlets/${slug}`] },
  )
  return render(<RouterProvider router={router} />)
}

function renderOutlets() {
  const router = createMemoryRouter([{ path: '/outlets', element: <Outlets /> }], {
    initialEntries: ['/outlets'],
  })
  return render(<RouterProvider router={router} />)
}

describe('Outlets page', () => {
  it('lists all six outlets with the Craving Line', () => {
    renderOutlets()
    expect(screen.getByRole('heading', { name: 'Ride the Craving Line' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Craving Line' })).toBeInTheDocument()
    for (const name of [
      'KeCup BINUS Anggrek',
      'KeCup Kemanggisan',
      'KeCup Blok M',
      'KeCup Kelapa Gading',
      'KeCup Rawamangun',
      'KeCup BSD',
    ]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByRole('article')).toHaveLength(6)
  })

  it('offers WhatsApp and Maps actions per outlet', () => {
    renderOutlets()
    expect(screen.getAllByRole('link', { name: 'WhatsApp this outlet' })).toHaveLength(6)
    expect(screen.getAllByRole('link', { name: 'Open in Google Maps' })).toHaveLength(6)
  })
})

describe('OutletDetail', () => {
  it('shows live availability per menu item at Blok M', () => {
    renderDetail('blok-m')
    expect(screen.getByRole('heading', { name: 'KeCup Blok M' })).toBeInTheDocument()
    const soldOut = screen.getAllByText('Sold out')
    expect(soldOut.length).toBe(2)
  })

  it('renders the hours table with today highlighted', () => {
    renderDetail('anggrek')
    expect(screen.getByText(/Today/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Opening hours' })).toBeInTheDocument()
  })

  it('renders the 404 page for unknown slugs', () => {
    renderDetail('does-not-exist')
    expect(screen.getByText("This cup's empty — let's get you a refill.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
