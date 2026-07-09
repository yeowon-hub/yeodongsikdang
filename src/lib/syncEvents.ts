const SYNC_REQUEST_EVENT = 'yeodong:request-sync'

export function requestSync(options?: { force?: boolean }) {
  window.dispatchEvent(
    new CustomEvent(SYNC_REQUEST_EVENT, { detail: { force: options?.force ?? false } }),
  )
}

export function onSyncRequested(handler: (force: boolean) => void) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ force?: boolean }>).detail
    handler(detail?.force ?? false)
  }
  window.addEventListener(SYNC_REQUEST_EVENT, listener)
  return () => window.removeEventListener(SYNC_REQUEST_EVENT, listener)
}
