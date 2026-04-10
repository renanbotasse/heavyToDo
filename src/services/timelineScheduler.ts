import type { Task } from '@/entities'

export interface TimelineBlockMetrics {
  top: number
  height: number
}

export function snapToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15
}

export function clampTimelineTop(top: number): number {
  return Math.max(0, top)
}

export function taskToBlock(task: Task, hourHeight: number): TimelineBlockMetrics {
  const dueAt = task.dueAt ? new Date(task.dueAt) : new Date()
  const top = dueAt.getHours() * hourHeight + (dueAt.getMinutes() / 60) * hourHeight
  const estimate = task.timeEstimateMin ?? 30
  const height = Math.max((estimate / 60) * hourHeight, hourHeight / 4)
  return { top, height }
}

export function blockTopToTime(top: number, hourHeight: number): { hour: number; minute: number } {
  const normalizedTop = clampTimelineTop(top)
  const hour = Math.floor(normalizedTop / hourHeight)
  const minutesRaw = ((normalizedTop % hourHeight) / hourHeight) * 60
  const minute = Math.min(59, snapToQuarterHour(minutesRaw))
  return { hour, minute }
}

export function blockToDueAt(top: number, columnDate: Date, hourHeight: number): Date {
  const { hour, minute } = blockTopToTime(top, hourHeight)
  const dueAt = new Date(columnDate)
  dueAt.setHours(hour, minute, 0, 0)
  return dueAt
}

export function heightToEstimateMin(height: number, hourHeight: number): number {
  const minHeight = Math.max(height, hourHeight / 4)
  return snapToQuarterHour((minHeight / hourHeight) * 60)
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date | null {
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function resolveColumnDateFromPointer(
  clientX: number,
  clientY: number,
  resolveDateKey: (clientX: number, clientY: number) => string | null,
): Date | null {
  const key = resolveDateKey(clientX, clientY)
  if (!key) return null
  return parseDateKey(key)
}
