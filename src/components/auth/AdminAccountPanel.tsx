import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Trash2, RefreshCw, ChevronLeft, UserCog } from 'lucide-react'
import { useAuth } from '@/hooks/useSync'
import { useAdminAccounts } from '@/hooks/useAdminAccounts'
import { useProfile } from '@/contexts/ProfileContext'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayLabel(email: string | null, displayName: string | null) {
  return displayName || email || '이름 없음'
}

interface AdminAccountPanelProps {
  embedded?: boolean
  onBack?: () => void
}

export function AdminAccountPanel({ embedded = false, onBack }: AdminAccountPanelProps) {
  const { user } = useAuth()
  const { profile, refresh: refreshProfile } = useProfile()
  const { users, loading, error, refresh, setAdmin, deleteUser, clearError } = useAdminAccounts()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.isAdmin) {
      refresh()
      refreshProfile()
    }
  }, [profile?.isAdmin, refresh, refreshProfile])

  if (!profile?.isAdmin) return null

  const otherAdmins = users.filter((account) => account.isAdmin && account.id !== user?.id)
  const hasDelegateAdmin = otherAdmins.length >= 1

  const handleToggleAdmin = async (userId: string, next: boolean) => {
    setPendingId(userId)
    clearError()
    await setAdmin(userId, next)
    await refreshProfile()
    setPendingId(null)
  }

  const handleDelete = async (userId: string) => {
    setPendingId(userId)
    clearError()
    const ok = await deleteUser(userId)
    setPendingId(null)
    if (ok) setConfirmDeleteId(null)
  }

  const canGrantAdmin = (accountId: string, isAdmin: boolean) => {
    if (isAdmin) return true
    if (accountId === user?.id) return false
    if (!hasDelegateAdmin) return true
    return otherAdmins.some((admin) => admin.id === accountId)
  }

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-header-text"
    >
      <ChevronLeft size={18} />
      계정으로 돌아가기
    </button>
  ) : (
    <Link
      to="/account"
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-header-text"
    >
      <ChevronLeft size={18} />
      계정으로 돌아가기
    </Link>
  )

  const content = (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-header-text" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">계정 관리</h3>
            <p className="text-xs text-gray-500">
              본인 외 1명에게만 관리권한을 부여할 수 있어요
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-header/30 text-header-text hover:bg-header/10 disabled:opacity-50"
          aria-label="새로고침"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {loading && users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">회원 목록 불러오는 중...</p>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">등록된 회원이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {users.map((account) => {
            const isSelf = account.id === user?.id
            const isPending = pendingId === account.id
            const isConfirmingDelete = confirmDeleteId === account.id
            const grantAllowed = canGrantAdmin(account.id, account.isAdmin)

            return (
              <div
                key={account.id}
                className="rounded-xl border border-gray-100 bg-header/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {displayLabel(account.email, account.displayName)}
                      </p>
                      {account.isAdmin && (
                        <span className="rounded-full bg-header/25 px-2 py-0.5 text-[10px] font-semibold text-header-text">
                          관리자
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          나
                        </span>
                      )}
                    </div>
                    {account.email && account.displayName && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">{account.email}</p>
                    )}
                    <div className="mt-2 space-y-0.5 text-[11px] text-gray-500">
                      <p>가입: {formatDate(account.createdAt)}</p>
                      <p>최근 로그인: {formatDate(account.lastSignInAt)}</p>
                      {account.householdName && <p>가족: {account.householdName}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  {!isSelf && (
                    <button
                      type="button"
                      disabled={isPending || !grantAllowed}
                      onClick={() => handleToggleAdmin(account.id, !account.isAdmin)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                        account.isAdmin
                          ? 'border border-header/30 bg-white text-header-text'
                          : 'bg-header text-header-text'
                      }`}
                    >
                      <UserCog size={14} />
                      {isPending
                        ? '처리 중...'
                        : account.isAdmin
                          ? '관리권한 해제'
                          : '관리권한 부여'}
                    </button>
                  )}

                  {!isSelf && !grantAllowed && !account.isAdmin && (
                    <span className="text-[11px] text-gray-500">
                      이미 다른 관리자가 지정되어 있어요
                    </span>
                  )}

                  {!isSelf && (
                    <>
                      {isConfirmingDelete ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-red-600">정말 삭제할까요?</span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(account.id)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                          >
                            삭제
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(account.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          계정 삭제
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div className="pb-8">
        {backButton}
        {content}
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-header/10 px-4 py-6">
      {backButton}
      {content}
    </div>
  )
}
