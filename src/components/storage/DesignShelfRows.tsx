import { IngredientCard } from '@/components/fridge/IngredientCard'
import { STORAGE_SHELF_DIVIDER } from '@/lib/storageDesignSpec'
import { sortByExpiry } from '@/lib/sortIngredients'
import { SHELF_LEVELS } from '@/types'
import type { Ingredient } from '@/types'

interface DesignShelfRowsProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  emptyMessage?: string
}

export function DesignShelfRows({
  ingredients,
  onIngredientClick,
  emptyMessage,
}: DesignShelfRowsProps) {
  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: sortByExpiry(ingredients.filter((i) => (i.shelfLevel ?? 0) === level)),
  }))

  if (ingredients.length === 0 && emptyMessage) {
    return (
      <p className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-600/80">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      {grouped.map(({ level, items }) => (
        <div key={level} className="flex shrink-0 flex-col">
          <div
            data-inner-swipe
            className="flex min-h-[70px] min-w-0 items-start overflow-x-hidden px-2 py-1"
          >
            {items.length === 0 ? (
              <span className="px-1 text-[10px] text-gray-500/70">비어있음</span>
            ) : (
              <div className="flex w-full min-w-0 flex-wrap content-start items-start gap-1.5">
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
            className="mx-3 mb-1 h-2 shrink-0 rounded-full"
            style={{ background: STORAGE_SHELF_DIVIDER }}
          />
        </div>
      ))}
    </div>
  )
}
