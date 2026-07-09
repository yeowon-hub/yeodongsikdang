import { createContext, useContext, useEffect } from 'react'
import { useAuth } from '@/hooks/useSync'
import { useHousehold, getActiveHouseholdId } from '@/contexts/HouseholdContext'
import { useSync } from '@/hooks/useSync'
import { onSyncRequested } from '@/lib/syncEvents'

interface SyncContextValue {
  sync: (options?: { force?: boolean }) => Promise<void>
  syncing: boolean
  lastSynced: Date | null
  lastSyncError: string | null
  syncStats: import('@/lib/householdSync').SyncStats | null
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { household, loading: householdLoading } = useHousehold()
  const activeHouseholdId = household?.id ?? getActiveHouseholdId()
  const { sync, syncing, lastSynced, lastSyncError, syncStats } = useSync(
    user,
    activeHouseholdId ?? null,
    householdLoading && !activeHouseholdId,
  )

  useEffect(() => onSyncRequested((force) => void sync(force ? { force: true } : undefined)), [sync])

  return (
    <SyncContext.Provider value={{ sync, syncing, lastSynced, lastSyncError, syncStats }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSyncTrigger() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSyncTrigger must be used within SyncProvider')
  return ctx
}
