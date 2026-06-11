import type { Ingredient, StorageLocation } from '@/types'
import { SHELF_LEVELS, STORAGE_META } from '@/types'
import { IngredientCard } from './IngredientCard'
import { sortByExpiry } from '@/lib/sortIngredients'

interface FridgeInteriorProps {
  location: StorageLocation
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

const INTERIOR_THEMES: Record<'fridge' | 'freezer', { bg: string; border: string }> = {
  fridge: {
    bg: 'linear-gradient(180deg, #E8F4FC 0%, #D0E8F5 100%)',
    border: '#B8D4E8',
  },
  freezer: {
    bg: 'linear-gradient(180deg, #E0F0FF 0%, #C8DCF5 100%)',
    border: '#9BB8D4',
  },
}

export function FridgeInterior({ location, ingredients, onIngredientClick }: FridgeInteriorProps) {
  const meta = STORAGE_META[location]
  const theme = INTERIOR_THEMES[meta.kind === 'freezer' ? 'freezer' : 'fridge']

  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: sortByExpiry(ingredients.filter((i) => (i.shelfLevel ?? 0) === level)),
  }))

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/30 px-3 py-2">
        <h3 className="text-xs font-semibold text-fridge-dark">{meta.shortLabel}</h3>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        style={{ background: theme.bg }}
      >
        {grouped.map(({ level, items }) => (
          <div
            key={level}
            className="flex shrink-0 flex-col border-b border-white/40 last:border-b-0"
          >
            <div className="shrink-0 px-2.5 pt-2">
              <span className="inline-block rounded-md bg-white/50 px-2 py-0.5 text-[10px] font-medium leading-none text-gray-600">
                {level + 1}단
              </span>
            </div>
            <div className="px-2 pb-2 pt-1">
              {items.length === 0 ? (
                <p className="py-2 text-[11px] text-gray-400">비어있음</p>
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
              className="mx-1 mb-1 h-1.5 shrink-0 rounded-full shadow-sm"
              style={{ background: 'linear-gradient(90deg, #bbb, #eee, #bbb)' }}
            />
          </div>
        ))}

        {ingredients.length === 0 && (
          <p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500">
            {meta.shortLabel}이 비어있어요.
            <br />+ 버튼으로 재료를 추가해보세요!
          </p>
        )}
      </div>
    </div>
  )
}

export function getFridgeFrameStyle(kind: 'fridge' | 'freezer') {
  const theme = INTERIOR_THEMES[kind]
  return {
    background: theme.bg,
    border: `3px solid ${theme.border}`,
  }
}
