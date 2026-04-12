import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { TimeBlockType, ID } from '@/entities'

export const useTimeBlockTypesStore = defineStore('timeBlockTypes', () => {
  const types = ref<TimeBlockType[]>([])

  async function load() {
    types.value = await db.timeBlockTypes.orderBy('createdAt').toArray()
  }

  async function add(data: Pick<TimeBlockType, 'name' | 'color'>) {
    const id = await db.timeBlockTypes.add({ ...data, createdAt: new Date() })
    const saved = await db.timeBlockTypes.get(id)
    if (saved) types.value.push(saved)
  }

  async function update(id: ID, changes: Partial<Pick<TimeBlockType, 'name' | 'color'>>) {
    await db.timeBlockTypes.update(id, changes)
    const idx = types.value.findIndex(t => t.id === id)
    if (idx !== -1) Object.assign(types.value[idx], changes)
  }

  async function remove(id: ID) {
    await db.timeBlockTypes.delete(id)
    types.value = types.value.filter(t => t.id !== id)
  }

  return { types, load, add, update, remove }
})
