import type { Ingredient, ColdStorageLocation } from '@/types'
import { SHELF_LEVELS, STORAGE_META } from '@/types'
import { IngredientCard } from './IngredientCard'
import { Refrigerator, Snowflake } from 'lucide-react'

const SECTION_THEMES: Record<'fridge' | 'freezer', { bg: string; border: string }> = {
  fridge: {
    bg: 'linear-gradient(180deg, #E8F4FC 0%, #D0E8F5 100%)',
    border: '#B8D4E8',
  },
  freezer: {
    bg: 'linear-gradient(180deg, #E0F0FF 0%, #C8DCF5 100%)',
    border: '#9BB8D4',
  },
}

interface FridgeSectionProps {
  location: ColdStorageLocation
  ingredients: Ingredient[]
  isActive: boolean
  onActivate: () => void
  onIngredientClick: (ingredient: Ingredient) => void
}

export function FridgeSection({
  location,
  ingredients,
  isActive,
  onActivate,
  onIngredientClick,
}: FridgeSectionProps) {
  const meta = STORAGE_META[location]
  const theme = SECTION_THEMES[meta.kind === 'freezer' ? 'freezer' : 'fridge']
  const Icon = meta.kind === 'freezer' ? Snowflake : Refrigerator

  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: ingredients.filter((i) => (i.shelfLevel ?? 0) === level),
  }))

  return (
    <section
      className={`flex min-h-0 min-w-0 flex-1 flex-col ${isActive ? 'opacity-100' : 'opacity-95'}`}
      onClick={onActivate}
    >
      <div
        className={`mb-1 flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 ${
          isActive ? 'bg-header/10 ring-1 ring-header/30' : 'bg-white/60'
        }`}
      >
        <Icon size={14} className={isActive ? 'text-header-text' : 'text-gray-500'} />
        <span className="text-xs font-semibold leading-none text-gray-800">{meta.shortLabel}</span>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl shadow-inner"
        style={{
          background: theme.bg,
          border: `2px solid ${theme.border}`,
        }}
      >
        {grouped.map(({ level, items }) => (
          <div
            key={level}
            className="flex min-h-0 flex-1 flex-col border-b border-white/40 last:border-b-0"
          >
            <div className="shrink-0 px-1.5 pt-1">
              <span className="inline-block rounded bg-white/55 px-1.5 py-px text-[9px] font-medium leading-none text-gray-600">
                {level + 1}단
              </span>
            </div>

            <div className="relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1.5 pb-0.5 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.length === 0 ? (
                <p className="py-0.5 text-[9px] leading-none text-gray-400">비어있음</p>
              ) : (
                <div className="flex min-h-full flex-wrap content-start items-start gap-1">
                  {items.map((item) => (
                    <IngredientCard
                      key={item.id}
                      ingredient={item}
                      onClick={() => onIngredientClick(item)}
                      mini
                    />
                  ))}
                </div>
              )}
            </div>

            <div
              className="relative z-0 mx-1 mb-0.5 h-1 shrink-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, #bbb, #eee, #bbb)' }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
