import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Project, ID } from '@/entities'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])

  async function load() {
    projects.value = await db.projects.orderBy('id').toArray()
  }

  async function add(name: string, color: string) {
    const id = await db.projects.add({ name, color, isDefault: false, createdAt: new Date() })
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
  }

  function getById(id: ID) { return projects.value.find(p => p.id === id) }
  function getDefault() { return projects.value.find(p => p.isDefault) }

  return { projects, load, add, update, remove, getById, getDefault }
})
