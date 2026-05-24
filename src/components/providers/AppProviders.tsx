import { useAuth } from '@/hooks/useSync'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useSync } from '@/hooks/useSync'

function SyncInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  useSync(user, household?.id ?? null)
  return <>{children}</>
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <HouseholdProvider user={user}>
      <SyncInner>{children}</SyncInner>
    </HouseholdProvider>
  )
}
