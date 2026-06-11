import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useIngredients } from '@/hooks/useIngredients'
import { getExpiringSoon, getExpiryStatus } from '@/lib/recommend'
import { sortByExpiry } from '@/lib/sortIngredients'
import { ASSETS } from '@/lib/assets'
import { getLocationRoute } from '@/lib/navigation'

const NAV_TILES = [
  { id: 'fridge', route: '/fridge/general', image: ASSETS.tiles.fridge, alt: '일반 냉장고' },
  { id: 'kimchi', route: '/fridge/kimchi', image: ASSETS.tiles.kimchi, alt: '김치냉장고' },
  { id: 'shelf', route: '/shelf', image: ASSETS.tiles.shelf, alt: '선반' },
  { id: 'pantry', route: '/pantry', image: ASSETS.tiles.pantry, alt: '펜트리' },
] as const

export function HomePage() {
  const { ingredients } = useIngredients()
  const expiring = sortByExpiry(getExpiringSoon(ingredients, 3))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div
        className="relative mx-4 mt-3 shrink-0 overflow-hidden rounded-[28px] bg-cover bg-center shadow-md"
        style={{ backgroundImage: `url(${ASSETS.expiringBanner})` }}
      >
        <div className="min-h-[88px] px-4 py-3">
          {expiring.length > 0 ? (
            <>
              <p className="mb-2 text-[11px] font-semibold text-gray-700/80">유통기한 임박</p>
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
                        className={`flex w-[88px] flex-col rounded-2xl border bg-white/90 p-1.5 shadow-sm backdrop-blur-sm ${
                          status === 'expired'
                            ? 'border-red-200'
                            : status === 'soon'
                              ? 'border-amber-200'
                              : 'border-white/80'
                        }`}
                      >
                        {ing.imageUrl ? (
                          <img
                            src={ing.imageUrl}
                            alt=""
                            className="mb-1 h-11 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <div className="mb-1 flex h-11 items-center justify-center rounded-xl bg-white/60 text-lg">
                            🥬
                          </div>
                        )}
                        <span className="truncate text-[10px] font-semibold text-gray-800">
                          {ing.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-0.5 text-[9px] text-amber-700">
                          <Clock size={9} />
                          {ing.expiryDate}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="flex min-h-[64px] items-center justify-center text-center text-xs text-gray-600/70">
              임박한 재료가 없어요
            </p>
          )}
        </div>
      </div>

      <section className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3 px-4 py-3">
        {NAV_TILES.map((tile) => (
          <Link
            key={tile.id}
            to={tile.route}
            className="block min-h-0 overflow-hidden rounded-[28px] shadow-md transition-transform active:scale-[0.98]"
          >
            <img
              src={tile.image}
              alt={tile.alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </Link>
        ))}
      </section>

      <div className="shrink-0 px-4 pb-4">
        <Link
          to="/recipes"
          className="block overflow-hidden rounded-[28px] shadow-md transition-transform active:scale-[0.98]"
        >
          <img
            src={ASSETS.tiles.recipe}
            alt="레시피"
            className="h-auto w-full object-cover"
            draggable={false}
          />
        </Link>
      </div>
    </div>
  )
}
