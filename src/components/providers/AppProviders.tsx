import { useAuth } from '@/hooks/useSync'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { SyncProvider } from '@/contexts/SyncContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <ProfileProvider user={user}>
      <HouseholdProvider user={user}>
        <SyncProvider>{children}</SyncProvider>
      </HouseholdProvider>
    </ProfileProvider>
  )
}
