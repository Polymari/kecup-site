import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LipsCursor } from './LipsCursor'
import { useKisses } from '@/store/kisses'

describe('kiss counter', () => {
  beforeEach(() => {
    useKisses.setState({ count: 0 })
  })

  it('increments and persists', () => {
    useKisses.getState().add()
    useKisses.getState().add()
    expect(useKisses.getState().count).toBe(2)
    expect(localStorage.getItem('kecup.kisses')).toContain('"count":2')
  })
})

describe('LipsCursor', () => {
  it('renders nothing without a fine pointer or under reduced motion (test env)', () => {
    const { container } = render(<LipsCursor />)
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.queryByRole('presentation')).toBeNull()
  })
})
