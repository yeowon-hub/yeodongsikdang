import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface ProfileContextValue {
  profile: UserProfile | null
  loading: boolean
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function parseProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: (row.email as string) || null,
    displayName: (row.display_name as string) || null,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at as string,
  }
}

export function ProfileProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_my_profile')
      if (!error && data) {
        const row = typeof data === 'string' ? JSON.parse(data) : data
        setProfile(parseProfile(row as Record<string, unknown>))
        return
      }

      const { data: row, error: tableError } = await supabase
        .from('profiles')
        .select('id, email, display_name, is_admin, created_at')
        .eq('id', user.id)
        .maybeSingle()

      if (!tableError && row) {
        setProfile(parseProfile(row))
        return
      }

      const { data: isAdminFlag } = await supabase.rpc('is_admin')
      if (isAdminFlag) {
        setProfile({
          id: user.id,
          email: user.email ?? null,
          displayName:
            (user.user_metadata?.nickname as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            user.email?.split('@')[0] ??
            null,
          isAdmin: true,
          createdAt: user.created_at ?? new Date().toISOString(),
        })
        return
      }

      setProfile(null)
    } catch (err) {
      console.error('Profile load error:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
