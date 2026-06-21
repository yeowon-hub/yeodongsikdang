import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface GlobalAddFabContextValue {
  suppressed: boolean
  acquireSuppress: () => () => void
}

const GlobalAddFabContext = createContext<GlobalAddFabContextValue | null>(null)

export function GlobalAddFabProvider({ children }: { children: ReactNode }) {
  const [suppressCount, setSuppressCount] = useState(0)

  const acquireSuppress = useCallback(() => {
    setSuppressCount((count) => count + 1)
    return () => setSuppressCount((count) => Math.max(0, count - 1))
  }, [])

  const value = useMemo(
    () => ({
      suppressed: suppressCount > 0,
      acquireSuppress,
    }),
    [suppressCount, acquireSuppress],
  )

  return <GlobalAddFabContext.Provider value={value}>{children}</GlobalAddFabContext.Provider>
}

export function useSuppressGlobalAddFab(active: boolean) {
  const ctx = useContext(GlobalAddFabContext)
  const acquireSuppress = ctx?.acquireSuppress

  useEffect(() => {
    if (!active || !acquireSuppress) return
    return acquireSuppress()
  }, [active, acquireSuppress])
}

export function useGlobalAddFabSuppressed() {
  return useContext(GlobalAddFabContext)?.suppressed ?? false
}
