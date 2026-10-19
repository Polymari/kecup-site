import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Menu from './Menu'
import { useCart } from '@/store/cart'
import { useSelectedOutlet } from '@/store/outlet'
import '@/i18n'

describe('Menu page', () => {
  beforeEach(() => {
    useCart.setState({ lines: [] })
    useSelectedOutlet.setState({ slug: 'anggrek' })
  })

  it('shows combos first with compare pricing', () => {
    render(<Menu />)
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument()
    expect(screen.getByText('Bolognese Craving Cup')).toBeInTheDocument()
    expect(screen.getByText('Mushroom Craving Cup')).toBeInTheDocument()
    expect(screen.getByText('Cheesy Craving Cup')).toBeInTheDocument()
    expect(screen.getAllByText('35k').length).toBeGreaterThan(0)
    expect(screen.getAllByText('42k').length).toBeGreaterThan(0)
  })

  it('switches tabs to snacks and drinks', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('tab', { name: 'Snacks' }))
    expect(screen.getByText('Meaty Bolognese Nachos')).toBeInTheDocument()
    expect(screen.getByText('25k')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Drinks' }))
    expect(screen.getByText('Cloudy Tea')).toBeInTheDocument()
    expect(screen.getByText('Fizzy Tea')).toBeInTheDocument()
  })

  it('adds items to the cart', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getAllByRole('button', { name: /Add to cup/ })[0])
    expect(useCart.getState().lines).toHaveLength(1)
    expect(useCart.getState().lines[0].menuItemId).toBe('combo-bolo')
    expect(useCart.getState().lines[0].drinkChoice).toBe('tea-cloudy')
  })

  it('disables sold-out items at Blok M where sauce-mush is zero', async () => {
    const user = userEvent.setup()
    useSelectedOutlet.setState({ slug: 'blok-m' })
    render(<Menu />)
    await user.click(screen.getByRole('tab', { name: 'Snacks' }))
    const cards = screen.getAllByRole('article')
    const mushroomCard = cards.find((card) =>
      within(card).queryByText('Creamy Mushroom Nachos'),
    )!
    const button = within(mushroomCard).getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Sold out')
  })
})
