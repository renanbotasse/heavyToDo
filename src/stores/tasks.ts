import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { TaskUseCases } from '@/useCases/tasks'
import { onMessage } from '@/services/broadcast'
import type { Task, ID } from '@/entities'

type TaskCreateInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'> & { projectId?: ID }

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])

  const rootTasks = computed(() => tasks.value.filter(t => !t.parentId))

  async function load() {
    tasks.value = await db.tasks.orderBy('order').toArray()
  }

  async function reload(taskId: ID) {
    const updated = await db.tasks.get(taskId)
    if (!updated) {
      tasks.value = tasks.value.filter(t => t.id !== taskId)
      return
    }
    const idx = tasks.value.findIndex(t => t.id === taskId)
    if (idx !== -1) tasks.value[idx] = updated
    else tasks.value.unshift(updated)
  }

  async function add(data: TaskCreateInput) {
    const result = await TaskUseCases.create(data)
    if (result.ok) tasks.value.push(result.data)
    return result
  }

  async function update(id: ID, changes: Partial<Task>) {
    const result = await TaskUseCases.update(id, changes)
    if (result.ok) {
      const idx = tasks.value.findIndex(t => t.id === id)
      if (idx !== -1) tasks.value[idx] = result.data
    }
    return result
  }

  async function complete(id: ID) {
    const result = await TaskUseCases.complete(id)
    if (result.ok) await reload(id)
    return result
  }

  async function remove(id: ID) {
    const result = await TaskUseCases.delete(id)
    if (result.ok) tasks.value = tasks.value.filter(t => t.id !== id && t.parentId !== id)
    return result
  }

  async function toggleMyDay(id: ID) {
    const task = tasks.value.find(t => t.id === id)
    if (task) await update(id, { myDay: !task.myDay })
  }

  // Reorder root tasks within a project
  async function reorderInProject(orderedIds: ID[]) {
    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.tasks.update(orderedIds[i], { order: i })
      }
    })
    orderedIds.forEach((id, i) => {
      const t = tasks.value.find(t => t.id === id)
      if (t) t.order = i
    })
  }

  // Reorder subtasks within a parent
  async function reorderSubtasks(orderedIds: ID[]) {
    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.tasks.update(orderedIds[i], { order: i })
      }
    })
    orderedIds.forEach((id, i) => {
      const t = tasks.value.find(t => t.id === id)
      if (t) t.order = i
    })
  }

  // Move task to a specific 1-based position within its project
  async function moveToPosition(taskId: ID, newPosition: number) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    const siblings = getByProject(task.projectId)
    const fromIdx = siblings.findIndex(t => t.id === taskId)
    if (fromIdx === -1) return
    const toIdx = Math.max(0, Math.min(newPosition - 1, siblings.length - 1))
    if (fromIdx === toIdx) return
    const reordered = [...siblings]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    await reorderInProject(reordered.map(t => t.id!))
  }

  function getSubtasks(parentId: ID) {
    return tasks.value
      .filter(t => t.parentId === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  function getByProject(projectId: ID) {
    return rootTasks.value
      .filter(t => t.projectId === projectId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  function getMyDay() { return rootTasks.value.filter(t => t.myDay && t.status !== 'archived') }
  function getInbox() { return rootTasks.value.filter(t => !t.dueAt && t.status !== 'done' && t.status !== 'archived') }

  // Returns 1-based position of task within its project
  function getPositionInProject(taskId: ID): number {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return 0
    const siblings = getByProject(task.projectId)
    return siblings.findIndex(t => t.id === taskId) + 1
  }

  // Sincroniza com outras abas
  onMessage(async msg => {
    if (msg.type === 'TASK_UPDATED') await reload(msg.taskId)
  })

  return {
    tasks, rootTasks, load, add, update, complete, remove, toggleMyDay,
    reorderInProject, reorderSubtasks, moveToPosition,
    getSubtasks, getByProject, getMyDay, getInbox, getPositionInProject,
  }
})
