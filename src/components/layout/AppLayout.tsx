import { Link, useLocation } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { GlobalAddButton } from './GlobalAddButton'
import { GlobalSearch } from './GlobalSearch'
import { HomeViewport } from './HomeViewport'
import { SwipeableMainOutlet } from './SwipeableMainOutlet'
import { GlobalAddFabProvider } from '@/contexts/GlobalAddFabContext'
import { IngredientDragProvider } from '@/contexts/IngredientDragContext'
import { RecipeBubbleProvider } from '@/contexts/RecipeBubbleContext'
import { RecipeBubble } from '@/components/recipe/RecipeBubble'
import { TrashDropBadge } from '@/components/shared/TrashDropBadge'
import { useAuth } from '@/hooks/useSync'
import { ASSETS } from '@/lib/assets'
import { isMainTabPath } from '@/lib/mainTabs'
import { User, LogIn } from 'lucide-react'

const TAB_BAR_PADDING = 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'

function AppHeader() {
  const { user, isConfigured } = useAuth()
  const profileName =
    ((user?.user_metadata?.nickname ||
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.preferred_username) as string | undefined) ??
    user?.email?.split('@')[0] ??
    '내 계정'

  return (
    <header className="z-40 shrink-0 bg-header shadow-sm">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2">
        <Link to="/home" className="shrink-0">
          <img
            src={ASSETS.logo}
            alt="여동식당"
            className="h-8 w-auto object-contain"
            draggable={false}
          />
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
  )
}

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/home'
  const showRecipeBubble = isMainTabPath(location.pathname)

  return (
    <GlobalAddFabProvider>
      <IngredientDragProvider>
      <RecipeBubbleProvider>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white">
        <div
          className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-hidden"
          style={{ paddingBottom: TAB_BAR_PADDING }}
        >
          <AppHeader />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {isHome ? (
              <HomeViewport>
                <SwipeableMainOutlet />
              </HomeViewport>
            ) : (
              <SwipeableMainOutlet />
            )}
            {showRecipeBubble && <RecipeBubble />}
            <TrashDropBadge />
          </main>
        </div>
        <BottomTabBar />
        <GlobalAddButton />
      </div>
      </RecipeBubbleProvider>
      </IngredientDragProvider>
    </GlobalAddFabProvider>
  )
}
