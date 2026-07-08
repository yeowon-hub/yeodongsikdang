import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Ingredient } from '@/types'
import { IngredientCard } from '@/components/fridge/IngredientCard'
import { useRecipeBubble } from '@/contexts/RecipeBubbleContext'
import { getIngredientRoute } from '@/lib/navigation'

interface ExpiringIngredientCardProps {
  ingredient: Ingredient
  onLongPress: (ingredient: Ingredient) => void
}

export function ExpiringIngredientCard({ ingredient, onLongPress }: ExpiringIngredientCardProps) {
  const navigate = useNavigate()
  const { createStoragePointerHandlers, activeDrag } = useRecipeBubble()

  const handlers = useMemo(
    () =>
      createStoragePointerHandlers(ingredient, {
        onTap: () => navigate(getIngredientRoute(ingredient)),
        onLongPress: () => onLongPress(ingredient),
      }),
    [createStoragePointerHandlers, ingredient, navigate, onLongPress],
  )

  return (
    <div
      className={`shrink-0 select-none touch-none active:opacity-90 ${
        activeDrag?.ingredient.id === ingredient.id && activeDrag.source === 'storage'
          ? 'opacity-40'
          : ''
      }`}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <IngredientCard ingredient={ingredient} banner asDiv />
    </div>
  )
}
