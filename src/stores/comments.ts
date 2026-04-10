import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Comment, ID } from '@/entities'

export const useCommentsStore = defineStore('comments', () => {
  const commentsByTask = ref<Record<number, Comment[]>>({})

  async function loadForTask(taskId: ID) {
    commentsByTask.value[taskId] = await db.comments.where('taskId').equals(taskId).sortBy('createdAt')
  }

  async function add(taskId: ID, text: string) {
    const id = await db.comments.add({ taskId, text, createdAt: new Date() })
    const comment = (await db.comments.get(id))!
    if (!commentsByTask.value[taskId]) commentsByTask.value[taskId] = []
    commentsByTask.value[taskId].push(comment)
  }

  async function remove(taskId: ID, commentId: ID) {
    await db.comments.delete(commentId)
    if (commentsByTask.value[taskId]) {
      commentsByTask.value[taskId] = commentsByTask.value[taskId].filter(c => c.id !== commentId)
    }
  }

  function getForTask(taskId: ID): Comment[] {
    return commentsByTask.value[taskId] ?? []
  }

  return { commentsByTask, loadForTask, add, remove, getForTask }
})
