import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Household } from '@/types'

const ACTIVE_HOUSEHOLD_KEY = 'yeodong_active_household_id'

interface HouseholdContextValue {
  household: Household | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createHousehold: (name: string) => Promise<Household | null>
  joinHousehold: (code: string) => Promise<Household | null>
  clearError: () => void
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

function parseHousehold(data: Record<string, unknown>): Household {
  return {
    id: data.id as string,
    name: data.name as string,
    inviteCode: data.invite_code as string,
    role: data.role as Household['role'],
    memberCount: (data.member_count as number) ?? 1,
  }
}

export function HouseholdProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setHousehold(null)
      return
    }

    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('get_my_household')
      if (rpcError) throw rpcError

      if (data && typeof data === 'object') {
        const parsed = parseHousehold(data as Record<string, unknown>)
        setHousehold(parsed)
        localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, parsed.id)
      } else {
        setHousehold(null)
        localStorage.removeItem(ACTIVE_HOUSEHOLD_KEY)
      }
    } catch (err) {
      console.error('Household fetch error:', err)
      setError(err instanceof Error ? err.message : '가족 정보를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createHousehold = useCallback(
    async (name: string) => {
      if (!supabase || !user) return null
      setError(null)
      setLoading(true)
      try {
        const { data, error: rpcError } = await supabase.rpc('create_household', {
          household_name: name.trim() || '우리 집',
        })
        if (rpcError) throw rpcError
        if (!data || typeof data !== 'object') return null

        const parsed = parseHousehold(data as Record<string, unknown>)
        setHousehold(parsed)
        localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, parsed.id)
        return parsed
      } catch (err) {
        const message = err instanceof Error ? err.message : '가족 만들기에 실패했습니다'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const joinHousehold = useCallback(
    async (code: string) => {
      if (!supabase || !user) return null
      setError(null)
      setLoading(true)
      try {
        const { data, error: rpcError } = await supabase.rpc('join_household', { code: code.trim() })
        if (rpcError) throw rpcError
        if (!data || typeof data !== 'object') return null

        const parsed = parseHousehold(data as Record<string, unknown>)
        setHousehold(parsed)
        localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, parsed.id)
        return parsed
      } catch (err) {
        const message = err instanceof Error ? err.message : '가족 참가에 실패했습니다'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const clearError = useCallback(() => setError(null), [])

  return (
    <HouseholdContext.Provider
      value={{ household, loading, error, refresh, createHousehold, joinHousehold, clearError }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) {
    throw new Error('useHousehold must be used within HouseholdProvider')
  }
  return ctx
}

export function getActiveHouseholdId(): string | null {
  return localStorage.getItem(ACTIVE_HOUSEHOLD_KEY)
}
