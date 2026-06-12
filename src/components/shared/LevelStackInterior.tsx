import type { Ingredient } from '@/types'
import { SHELF_LEVELS } from '@/types'
import { IngredientCard } from '@/components/fridge/IngredientCard'
import { sortByExpiry } from '@/lib/sortIngredients'

export interface LevelStackTheme {
  bg: string
  border: string
}

export interface LevelStackTopSelector {
  options: { value: number; label: string }[]
  value: number
  onChange: (value: number) => void
}

interface LevelStackInteriorProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  theme: LevelStackTheme
  levelLabel: '칸' | '단'
  topSelector?: LevelStackTopSelector
  emptyMessage?: string
  dividerVariant?: 'metal' | 'wood'
}

const ROW_HEIGHT_PX = 62

export function LevelStackInterior({
  ingredients,
  onIngredientClick,
  theme,
  levelLabel,
  topSelector,
  emptyMessage,
  dividerVariant = 'metal',
}: LevelStackInteriorProps) {
  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: sortByExpiry(ingredients.filter((i) => (i.shelfLevel ?? 0) === level)),
  }))

  const dividerStyle =
    dividerVariant === 'wood'
      ? 'linear-gradient(180deg, #C4A882 0%, #8B6548 100%)'
      : 'linear-gradient(90deg, rgba(0,0,0,0.12), rgba(255,255,255,0.5), rgba(0,0,0,0.12))'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        style={{ backgroundColor: theme.bg }}
      >
        {topSelector && (
          <div className="flex shrink-0 gap-1 border-b border-black/5 px-2.5 py-1.5">
            {topSelector.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => topSelector.onChange(opt.value)}
                className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
                  topSelector.value === opt.value
                    ? 'bg-white/70 text-gray-800 shadow-sm'
                    : 'bg-white/40 text-gray-600 hover:bg-white/55'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {grouped.map(({ level, items }) => (
          <div
            key={level}
            className="flex shrink-0 flex-col border-b border-black/5 last:border-b-0"
          >
            <div className="shrink-0 px-2.5 pt-1.5">
              <span className="inline-block rounded-md bg-white/50 px-2 py-0.5 text-[10px] font-medium leading-none text-gray-600">
                {level + 1}
                {levelLabel}
              </span>
            </div>
            <div
              data-inner-swipe
              className="mx-2 shrink-0 overflow-x-auto overflow-y-hidden px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ height: ROW_HEIGHT_PX }}
            >
              {items.length === 0 ? (
                <p className="flex h-full items-center text-[11px] text-gray-400">비어있음</p>
              ) : (
                <div className="flex h-full flex-nowrap items-center gap-1.5">
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
              className={`mx-2 mb-1.5 mt-0.5 shrink-0 rounded-sm shadow-sm ${
                dividerVariant === 'wood' ? 'h-2.5' : 'h-1.5 rounded-full'
              }`}
              style={{ background: dividerStyle }}
            />
          </div>
        ))}

        {ingredients.length === 0 && emptyMessage && (
          <p className="flex flex-1 items-center justify-center whitespace-pre-line p-6 text-center text-sm text-gray-500">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}

export function getLevelStackFrameStyle(theme: LevelStackTheme) {
  return {
    backgroundColor: theme.bg,
    border: `3px solid ${theme.border}`,
  }
}
