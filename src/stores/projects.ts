import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Project, ID } from '@/entities'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])

  function sortInPlace() {
    projects.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  async function load() {
    projects.value = await db.projects.orderBy('order').toArray()
  }

  async function add(name: string, color: string) {
    const nextOrder = projects.value.length
    const id = await db.projects.add({ name, color, isDefault: false, order: nextOrder, createdAt: new Date() })
    projects.value.push((await db.projects.get(id))!)
  }

  async function update(id: ID, changes: Partial<Project>) {
    await db.projects.update(id, changes)
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) Object.assign(projects.value[idx], changes)
  }

  async function remove(id: ID) {
    const p = projects.value.find(p => p.id === id)
    if (!p || p.isDefault) return
    const def = projects.value.find(p => p.isDefault)
    if (def?.id) await db.tasks.where('projectId').equals(id).modify({ projectId: def.id })
    await db.docs.where('projectId').equals(id).delete()
    await db.projects.delete(id)
    projects.value = projects.value.filter(p => p.id !== id)
    // Recompact order values after removal
    projects.value.forEach((p, i) => { p.order = i })
    await db.transaction('rw', db.projects, async () => {
      for (let i = 0; i < projects.value.length; i++) {
        await db.projects.update(projects.value[i].id!, { order: i })
      }
    })
  }

  async function reorder(orderedIds: ID[]) {
    await db.transaction('rw', db.projects, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.projects.update(orderedIds[i], { order: i })
      }
    })
    orderedIds.forEach((id, i) => {
      const p = projects.value.find(p => p.id === id)
      if (p) p.order = i
    })
    sortInPlace()
  }

  function getById(id: ID) { return projects.value.find(p => p.id === id) }
  function getDefault() { return projects.value.find(p => p.isDefault) }

  return { projects, load, add, update, remove, reorder, getById, getDefault }
})
