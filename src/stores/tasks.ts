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
    tasks.value = await db.tasks.orderBy('createdAt').reverse().toArray()
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
    if (result.ok) tasks.value.unshift(result.data)
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

  function getSubtasks(parentId: ID) { return tasks.value.filter(t => t.parentId === parentId) }
  function getByProject(projectId: ID) { return rootTasks.value.filter(t => t.projectId === projectId) }
  function getMyDay() { return rootTasks.value.filter(t => t.myDay && t.status !== 'archived') }
  function getInbox() { return rootTasks.value.filter(t => !t.dueAt && t.status !== 'done' && t.status !== 'archived') }

  // Sincroniza com outras abas
  onMessage(async msg => {
    if (msg.type === 'TASK_UPDATED') await reload(msg.taskId)
  })

  return { tasks, rootTasks, load, add, update, complete, remove, toggleMyDay, getSubtasks, getByProject, getMyDay, getInbox }
})
