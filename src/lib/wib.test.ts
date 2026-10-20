import { describe, expect, it } from 'vitest'
import {
  addDaysToKey,
  dateKey,
  dateKeyToUtc,
  dayKey,
  formatWibDateTime,
  minutesOfDay,
  wibParts,
} from './wib'

describe('wibParts', () => {
  it('shifts UTC to Asia/Jakarta (UTC+7)', () => {
    expect(wibParts(new Date('2026-10-19T05:00:00Z'))).toEqual({
      year: 2026,
      month: 10,
      day: 19,
      hour: 12,
      minute: 0,
      weekday: 1,
    })
  })
})

describe('dateKey', () => {
  it('keeps the WIB date before the UTC date rolls over', () => {
    expect(dateKey(new Date('2026-10-19T16:59:00Z'))).toBe('2026-10-19')
  })

  it('crosses the day boundary at 17:00 UTC', () => {
    expect(dateKey(new Date('2026-10-19T17:00:00Z'))).toBe('2026-10-20')
    expect(dateKey(new Date('2026-10-19T23:30:00Z'))).toBe('2026-10-20')
  })
})

describe('dateKeyToUtc', () => {
  it('returns the UTC instant of WIB midnight', () => {
    expect(dateKeyToUtc('2026-10-20').toISOString()).toBe('2026-10-19T17:00:00.000Z')
  })
})

describe('dayKey and minutesOfDay', () => {
  it('maps WIB weekday names', () => {
    expect(dayKey(new Date('2026-10-19T05:00:00Z'))).toBe('mon')
    expect(dayKey(new Date('2026-10-18T05:00:00Z'))).toBe('sun')
  })

  it('computes minutes since WIB midnight', () => {
    expect(minutesOfDay(new Date('2026-10-19T05:00:00Z'))).toBe(720)
    expect(minutesOfDay(new Date('2026-10-19T16:59:00Z'))).toBe(1439)
  })
})

describe('addDaysToKey', () => {
  it('rolls over months correctly', () => {
    expect(addDaysToKey('2026-10-30', 3)).toBe('2026-11-02')
  })
})

describe('formatWibDateTime', () => {
  it('formats an ISO instant as Jakarta wall-clock time', () => {
    expect(formatWibDateTime('2026-09-21T05:07:00.000Z')).toBe('2026-09-21 12:07')
    expect(formatWibDateTime(new Date('2026-10-19T17:05:00Z'))).toBe('2026-10-20 00:05')
  })
})
