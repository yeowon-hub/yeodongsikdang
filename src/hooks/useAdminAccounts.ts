import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminUserAccount } from '@/types'

function parseAdminUser(row: Record<string, unknown>): AdminUserAccount {
  return {
    id: row.id as string,
    email: (row.email as string) || null,
    displayName: (row.display_name as string) || null,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at as string,
    lastSignInAt: (row.last_sign_in_at as string) || null,
    householdName: (row.household_name as string) || null,
  }
}

function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: string }).message)
  }
  if (err instanceof Error) return err.message
  return '오류가 발생했습니다'
}

export function useAdminAccounts() {
  const [users, setUsers] = useState<AdminUserAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase) return

    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_list_users')
      if (rpcError) throw rpcError

      const rows = Array.isArray(data)
        ? data
        : typeof data === 'string'
          ? JSON.parse(data)
          : data && typeof data === 'object'
            ? [data]
            : []
      setUsers((rows as Record<string, unknown>[]).map(parseAdminUser))
    } catch (err) {
      console.error('admin_list_users error:', err)
      setError(getErrorMessage(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const setAdmin = useCallback(async (userId: string, grantAdmin: boolean) => {
    if (!supabase) return false

    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('admin_set_admin', {
        target_user_id: userId,
        grant_admin: grantAdmin,
      })
      if (rpcError) throw rpcError
      await refresh()
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    }
  }, [refresh])

  const deleteUser = useCallback(async (userId: string) => {
    if (!supabase) return false

    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
      })
      if (rpcError) throw rpcError
      await refresh()
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    }
  }, [refresh])

  return { users, loading, error, refresh, setAdmin, deleteUser, clearError: () => setError(null) }
}
