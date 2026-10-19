import type { Outlet, OutletHoursDay } from '../data/types'
import { dayKey, minutesOfDay } from './wib'

export type OpenReason = 'open' | 'closed-now' | 'closed-today' | 'temporarily-closed'

export interface OpenStatus {
  open: boolean
  reason: OpenReason
}

export function parseHhMm(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function todayHours(outlet: Outlet, now: Date): OutletHoursDay | null {
  const day = outlet.hours[dayKey(now)]
  if (!day || day.closed) return null
  return day
}

export function isOpenNow(outlet: Outlet, now: Date): OpenStatus {
  if (outlet.temporarilyClosed) return { open: false, reason: 'temporarily-closed' }
  const today = todayHours(outlet, now)
  if (!today) return { open: false, reason: 'closed-today' }
  const minutes = minutesOfDay(now)
  const open = minutes >= parseHhMm(today.open) && minutes < parseHhMm(today.close)
  return { open, reason: open ? 'open' : 'closed-now' }
}

export function pickupSlots(outlet: Outlet, now: Date): string[] {
  const today = todayHours(outlet, now)
  if (!today || outlet.temporarilyClosed) return ['ASAP']

  const openMinutes = parseHhMm(today.open)
  const closeMinutes = parseHhMm(today.close)
  const startMinutes = Math.max(openMinutes, Math.ceil((minutesOfDay(now) + 15) / 15) * 15)

  const slots: string[] = ['ASAP']
  for (let minutes = startMinutes; minutes < closeMinutes; minutes += 15) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
    if (slots.length > 48) break
  }
  return slots
}
