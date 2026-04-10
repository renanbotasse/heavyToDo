import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Tag, ID } from '@/entities'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])

  async function load() {
    tags.value = await db.tags.orderBy('name').toArray()
  }

  async function add(name: string, color: string) {
    const id = await db.tags.add({ name, color })
    tags.value.push((await db.tags.get(id))!)
  }

  async function remove(id: ID) {
    await db.taskTags.where('tagId').equals(id).delete()
    await db.tags.delete(id)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  function getById(id: ID) { return tags.value.find(t => t.id === id) }

  return { tags, load, add, remove, getById }
})
