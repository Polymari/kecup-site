import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'
import { Placeholder } from './Placeholder'
import { Wordmark } from './Wordmark'

describe('Button', () => {
  it('renders a button by default', () => {
    render(<Button>Order</Button>)
    const button = screen.getByRole('button', { name: 'Order' })
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('renders an anchor when asChild is set', () => {
    render(
      <Button asChild>
        <a href="https://wa.me/123">Send via WhatsApp</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Send via WhatsApp' })
    expect(link).toBeInTheDocument()
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'https://wa.me/123')
  })

  it('keeps custom classes when asChild clones the child', () => {
    render(
      <Button asChild className="extra-class">
        <a href="/menu">Menu</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Menu' })
    expect(link).toHaveClass('extra-class')
    expect(link).toHaveClass('rounded-full')
  })
})

describe('Placeholder', () => {
  it('renders its label and aspect ratio', () => {
    render(<Placeholder label="hero-lifestyle" ratio="4 / 5" />)
    const box = screen.getByTestId('placeholder')
    expect(box).toHaveAttribute('aria-label', 'Photo needed: hero-lifestyle')
    expect(box).toHaveStyle({ aspectRatio: '4 / 5' })
    expect(screen.getByText('hero-lifestyle')).toBeInTheDocument()
  })
})

describe('Wordmark', () => {
  it('renders SVG text with stroke + paint-order attributes', () => {
    const { container } = render(<Wordmark />)
    const svg = container.querySelector('svg')
    const text = container.querySelector('text')
    expect(svg).toHaveAttribute('role', 'img')
    expect(svg).toHaveAttribute('aria-label', 'KeCup')
    expect(text).toHaveAttribute('paint-order', 'stroke fill')
    expect(text).toHaveAttribute('stroke', 'var(--color-tangerine)')
    expect(text).toHaveAttribute('fill', 'var(--color-ketchup)')
  })
})
