import { motion, AnimatePresence } from 'framer-motion'
import type { Ingredient, StorageLocation } from '@/types'
import { SHELF_LEVELS, STORAGE_META } from '@/types'
import { IngredientCard } from './IngredientCard'
import { X } from 'lucide-react'

interface FridgeInteriorProps {
  location: StorageLocation
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  onClose: () => void
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

export function FridgeInterior({
  location,
  ingredients,
  onIngredientClick,
  onClose,
}: FridgeInteriorProps) {
  const meta = STORAGE_META[location]
  const theme = INTERIOR_THEMES[meta.kind === 'freezer' ? 'freezer' : 'fridge']

  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: ingredients.filter((i) => (i.shelfLevel ?? 0) === level),
  }))

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-2"
      >
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-semibold text-fridge-dark">{meta.label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm"
          >
            <X size={14} />
            문 닫기
          </button>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-inner"
          style={{
            background: theme.bg,
            border: `3px solid ${theme.border}`,
          }}
        >
          <div className="h-1.5 shrink-0 bg-gradient-to-b from-white/60 to-transparent" />

          <div className="flex min-h-0 flex-1 flex-col">
            {grouped.map(({ level, items }) => (
              <div
                key={level}
                className="flex min-h-0 flex-1 flex-col border-b border-white/40 last:border-b-0"
              >
                <div className="shrink-0 px-2.5 pt-2">
                  <span className="inline-block rounded-md bg-white/50 px-2 py-0.5 text-[10px] font-medium leading-none text-gray-600">
                    {level + 1}단
                  </span>
                </div>
                <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1">
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
                  className="relative z-0 mx-1 mb-1 h-1.5 shrink-0 rounded-full shadow-sm"
                  style={{ background: 'linear-gradient(90deg, #bbb, #eee, #bbb)' }}
                />
              </div>
            ))}
          </div>

          {ingredients.length === 0 && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-500">
              {meta.label}이 비어있어요.
              <br />+ 버튼으로 재료를 추가해보세요!
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
