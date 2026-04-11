import Dexie, { type Table } from 'dexie'
import type {
  Project, Task, Comment, Doc, TimeEntry,
  Tag, TaskTag, TaskRecurrence, UserConfig,
} from '@/entities'

class AppDB extends Dexie {
  projects!: Table<Project>
  tasks!: Table<Task>
  comments!: Table<Comment>
  docs!: Table<Doc>
  timeEntries!: Table<TimeEntry>
  tags!: Table<Tag>
  taskTags!: Table<TaskTag>
  taskRecurrence!: Table<TaskRecurrence>
  userConfig!: Table<UserConfig>

  constructor() {
    super('prodapp')
    this.version(1).stores({
      projects:       '++id, name, isDefault',
      tasks:          '++id, projectId, parentId, status, myDay, dueAt, createdAt, updatedAt, [projectId+status], [dueAt+status]',
      comments:       '++id, taskId, createdAt',
      docs:           '++id, projectId, updatedAt',
      timeEntries:    '++id, taskId, startedAt, [taskId+startedAt]',
      tags:           '++id, name',
      taskTags:       '++id, taskId, tagId',
      taskRecurrence: '++id, taskId',
      userConfig:     '++id',
    })
    this.version(2).stores({
      projects:       '++id, name, isDefault, order',
      tasks:          '++id, projectId, parentId, status, myDay, dueAt, createdAt, updatedAt, order, [projectId+status], [dueAt+status]',
    }).upgrade(async tx => {
      const projects = await tx.table('projects').toArray()
      for (let i = 0; i < projects.length; i++) {
        await tx.table('projects').update(projects[i].id, { order: i })
      }
      const tasks = await tx.table('tasks').toArray()
      // Group root tasks by project, subtasks by parent — assign sequential order within each group
      const groups = new Map<string, number[]>()
      for (const t of tasks) {
        const key = t.parentId ? `p:${t.parentId}` : `r:${t.projectId}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(t.id)
      }
      for (const ids of groups.values()) {
        for (let i = 0; i < ids.length; i++) {
          await tx.table('tasks').update(ids[i], { order: i })
        }
      }
    })
  }
}

export const db = new AppDB()

/** Seed inicial — "No Project" + UserConfig */
export async function seedDefaults() {
  const all = await db.projects.toArray()
  const existing = all.find(p => p.isDefault)
  let defaultProjectId: number

  if (!existing) {
    defaultProjectId = (await db.projects.add({
      name: 'No Project',
      color: '#6b7280',
      isDefault: true,
      order: 0,
      createdAt: new Date(),
    })) as number
  } else {
    defaultProjectId = existing.id!
    // Keep the default project label consistent across older databases.
    if (existing.name !== 'No Project') {
      await db.projects.update(existing.id!, { name: 'No Project' })
    }
  }

  const config = await db.userConfig.get(1)
  if (!config) {
    await db.userConfig.add({ id: 1, defaultProjectId, theme: 'dark' })
  }
}
