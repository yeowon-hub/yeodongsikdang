import { NavLink, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useExpiringCount } from '@/hooks/useIngredients'
import { ASSETS } from '@/lib/assets'

const tabs = [
  {
    to: '/fridge/general',
    label: '일반',
    image: ASSETS.tiles.fridge,
    match: '/fridge/general',
    activeBg: 'bg-tile-fridge',
  },
  {
    to: '/fridge/kimchi',
    label: '김치',
    image: ASSETS.tiles.kimchi,
    match: '/fridge/kimchi',
    activeBg: 'bg-tile-kimchi',
  },
  {
    to: '/home',
    label: '홈',
    match: '/home',
    activeBg: 'bg-header',
    isHome: true,
  },
  {
    to: '/shelf',
    label: '선반',
    image: ASSETS.tiles.shelf,
    match: '/shelf',
    activeBg: 'bg-tile-shelf',
  },
  {
    to: '/pantry',
    label: '펜트리',
    image: ASSETS.tiles.pantry,
    match: '/pantry',
    activeBg: 'bg-tile-pantry',
  },
] as const

export function BottomTabBar() {
  const expiringCount = useExpiringCount()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pt-1.5 pb-1.5">
        {tabs.map((tab) => {
          const isActive =
            tab.match === '/home'
              ? location.pathname === '/home'
              : location.pathname.startsWith(tab.match)
          const showBadge =
            (tab.match.startsWith('/fridge') || tab.match === '/home') &&
            expiringCount !== undefined &&
            expiringCount > 0

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-header-text' : 'text-gray-400'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl shadow-sm ${
                  isActive ? tab.activeBg : 'bg-gray-50'
                }`}
              >
                {'image' in tab ? (
                  <img
                    src={tab.image}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <Home size={20} strokeWidth={isActive ? 2.5 : 2} className="text-header-text" />
                )}
              </div>
              <span className="truncate leading-none">{tab.label}</span>
              {showBadge && (isActive || tab.match === '/home') && (
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
