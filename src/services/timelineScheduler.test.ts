import { describe, expect, it } from 'vitest'
import {
  blockToDueAt,
  heightToEstimateMin,
  parseDateKey,
  snapToQuarterHour,
  taskToBlock,
  toDateKey,
} from './timelineScheduler'
import type { Task } from '@/entities'

describe('timelineScheduler', () => {
  it('snaps minutes to quarter-hour', () => {
    expect(snapToQuarterHour(7)).toBe(0)
    expect(snapToQuarterHour(8)).toBe(15)
    expect(snapToQuarterHour(52)).toBe(45)
  })

  it('converts task to block metrics', () => {
    const task: Task = {
      id: 1,
      title: 'Task',
      projectId: 1,
      status: 'todo',
      priority: 'none',
      myDay: false,
      dueAt: new Date('2026-04-10T10:30:00'),
      timeEstimateMin: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const block = taskToBlock(task, 64)
    expect(block.top).toBe(10.5 * 64)
    expect(block.height).toBe(1.5 * 64)
  })

  it('maps block top to due date with 15-min snap', () => {
    const dueAt = blockToDueAt(2.26 * 64, new Date('2026-04-10T00:00:00'), 64)
    expect(dueAt.getHours()).toBe(2)
    expect(dueAt.getMinutes()).toBe(15)
  })

  it('converts block height to estimate minutes', () => {
    expect(heightToEstimateMin(64, 64)).toBe(60)
    expect(heightToEstimateMin(20, 64)).toBe(15)
    expect(heightToEstimateMin(100, 64)).toBe(90)
  })

  it('serializes and parses date key', () => {
    const key = toDateKey(new Date('2026-04-10T12:00:00'))
    expect(key).toBe('2026-04-10')
    const parsed = parseDateKey(key)
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(3)
    expect(parsed?.getDate()).toBe(10)
  })
})
