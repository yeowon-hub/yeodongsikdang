import type { Ingredient } from '@/types'
import { SHELF_LEVELS } from '@/types'
import { IngredientCard } from '@/components/fridge/IngredientCard'
import { CompartmentSwipeView } from '@/components/shared/CompartmentSwipeView'
import { sortByExpiry } from '@/lib/sortIngredients'

interface StorageLevelViewProps {
  title: string
  subtitle: string
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  levelLabel: '칸' | '단'
  frameStyle: React.CSSProperties
  emptyMessage: string
  pageBg: string
}

export function StorageLevelView({
  title,
  subtitle,
  ingredients,
  onIngredientClick,
  levelLabel,
  frameStyle,
  emptyMessage,
  pageBg,
}: StorageLevelViewProps) {
  const slides = SHELF_LEVELS.map((level) => {
    const items = sortByExpiry(ingredients.filter((i) => (i.shelfLevel ?? 0) === level))
    return {
      id: String(level),
      label: `${level + 1}${levelLabel}`,
      content: (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 pt-2">
            {items.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-gray-500">비어있음</p>
            ) : (
              <div className="flex flex-wrap content-start gap-1.5">
                {items.map((item) => (
                  <IngredientCard
                    key={item.id}
                    ingredient={item}
                    onClick={() => onIngredientClick(item)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
          <div
            className="mx-1 mb-1 h-2.5 shrink-0 rounded-sm shadow-md"
            style={{
              background:
                levelLabel === '칸'
                  ? 'linear-gradient(180deg, #C4A882 0%, #8B6548 100%)'
                  : 'linear-gradient(90deg, #bbb, #eee, #bbb)',
            }}
          />
        </div>
      ),
    }
  })

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${pageBg}`}>
      <div className="shrink-0 px-4 pb-2 pt-2">
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <CompartmentSwipeView slides={slides} frameStyle={frameStyle} />
        {ingredients.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-sm text-gray-600">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}
