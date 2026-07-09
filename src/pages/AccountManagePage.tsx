import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useSync'
import { useProfile } from '@/contexts/ProfileContext'
import { AdminAccountPanel } from '@/components/auth/AdminAccountPanel'

export function AccountManagePage() {
  const { user, isConfigured } = useAuth()
  const { profile, loading, refresh } = useProfile()

  if (!isConfigured || !user) {
    return <Navigate to="/account" replace />
  }

  if (loading && !profile) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-header/10 px-4 py-8 text-center text-sm text-gray-500">
        권한 확인 중...
      </div>
    )
  }

  if (!profile?.isAdmin) {
    refresh()
    return <Navigate to="/account" replace />
  }

  return <AdminAccountPanel />
}
