import { Link } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'
import { useIngredients } from '@/hooks/useIngredients'
import { getExpiringSoon, getExpiryStatus } from '@/lib/recommend'
import { sortByExpiry } from '@/lib/sortIngredients'
import { HOME_TILES, getLocationRoute } from '@/lib/navigation'
import { Refrigerator, Snowflake, Package, Archive } from 'lucide-react'

const TILE_ICONS = {
  general: Refrigerator,
  kimchi: Snowflake,
  shelf: Package,
  pantry: Archive,
} as const

export function HomePage() {
  const { ingredients } = useIngredients()
  const expiring = sortByExpiry(getExpiringSoon(ingredients, 3))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-3">
      {expiring.length > 0 && (
        <section className="mb-4 shrink-0">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-gray-800">유통기한 임박</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {expiring.length}개
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {expiring.map((ing) => {
              const status = getExpiryStatus(ing.expiryDate)
              return (
                <Link
                  key={ing.id}
                  to={getLocationRoute(ing.location)}
                  className="shrink-0"
                >
                  <div
                    className={`flex w-[100px] flex-col rounded-xl border bg-white p-2 shadow-sm ${
                      status === 'expired'
                        ? 'border-red-200'
                        : status === 'soon'
                          ? 'border-amber-200'
                          : 'border-gray-100'
                    }`}
                  >
                    {ing.imageUrl ? (
                      <img
                        src={ing.imageUrl}
                        alt=""
                        className="mb-1 h-12 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <span className="truncate text-xs font-medium text-gray-800">{ing.name}</span>
                    <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-amber-600">
                      <Clock size={10} />
                      {ing.expiryDate}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-3 shrink-0 text-sm font-bold text-gray-800">보관함</h2>
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
          {HOME_TILES.map((tile) => {
            const Icon = TILE_ICONS[tile.id]
            return (
              <Link
                key={tile.id}
                to={tile.route}
                className={`flex min-h-0 flex-col items-center justify-center gap-2 rounded-2xl border border-white/60 shadow-md transition-transform active:scale-[0.98] ${tile.color}`}
              >
                <div className="rounded-full bg-white/70 p-4 shadow-sm">
                  <Icon size={32} strokeWidth={1.75} />
                </div>
                <span className="text-base font-bold">{tile.label}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
