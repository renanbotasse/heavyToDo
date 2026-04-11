import { db } from '@/db'
import { TimerService } from '@/services/timer'
import { broadcast } from '@/services/broadcast'
import { ok, err, type Result } from '@/entities/errors'
import { addDays, addWeeks, addMonths } from 'date-fns'
import type { ID, Task, TaskRecurrence } from '@/entities'
import { resolveCreateProjectId } from './taskProject'

type TaskCreateInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'> & { projectId?: ID }

export const TaskUseCases = {
  async create(data: TaskCreateInput): Promise<Result<Task>> {
    try {
      const now = new Date()
      const config = await db.userConfig.get(1)
      const fallbackDefault = config?.defaultProjectId ?? (await db.projects.filter(p => p.isDefault).first())?.id
      const validInputProject = data.projectId ? await db.projects.get(data.projectId) : undefined
      const projectId = resolveCreateProjectId(validInputProject?.id, fallbackDefault)
      if (!projectId) return err('INVARIANT_VIOLATION', 'No default project')

      // Assign order: new tasks go to the end of their sibling group
      const order = data.parentId
        ? await db.tasks.where('parentId').equals(data.parentId).count()
        : await db.tasks.where('projectId').equals(projectId).filter(t => !t.parentId).count()

      const id = await db.tasks.add({ ...data, projectId, order, createdAt: now, updatedAt: now })
      const task = (await db.tasks.get(id))!
      broadcast({ type: 'TASK_UPDATED', taskId: id as ID })
      return ok(task)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async update(taskId: ID, changes: Partial<Task>): Promise<Result<Task>> {
    try {
      await db.tasks.update(taskId, { ...changes, updatedAt: new Date() })
      const task = await db.tasks.get(taskId)
      if (!task) return err('NOT_FOUND')
      broadcast({ type: 'TASK_UPDATED', taskId })
      return ok(task)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async complete(taskId: ID): Promise<Result<void>> {
    try {
      await db.transaction('rw', db.tasks, db.taskRecurrence, db.timeEntries, db.userConfig, async () => {
        const task = await db.tasks.get(taskId)
        if (!task) throw new Error('NOT_FOUND')

        // Invariante: task done → completedAt obrigatório
        await db.tasks.update(taskId, { status: 'done', completedAt: new Date(), updatedAt: new Date() })

        // Para o timer se estiver ativo
        const config = await db.userConfig.get(1)
        if (config?.activeTimerTaskId === taskId) {
          await TimerService._stopEntry(taskId)
          await db.userConfig.update(1, { activeTimerTaskId: undefined })
        }

        // Recorrência: gerar próxima ocorrência
        const recurrence = await db.taskRecurrence.where('taskId').equals(taskId).first()
        if (recurrence && task.dueAt) {
          const nextDue = nextDate(new Date(task.dueAt), recurrence)
          if (nextDue) {
            await db.tasks.add({
              ...task,
              id: undefined,
              status: 'todo',
              completedAt: undefined,
              dueAt: nextDue,
              myDay: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
      })
      broadcast({ type: 'TASK_UPDATED', taskId })
      return ok(undefined)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async delete(taskId: ID): Promise<Result<void>> {
    try {
      const tables = [db.tasks, db.timeEntries, db.comments, db.taskTags, db.taskRecurrence, db.userConfig]
      await db.transaction('rw', tables, async () => {
        const config = await db.userConfig.get(1)
        if (config?.activeTimerTaskId === taskId) {
          await TimerService._stopEntry(taskId)
          await db.userConfig.update(1, { activeTimerTaskId: undefined })
        }
        // Delete cascade em subtasks
        const subtasks = await db.tasks.where('parentId').equals(taskId).toArray()
        for (const sub of subtasks) {
          if (sub.id) await TaskUseCases.delete(sub.id)
        }
        await db.timeEntries.where('taskId').equals(taskId).delete()
        await db.comments.where('taskId').equals(taskId).delete()
        await db.taskTags.where('taskId').equals(taskId).delete()
        await db.taskRecurrence.where('taskId').equals(taskId).delete()
        await db.tasks.delete(taskId)
      })
      return ok(undefined)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async setTags(taskId: ID, tagIds: ID[]): Promise<Result<void>> {
    try {
      await db.transaction('rw', db.taskTags, async () => {
        await db.taskTags.where('taskId').equals(taskId).delete()
        for (const tagId of tagIds) {
          await db.taskTags.add({ taskId, tagId })
        }
      })
      return ok(undefined)
    } catch (e) {
      return err('DB_ERROR', String(e))
    }
  },

  async getTagIds(taskId: ID): Promise<ID[]> {
    const rows = await db.taskTags.where('taskId').equals(taskId).toArray()
    return rows.map(r => r.tagId)
  },
}

function nextDate(base: Date, r: TaskRecurrence): Date | null {
  if (r.type === 'daily') return addDays(base, r.interval)
  if (r.type === 'weekly') return addWeeks(base, r.interval)
  if (r.type === 'monthly') return addMonths(base, r.interval)
  return null
}
