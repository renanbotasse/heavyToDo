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
