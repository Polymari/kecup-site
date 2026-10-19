import { describe, expect, it } from 'vitest'
import { getOutletBySlug } from '../data/outlets'
import { isOpenNow, parseHhMm, pickupSlots } from './hours'

const anggrek = getOutletBySlug('anggrek')
const mondayNoonWib = new Date('2026-10-19T05:00:00Z')
const mondayNineWib = new Date('2026-10-19T02:00:00Z')
const mondayNightWib = new Date('2026-10-19T14:00:00Z')
const sundayNoonWib = new Date('2026-10-18T05:00:00Z')

describe('parseHhMm', () => {
  it('converts clock strings to minutes', () => {
    expect(parseHhMm('10:00')).toBe(600)
    expect(parseHhMm('20:30')).toBe(1230)
  })
})

describe('isOpenNow', () => {
  it('is open during business hours', () => {
    expect(isOpenNow(anggrek, mondayNoonWib)).toEqual({ open: true, reason: 'open' })
  })

  it('is closed before opening', () => {
    expect(isOpenNow(anggrek, mondayNineWib)).toEqual({ open: false, reason: 'closed-now' })
  })

  it('is closed after closing', () => {
    expect(isOpenNow(anggrek, mondayNightWib)).toEqual({ open: false, reason: 'closed-now' })
  })

  it('reports closed on the closed weekday', () => {
    expect(isOpenNow(anggrek, sundayNoonWib)).toEqual({ open: false, reason: 'closed-today' })
  })

  it('honors temporary closure over the schedule', () => {
    const closed = { ...anggrek, temporarilyClosed: true }
    expect(isOpenNow(closed, mondayNoonWib)).toEqual({
      open: false,
      reason: 'temporarily-closed',
    })
  })
})

describe('pickupSlots', () => {
  it('starts at opening when ordered before open', () => {
    const slots = pickupSlots(anggrek, mondayNineWib)
    expect(slots[0]).toBe('ASAP')
    expect(slots[1]).toBe('10:00')
  })

  it('offers 15-minute slots up to just before close', () => {
    const slots = pickupSlots(anggrek, mondayNineWib)
    expect(slots[slots.length - 1]).toBe('19:45')
    expect(slots).not.toContain('20:00')
  })

  it('starts at the next quarter hour when ordered mid-day', () => {
    const slots = pickupSlots(anggrek, new Date('2026-10-19T05:07:00Z'))
    expect(slots[1]).toBe('12:30')
  })

  it('only offers ASAP on closed days and after close', () => {
    expect(pickupSlots(anggrek, sundayNoonWib)).toEqual(['ASAP'])
    expect(pickupSlots(anggrek, new Date('2026-10-19T13:50:00Z'))).toEqual(['ASAP'])
  })
})
