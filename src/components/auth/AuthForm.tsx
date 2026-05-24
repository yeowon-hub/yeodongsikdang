import { useState } from 'react'
import { useAuth } from '@/hooks/useSync'
import { HouseholdPanel } from '@/components/auth/HouseholdPanel'
import { LogIn, Mail, Lock } from 'lucide-react'

export function AuthForm() {
  const { user, signIn, signUp, signInWithGoogle, signOut, isConfigured } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isConfigured) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-gray-600">
          Supabase가 설정되지 않았습니다.
          <br />
          .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          설정 없이도 로컬에서 재료와 레시피를 사용할 수 있습니다.
        </p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
          <p className="text-lg font-semibold text-gray-800">로그인됨</p>
          <p className="mt-1 text-sm text-gray-500">{user.email}</p>
          <p className="mt-4 text-xs text-green-600">
            아래에서 가족을 설정하면 여러 기기에서 재료·레시피가 공유됩니다
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-6 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600"
          >
            로그아웃
          </button>
        </div>
        <HouseholdPanel />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } =
        mode === 'login' ? await signIn(email, password) : await signUp(email, password)
      if (authError) setError(authError.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-bold text-gray-800">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h2>
        <p className="mb-6 text-sm text-gray-500">여러 기기에서 데이터를 동기화하세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="mt-3 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700"
        >
          Google로 계속하기
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-medium text-brand"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}
