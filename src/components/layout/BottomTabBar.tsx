import { NavLink, useLocation } from 'react-router-dom'
import { Refrigerator, Snowflake, Package, Archive, Home } from 'lucide-react'
import { useExpiringCount } from '@/hooks/useIngredients'
import { isMainTabPath } from '@/lib/mainTabs'

const tabs = [
  { to: '/fridge/general', label: '일반', icon: Refrigerator, match: '/fridge/general' },
  { to: '/fridge/kimchi', label: '김치', icon: Snowflake, match: '/fridge/kimchi' },
  { to: '/home', label: '홈', icon: Home, match: '/home' },
  { to: '/shelf', label: '선반', icon: Package, match: '/shelf' },
  { to: '/pantry', label: '펜트리', icon: Archive, match: '/pantry' },
] as const

export function BottomTabBar() {
  const expiringCount = useExpiringCount()
  const location = useLocation()
  const showSwipeHint = isMainTabPath(location.pathname)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {showSwipeHint && (
        <p className="mx-auto max-w-lg pt-1.5 text-center text-[10px] text-gray-400">
          ← 좌우로 밀어서 페이지 이동 →
        </p>
      )}
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pt-1 pb-1.5">
        {tabs.map(({ to, label, icon: Icon, match }) => {
          const isActive =
            match === '/home' ? location.pathname === '/home' : location.pathname.startsWith(match)
          const showBadge =
            (match.startsWith('/fridge') || match === '/home') &&
            expiringCount !== undefined &&
            expiringCount > 0

          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className={`rounded-full p-1.5 ${isActive ? 'bg-brand/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="truncate leading-none">{label}</span>
              {showBadge && (isActive || match === '/home') && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {expiringCount > 9 ? '9+' : expiringCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
