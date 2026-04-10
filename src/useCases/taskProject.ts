import type { ID } from '@/entities'

export function resolveCreateProjectId(inputProjectId?: ID, defaultProjectId?: ID): ID | undefined {
  return inputProjectId ?? defaultProjectId
}
