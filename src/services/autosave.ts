export class AutosaveQueue {
  private timeout: ReturnType<typeof setTimeout> | null = null
  private pendingSave: (() => Promise<void>) | null = null

  schedule(saveFn: () => Promise<void>, delay = 500) {
    if (this.timeout) clearTimeout(this.timeout)
    this.pendingSave = saveFn
    this.timeout = setTimeout(async () => {
      const fn = this.pendingSave
      this.pendingSave = null
      this.timeout = null
      if (fn) await fn()
    }, delay)
  }

  async flush() {
    if (this.timeout) clearTimeout(this.timeout)
    const fn = this.pendingSave
    this.pendingSave = null
    this.timeout = null
    if (fn) await fn()
  }

  cancel() {
    if (this.timeout) clearTimeout(this.timeout)
    this.pendingSave = null
    this.timeout = null
  }
}
