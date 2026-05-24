import { NavLink } from 'react-router-dom'
import { Refrigerator, BookOpen, Package } from 'lucide-react'
import { useExpiringCount } from '@/hooks/useIngredients'

const tabs = [
  { to: '/fridge', label: '냉장고', icon: Refrigerator, badge: 'cold' as const },
  { to: '/shelf', label: '선반', icon: Package, badge: null },
  { to: '/recipes', label: '레시피', icon: BookOpen, badge: null },
] as const

export function BottomTabBar() {
  const expiringCount = useExpiringCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5 pb-1.5">
        {tabs.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`rounded-full p-1.5 ${isActive ? 'bg-brand/10' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="truncate leading-none">{label}</span>
                {badge === 'cold' && expiringCount !== undefined && expiringCount > 0 && (
                  <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                    {expiringCount > 9 ? '9+' : expiringCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
