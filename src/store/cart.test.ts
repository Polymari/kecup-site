import { beforeEach, describe, expect, it } from 'vitest'
import { useCart } from './cart'

describe('cart store', () => {
  beforeEach(() => {
    useCart.setState({ lines: [] })
  })

  it('adds a line', () => {
    useCart.getState().add({ menuItemId: 'nachos-bolo', qty: 1 })
    expect(useCart.getState().lines).toHaveLength(1)
    expect(useCart.getState().lines[0]).toMatchObject({ menuItemId: 'nachos-bolo', qty: 1 })
  })

  it('merges quantities for the same item and drink choice', () => {
    useCart.getState().add({ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-cloudy' })
    useCart.getState().add({ menuItemId: 'combo-bolo', qty: 2, drinkChoice: 'tea-cloudy' })
    expect(useCart.getState().lines).toHaveLength(1)
    expect(useCart.getState().lines[0].qty).toBe(3)
  })

  it('keeps different drink choices on separate lines', () => {
    useCart.getState().add({ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-cloudy' })
    useCart.getState().add({ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-fizzy' })
    expect(useCart.getState().lines).toHaveLength(2)
  })

  it('updates quantity and removes lines', () => {
    useCart.getState().add({ menuItemId: 'nachos-cheese', qty: 1 })
    const { lineId } = useCart.getState().lines[0]
    useCart.getState().setQty(lineId, 4)
    expect(useCart.getState().lines[0].qty).toBe(4)
    useCart.getState().setQty(lineId, 0)
    expect(useCart.getState().lines).toHaveLength(0)
  })

  it('removes and clears', () => {
    useCart.getState().add({ menuItemId: 'tea-cloudy', qty: 1 })
    useCart.getState().add({ menuItemId: 'tea-fizzy', qty: 1 })
    const { lineId } = useCart.getState().lines[0]
    useCart.getState().remove(lineId)
    expect(useCart.getState().lines).toHaveLength(1)
    useCart.getState().clear()
    expect(useCart.getState().lines).toHaveLength(0)
  })
})
