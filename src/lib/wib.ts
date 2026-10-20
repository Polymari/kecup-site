import type { DayKey } from '../data/types'

export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export interface WibParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

export const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function wibParts(date: Date): WibParts {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  }
}

export function dayKey(date: Date): DayKey {
  return DAY_KEYS[wibParts(date).weekday]
}

export function minutesOfDay(date: Date): number {
  const parts = wibParts(date)
  return parts.hour * 60 + parts.minute
}

export function dateKey(date: Date): string {
  const parts = wibParts(date)
  const month = String(parts.month).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')
  return `${parts.year}-${month}-${day}`
}

export function dateKeyToUtc(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day) - WIB_OFFSET_MS)
}

export function addDaysToKey(key: string, days: number): string {
  const base = dateKeyToUtc(key)
  return dateKey(new Date(base.getTime() + days * 24 * 60 * 60 * 1000))
}

/** "YYYY-MM-DD HH:MM" in Asia/Jakarta, regardless of the viewer's timezone. */
export function formatWibDateTime(date: Date | string): string {
  const parts = wibParts(typeof date === 'string' ? new Date(date) : date)
  const hour = String(parts.hour).padStart(2, '0')
  const minute = String(parts.minute).padStart(2, '0')
  return `${dateKey(typeof date === 'string' ? new Date(date) : date)} ${hour}:${minute}`
}
