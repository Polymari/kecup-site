import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Build from './Build'
import { useCart } from '@/store/cart'
import { useSelectedOutlet } from '@/store/outlet'
import '@/i18n'

describe('Build page flow', () => {
  beforeEach(() => {
    useCart.setState({ lines: [] })
    useSelectedOutlet.setState({ slug: 'anggrek' })
  })

  it('walks sauce → sip → combo → cart → checkout → WhatsApp', async () => {
    const user = userEvent.setup()
    render(<Build />)

    await user.click(screen.getByRole('button', { name: /Meaty Bolognese Nachos/ }))
    await user.click(screen.getByRole('button', { name: 'Cloudy Tea' }))
    await user.click(screen.getByRole('button', { name: 'Add to cup' }))

    expect(useCart.getState().lines).toEqual([
      expect.objectContaining({
        menuItemId: 'combo-bolo',
        drinkChoice: 'tea-cloudy',
        qty: 1,
      }),
    ])
    expect(screen.getByText('You saved Rp 7.000')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Your name'), 'Tari')
    await user.click(screen.getByRole('button', { name: 'Checkout' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/KC-[0-9A-F]{4}/)).toBeInTheDocument()

    const link = within(dialog).getByRole('link', { name: /Send via WhatsApp/ })
    const href = link.getAttribute('href')!
    expect(href.startsWith('https://wa.me/6281200000001?text=')).toBe(true)
    const message = decodeURIComponent(href.split('?text=')[1])
    expect(message).toContain('Bolognese Craving Cup (Cloudy Tea)')
    expect(message).toContain('Total: Rp 35.000')
    expect(message).toContain('Name: Tari')
    expect(message).toMatch(/Order code: KC-[0-9A-F]{4}/)

    await user.click(link)
    expect(useCart.getState().lines).toHaveLength(0)
    expect(screen.getByText('KECUP!')).toBeInTheDocument()
  })

  it('orders separate snack + drink lines when combo is declined', async () => {
    const user = userEvent.setup()
    render(<Build />)

    await user.click(screen.getByRole('button', { name: /Golden Cheese Nachos/ }))
    await user.click(screen.getByRole('button', { name: 'Fizzy Tea' }))
    await user.click(screen.getByRole('button', { name: /Snacks \+ Drinks/ }))
    await user.click(screen.getByRole('button', { name: 'Add to cup' }))

    expect(useCart.getState().lines).toHaveLength(2)
    expect(useCart.getState().lines.map((line) => line.menuItemId).sort()).toEqual([
      'nachos-cheese',
      'tea-fizzy',
    ])
  })

  it('disables sold-out components at Blok M', async () => {
    useSelectedOutlet.setState({ slug: 'blok-m' })
    render(<Build />)

    const mushroom = screen.getByRole('button', { name: /Creamy Mushroom Nachos/ })
    expect(mushroom).toBeDisabled()
  })
})
