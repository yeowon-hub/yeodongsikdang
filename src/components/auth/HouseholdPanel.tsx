import { useState } from 'react'
import { Copy, Check, Users, Home, UserPlus } from 'lucide-react'
import { useHousehold } from '@/contexts/HouseholdContext'

export function HouseholdPanel() {
  const { household, loading, error, createHousehold, joinHousehold, clearError } = useHousehold()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [familyName, setFamilyName] = useState('우리 집')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    clearError()
    await createHousehold(familyName)
    setSubmitting(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setSubmitting(true)
    clearError()
    await joinHousehold(inviteCode)
    setSubmitting(false)
  }

  const handleCopyCode = async () => {
    if (!household?.inviteCode) return
    await navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !household) {
    return (
      <div className="px-4 pb-8">
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          가족 정보 불러오는 중...
        </div>
      </div>
    )
  }

  if (household) {
    return (
      <div className="px-4 pb-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users size={20} className="text-brand" />
            <h3 className="text-lg font-bold text-gray-800">가족 공유</h3>
          </div>

          <div className="space-y-3 rounded-xl bg-fridge/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">가족 이름</span>
              <span className="text-sm font-semibold text-gray-800">{household.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">내 역할</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {household.role === 'owner' ? '만든 사람' : '구성원'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">구성원</span>
              <span className="text-sm font-medium text-gray-800">{household.memberCount}명</span>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs text-gray-500">가족 초대 코드 (공유해서 참가시키세요)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-800">
                {household.inviteCode}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 active:scale-95"
                aria-label="초대 코드 복사"
              >
                {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            같은 가족에 속한 계정은 냉장고 재료와 내 레시피가 자동으로 동기화됩니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users size={20} className="text-brand" />
          <h3 className="text-lg font-bold text-gray-800">가족 공유 설정</h3>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          가족을 만들거나 초대 코드로 참가하면 여러 기기에서 같은 재료·레시피를 공유할 수 있어요.
        </p>

        <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('create')
              clearError()
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'create' ? 'bg-white text-brand shadow-sm' : 'text-gray-500'
            }`}
          >
            <Home size={16} />
            가족 만들기
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join')
              clearError()
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'join' ? 'bg-white text-brand shadow-sm' : 'text-gray-500'
            }`}
          >
            <UserPlus size={16} />
            코드로 참가
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">가족 이름</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="우리 집"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                maxLength={30}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? '만드는 중...' : '가족 만들기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">초대 코드</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold tracking-widest uppercase"
                maxLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || inviteCode.trim().length < 6}
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? '참가 중...' : '가족 참가하기'}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}
