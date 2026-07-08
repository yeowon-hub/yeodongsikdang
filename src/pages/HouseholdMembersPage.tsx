import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, User, Users } from 'lucide-react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useAuth } from '@/hooks/useSync'
import { supabase } from '@/lib/supabase'
import type { HouseholdMember } from '@/types'

function parseMember(row: Record<string, unknown>): HouseholdMember {
  const fallbackEmail = (row.email as string | undefined) ?? ''
  return {
    id: row.id as string,
    name: (row.name as string | undefined) || fallbackEmail.split('@')[0] || '구성원',
    email: fallbackEmail,
    role: row.role === 'owner' ? 'owner' : 'member',
    joinedAt: (row.joined_at as string | undefined) ?? '',
  }
}

function formatMemberError(err: unknown) {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = String((err as { message?: unknown }).message ?? '')
    if (
      message.includes('list_household_members') ||
      message.includes('Could not find the function')
    ) {
      return 'Supabase SQL Editor에서 최신 setup_household.sql 또는 007_household_members.sql을 실행해주세요.'
    }
    return message
  }
  return err instanceof Error ? err.message : '구성원 정보를 불러오지 못했습니다.'
}

export function HouseholdMembersPage() {
  const { user } = useAuth()
  const { household, loading: householdLoading } = useHousehold()
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMembers() {
      if (!supabase || !user || !household) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const { data, error: rpcError } = await supabase.rpc('list_household_members')
        if (rpcError) throw rpcError

        const rows = Array.isArray(data) ? data : []
        if (!cancelled) {
          setMembers(rows.map((row) => parseMember(row as Record<string, unknown>)))
        }
      } catch (err) {
        console.error('Household members fetch error:', err)
        if (!cancelled) setError(formatMemberError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMembers()

    return () => {
      cancelled = true
    }
  }, [user, household])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-header/10 px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm"
          aria-label="계정으로 돌아가기"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-gray-800">구성원 정보</h2>
          <p className="text-xs text-gray-500">가족 공유에 참여한 계정 목록</p>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          로그인 후 구성원 정보를 볼 수 있어요.
        </div>
      ) : householdLoading || loading ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          구성원 정보를 불러오는 중...
        </div>
      ) : !household ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          아직 가족 공유가 설정되지 않았어요.
          <br />
          계정 화면에서 가족을 만들거나 초대 코드로 참가해주세요.
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-red-500 shadow-sm">{error}</div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users size={19} className="text-header-text" />
              <p className="font-semibold text-gray-800">{household.name}</p>
              <span className="ml-auto rounded-full bg-header/15 px-2 py-0.5 text-xs font-semibold text-header-text">
                {members.length}명
              </span>
            </div>
          </div>

          {members.map((member) => {
            const isMe = member.id === user.id
            return (
              <div key={member.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-header/15 text-header-text">
                    <User size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-semibold text-gray-800">{member.name}</p>
                      {isMe && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                          나
                        </span>
                      )}
                      <span className="rounded-full bg-header/10 px-2 py-0.5 text-[10px] font-semibold text-header-text">
                        {member.role === 'owner' ? '만든 사람' : '구성원'}
                      </span>
                    </div>
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-gray-500">
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate">{member.email || '이메일 없음'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
