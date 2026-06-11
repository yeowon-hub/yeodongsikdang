import { Outlet, Link } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { GlobalSearch } from './GlobalSearch'
import { useAuth } from '@/hooks/useSync'
import { User, LogIn } from 'lucide-react'

export function AppLayout() {
  const { user, isConfigured } = useAuth()
  const profileName =
    ((user?.user_metadata?.nickname ||
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.preferred_username) as string | undefined) ??
    user?.email?.split('@')[0] ??
    '내 계정'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="z-40 shrink-0 bg-header shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2.5">
          <Link to="/home" className="shrink-0">
            <h1 className="text-base font-extrabold leading-tight tracking-tight text-header-text">
              여동식당
            </h1>
          </Link>
          <GlobalSearch />
          {isConfigured && (
            <Link
              to="/account"
              className="flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2 py-1.5 text-[10px] font-medium text-header-text/80"
            >
              {user ? (
                <>
                  <User size={14} />
                  <span className="hidden max-w-[56px] truncate sm:inline">{profileName}</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span className="hidden sm:inline">로그인</span>
                </>
              )}
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
