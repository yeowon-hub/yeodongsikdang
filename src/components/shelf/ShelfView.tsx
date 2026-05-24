import type { Ingredient } from '@/types'
import { SHELF_LEVELS } from '@/types'
import { IngredientCard } from '@/components/fridge/IngredientCard'

interface ShelfViewProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

export function ShelfView({ ingredients, onIngredientClick }: ShelfViewProps) {
  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: ingredients.filter((i) => (i.shelfLevel ?? 0) === level),
  }))

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-2">
      <div className="mb-2 shrink-0">
        <h2 className="text-sm font-semibold text-shelf-dark">선반</h2>
        <p className="text-xs text-gray-500">실온 보관 · 4칸</p>
      </div>

      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-inner"
        style={{
          background: 'linear-gradient(180deg, #F5E6D3 0%, #E8D4BC 100%)',
          border: '3px solid #D4B896',
        }}
      >
        {grouped.map(({ level, items }) => (
          <div
            key={level}
            className="flex min-h-0 flex-1 flex-col border-b border-[#C4A882]/30 last:border-b-0"
          >
            {/* 칸 라벨 */}
            <div className="shrink-0 px-2.5 pt-2">
              <span className="inline-block rounded-md bg-[#C4A882]/30 px-2 py-0.5 text-[10px] font-medium leading-none text-[#6B5344]">
                {level + 1}칸
              </span>
            </div>

            {/* 재료 영역 (선반 판 위) */}
            <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1">
              {items.length === 0 ? (
                <p className="py-2 text-[11px] leading-snug text-gray-500">비어있음</p>
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

            {/* 나무 선반 판 */}
            <div
              className="relative z-0 mx-1 mb-1 h-2.5 shrink-0 rounded-sm shadow-md"
              style={{
                background: 'linear-gradient(180deg, #C4A882 0%, #8B6548 100%)',
              }}
            />
          </div>
        ))}

        {ingredients.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#F5E6D3]/80 p-4">
            <p className="text-center text-sm leading-relaxed text-gray-600">
              선반이 비어있어요.
              <br />
              + 버튼으로 재료를 추가해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
