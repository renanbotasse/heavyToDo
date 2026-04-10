export type ID = number

export interface Project {
  id?: ID
  name: string
  color: string
  isDefault: boolean
  createdAt: Date
}

export interface Task {
  id?: ID
  title: string
  description?: string        // Tiptap JSON serializado
  projectId: ID
  parentId?: ID               // se for subtask
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  priority: 'none' | 'low' | 'medium' | 'high'
  dueAt?: Date                // UTC
  timeEstimateMin?: number
  myDay: boolean
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface Comment {
  id?: ID
  taskId: ID
  text: string
  createdAt: Date
}

export interface Tag {
  id?: ID
  name: string
  color: string
}

export interface TaskTag {
  id?: ID
  taskId: ID
  tagId: ID
}

export interface TaskRecurrence {
  id?: ID
  taskId: ID
  type: 'daily' | 'weekly' | 'monthly'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  lastGeneratedAt?: Date
}

export interface Doc {
  id?: ID
  projectId: ID
  title: string
  content?: string            // Tiptap JSON serializado
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id?: ID
  taskId: ID
  startedAt: Date
  endedAt?: Date
}

export interface UserConfig {
  id: 1
  defaultProjectId: ID
  activeTimerTaskId?: ID
  theme: 'dark'
  workingHours?: { start: string; end: string }
}
