import { describe, expect, it } from 'vitest'
import { resolveCreateProjectId } from './taskProject'

describe('resolveCreateProjectId', () => {
  it('uses explicit input project when provided', () => {
    expect(resolveCreateProjectId(12, 3)).toBe(12)
  })

  it('falls back to default project when input is missing', () => {
    expect(resolveCreateProjectId(undefined, 3)).toBe(3)
  })

  it('returns undefined when no project is available', () => {
    expect(resolveCreateProjectId(undefined, undefined)).toBeUndefined()
  })
})
