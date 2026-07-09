import { useAuth } from '@/hooks/useSync'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
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
    <ProfileProvider user={user}>
      <HouseholdProvider user={user}>
        <SyncInner>{children}</SyncInner>
      </HouseholdProvider>
    </ProfileProvider>
  )
}
