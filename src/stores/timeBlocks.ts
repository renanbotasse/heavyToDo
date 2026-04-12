import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { TimeBlock, ID } from '@/entities'

export const useTimeBlocksStore = defineStore('timeBlocks', () => {
  const blocks = ref<TimeBlock[]>([])

  async function load() {
    blocks.value = await db.timeBlocks.orderBy('startAt').toArray()
  }

  async function add(data: Omit<TimeBlock, 'id' | 'createdAt'>) {
    const id = await db.timeBlocks.add({ ...data, createdAt: new Date() })
    const saved = await db.timeBlocks.get(id)
    if (saved) {
      blocks.value.push(saved)
      blocks.value.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    }
  }

  async function update(id: ID, changes: Partial<TimeBlock>) {
    await db.timeBlocks.update(id, changes)
    const idx = blocks.value.findIndex(b => b.id === id)
    if (idx !== -1) Object.assign(blocks.value[idx], changes)
  }

  async function remove(id: ID) {
    await db.timeBlocks.delete(id)
    blocks.value = blocks.value.filter(b => b.id !== id)
  }

  return { blocks, load, add, update, remove }
})
