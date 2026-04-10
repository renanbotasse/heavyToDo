import { db } from '@/db'
import { broadcast } from './broadcast'
import { ok, err, type Result } from '@/entities/errors'
import type { ID } from '@/entities'

export const TimerService = {
  async start(taskId: ID): Promise<Result<void>> {
    try {
      await db.transaction('rw', db.timeEntries, db.userConfig, db.tasks, async () => {
        const config = await db.userConfig.get(1)
        if (config?.activeTimerTaskId && config.activeTimerTaskId !== taskId) {
          await TimerService._stopEntry(config.activeTimerTaskId)
        }
        const task = await db.tasks.get(taskId)
        if (!task) throw new Error('NOT_FOUND')
        if (task.status !== 'in_progress') {
          await db.tasks.update(taskId, { status: 'in_progress', updatedAt: new Date() })
        }
        await db.timeEntries.add({ taskId, startedAt: new Date() })
        await db.userConfig.update(1, { activeTimerTaskId: taskId })
      })
      broadcast({ type: 'TIMER_STARTED', taskId })
      return ok(undefined)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async stop(taskId: ID): Promise<Result<void>> {
    try {
      await TimerService._stopEntry(taskId)
      await db.userConfig.update(1, { activeTimerTaskId: undefined })
      broadcast({ type: 'TIMER_STOPPED', taskId })
      return ok(undefined)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async _stopEntry(taskId: ID) {
    const entries = await db.timeEntries.where('taskId').equals(taskId).toArray()
    const open = entries.find(e => !e.endedAt)
    if (open?.id) await db.timeEntries.update(open.id, { endedAt: new Date() })
  },

  /** Recupera estado ao recarregar a página */
  async recover(): Promise<ID | null> {
    const config = await db.userConfig.get(1)
    if (!config?.activeTimerTaskId) return null
    const entries = await db.timeEntries.where('taskId').equals(config.activeTimerTaskId).toArray()
    const open = entries.find(e => !e.endedAt)
    if (!open) {
      await db.userConfig.update(1, { activeTimerTaskId: undefined })
      return null
    }
    return config.activeTimerTaskId
  },

  /** Duração total acumulada de uma task em minutos (calculado) */
  async getDurationMin(taskId: ID): Promise<number> {
    const entries = await db.timeEntries.where('taskId').equals(taskId).toArray()
    return entries.reduce((sum, e) => {
      const end = e.endedAt ?? new Date()
      return sum + Math.round((end.getTime() - new Date(e.startedAt).getTime()) / 60000)
    }, 0)
  },
}
