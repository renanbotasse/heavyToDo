export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVARIANT_VIOLATION'
  | 'DB_ERROR'
  | 'CONCURRENCY_ERROR'

export class DomainError extends Error {
  constructor(public code: DomainErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'DomainError'
  }
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: DomainError }

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function err(code: DomainErrorCode, message?: string): Result<never> {
  return { ok: false, error: new DomainError(code, message) }
}
