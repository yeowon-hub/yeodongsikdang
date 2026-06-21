import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Ingredient } from '@/types'
import { IngredientCard } from '@/components/fridge/IngredientCard'
import { getIngredientRoute } from '@/lib/navigation'

const LONG_PRESS_MS = 500
const MOVE_CANCEL_PX = 12

interface ExpiringIngredientCardProps {
  ingredient: Ingredient
  onLongPress: (ingredient: Ingredient) => void
}

export function ExpiringIngredientCard({ ingredient, onLongPress }: ExpiringIngredientCardProps) {
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    longPressedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    clearTimer()
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress(ingredient)
    }, LONG_PRESS_MS)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return
    const dx = Math.abs(e.clientX - startRef.current.x)
    const dy = Math.abs(e.clientY - startRef.current.y)
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clearTimer()
  }

  const handlePointerUp = () => {
    clearTimer()
    if (!longPressedRef.current) {
      navigate(getIngredientRoute(ingredient))
    }
    startRef.current = null
  }

  return (
    <div
      className="shrink-0 select-none active:opacity-90"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
    >
      <IngredientCard ingredient={ingredient} banner asDiv />
    </div>
  )
}
