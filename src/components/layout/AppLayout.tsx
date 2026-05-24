import { Outlet, Link } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { useAuth } from '@/hooks/useSync'
import { User, LogIn } from 'lucide-react'

export function AppLayout() {
  const { user, isConfigured } = useAuth()

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-brand">여동식당</h1>
            <p className="text-xs text-gray-500">나만의 주방, 나만의 레시피</p>
          </div>
          {isConfigured && (
            <Link
              to="/account"
              className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
            >
              {user ? (
                <>
                  <User size={14} />
                  <span className="max-w-[80px] truncate">{user.email?.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  로그인
                </>
              )}
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col min-h-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
