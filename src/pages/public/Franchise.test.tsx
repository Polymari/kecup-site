import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ApplyForm } from '@/components/franchise/ApplyForm'
import { EarningsCalculator } from '@/components/franchise/EarningsCalculator'
import '@/i18n'

describe('EarningsCalculator', () => {
  it('shows the illustrative results for defaults', () => {
    render(<EarningsCalculator />)
    expect(screen.getByText('Estimate your earnings')).toBeInTheDocument()
    expect(screen.getAllByText(/Rp 26\.908\.0\d\d/).length).toBe(1)
    expect(screen.getByText('3.7 months')).toBeInTheDocument()
    expect(screen.getByText(/Illustrative only/)).toBeInTheDocument()
  })
})

describe('ApplyForm', () => {
  it('blocks next until the step validates', async () => {
    const user = userEvent.setup()
    render(<ApplyForm />)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Full name'), 'Tari')
    await user.type(screen.getByLabelText('Email'), 'tari@example.com')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('builds WhatsApp and mailto links after submitting', async () => {
    const user = userEvent.setup()
    render(<ApplyForm defaultPackage="large" />)

    await user.type(screen.getByLabelText('Full name'), 'Tari')
    await user.type(screen.getByLabelText('Email'), 'tari@example.com')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.type(screen.getByLabelText('City / location'), 'Jakarta')
    await user.type(screen.getByLabelText('Budget'), 'Rp 50.000.000')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    const whatsapp = await screen.findByRole('link', { name: 'Send via WhatsApp' })
    const href = whatsapp.getAttribute('href')!
    expect(href.startsWith('https://wa.me/6281200000000?text=')).toBe(true)
    const message = decodeURIComponent(href.split('?text=')[1])
    expect(message).toContain('Name: Tari')
    expect(message).toContain('Package: Large')
    expect(message).toContain('Budget: Rp 50.000.000')

    const email = screen.getByRole('link', { name: 'Send via email' })
    expect(email.getAttribute('href')).toContain('mailto:partner@kecup.example')
    expect(email.getAttribute('href')).toContain('Franchise%3A%20Large')
  })

  it('keeps the selected package from the page', async () => {
    const user = userEvent.setup()
    render(<ApplyForm defaultPackage="jumbo" />)
    await user.type(screen.getByLabelText('Full name'), 'Tari')
    await user.type(screen.getByLabelText('Email'), 'tari@example.com')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Package')).toHaveValue('jumbo')
  })
})
