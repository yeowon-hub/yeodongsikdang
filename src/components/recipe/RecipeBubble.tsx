import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle } from 'lucide-react'
import { useRecipeBubble } from '@/contexts/RecipeBubbleContext'
import { useRecipes } from '@/hooks/useRecipes'
import { recommendRecipesForSelection } from '@/lib/recommend'
import { IngredientCard } from '@/components/fridge/IngredientCard'
import { RecipeBubbleResults } from './RecipeBubbleResults'
import type { Ingredient } from '@/types'

function BubbleIngredientBadge({ ingredient }: { ingredient: Ingredient }) {
  const { createBubblePointerHandlers, activeDrag } = useRecipeBubble()
  const handlers = useMemo(
    () => createBubblePointerHandlers(ingredient),
    [createBubblePointerHandlers, ingredient],
  )

  return (
    <div
      className={`w-fit max-w-[200px] cursor-grab touch-none select-none rounded-full bg-header px-3 py-1 shadow-md active:cursor-grabbing ${
        activeDrag?.ingredient.id === ingredient.id && activeDrag.source === 'bubble'
          ? 'opacity-40'
          : ''
      }`}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
    >
      <span className="block truncate text-sm font-semibold text-header-text">
        {ingredient.name}
      </span>
    </div>
  )
}

export function RecipeBubble() {
  const {
    bubbleIngredients,
    clearBubble,
    bubbleDropRef,
    isBubbleHover,
    isBubbleNear,
    activeDrag,
  } = useRecipeBubble()
  const { recipes } = useRecipes()
  const [resultsOpen, setResultsOpen] = useState(false)

  const matches = useMemo(
    () => recommendRecipesForSelection(recipes, bubbleIngredients),
    [recipes, bubbleIngredients],
  )

  return (
    <>
      <div className="pointer-events-none absolute right-2 top-2 z-30 flex justify-end">
        <div className="pointer-events-auto flex flex-col items-end">
          <div
            ref={bubbleDropRef}
            className={`flex flex-col items-end gap-1.5 transition-all ${
              isBubbleHover ? 'scale-[1.02]' : isBubbleNear ? 'scale-[1.01]' : ''
            }`}
          >
            <div className="relative">
              <div className="mb-1 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (bubbleIngredients.length === 0) return
                    setResultsOpen(true)
                  }}
                  disabled={bubbleIngredients.length === 0}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-header-text shadow-md ring-1 ring-black/10 transition-transform active:scale-95 disabled:opacity-40"
                  aria-label="추천 레시피 보기"
                  title="추천 레시피"
                >
                  ?
                </button>
                <button
                  type="button"
                  onClick={clearBubble}
                  disabled={bubbleIngredients.length === 0}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold leading-none text-gray-600 shadow-md ring-1 ring-black/10 transition-transform active:scale-95 disabled:opacity-40"
                  aria-label="말풍선 비우기"
                  title="전체 비우기"
                >
                  −
                </button>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 ${
                  isBubbleHover
                    ? 'ring-2 ring-header'
                    : isBubbleNear
                      ? 'ring-2 ring-header/40'
                      : ''
                }`}
              >
                <MessageCircle
                  size={24}
                  strokeWidth={2}
                  className="text-header-text"
                  aria-hidden
                />
              </div>
            </div>

            {bubbleIngredients.length > 0 && (
              <div className="flex max-h-[min(36dvh,240px)] flex-col items-end gap-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {bubbleIngredients.map((ing) => (
                  <BubbleIngredientBadge key={ing.id} ingredient={ing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeDrag &&
        createPortal(
          <div
            className={`pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
              activeDrag.source === 'storage' && isBubbleNear ? 'opacity-35' : 'opacity-100'
            }`}
            style={{ left: activeDrag.x, top: activeDrag.y }}
          >
            {activeDrag.source === 'storage' ? (
              <IngredientCard ingredient={activeDrag.ingredient} compact asDiv />
            ) : (
              <span className="rounded-full bg-header px-3 py-1 text-sm font-semibold text-header-text shadow-md">
                {activeDrag.ingredient.name}
              </span>
            )}
          </div>,
          document.body,
        )}

      <RecipeBubbleResults
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        matches={matches}
        bubbleIngredients={bubbleIngredients}
      />
    </>
  )
}
