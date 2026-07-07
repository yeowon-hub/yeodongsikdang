import { useEffect, useRef, useState } from 'react'
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
  onIngredientMoveToLevel?: (ingredientId: string, level: number) => void
  theme: LevelStackTheme
  levelLabel: '칸' | '단'
  topSelector?: LevelStackTopSelector
  focusLevel?: number
  focusIngredientId?: string
  emptyMessage?: string
  dividerVariant?: 'metal' | 'wood'
}

const ROW_MIN_HEIGHT_PX = 70
const DRAG_THRESHOLD_PX = 12

export function LevelStackInterior({
  ingredients,
  onIngredientClick,
  onIngredientMoveToLevel,
  theme,
  levelLabel,
  topSelector,
  focusLevel,
  focusIngredientId,
  emptyMessage,
  dividerVariant = 'metal',
}: LevelStackInteriorProps) {
  const levelRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const ingredientRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const dragRef = useRef<{
    id: string
    fromLevel: number
    startX: number
    startY: number
    dragging: boolean
  } | null>(null)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropLevel, setDropLevel] = useState<number | null>(null)

  useEffect(() => {
    if (focusIngredientId === undefined && focusLevel === undefined) return

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (focusIngredientId) {
          const card = ingredientRefs.current.get(focusIngredientId)
          const level = card?.closest('[data-shelf-level]') as HTMLElement | null
          level?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          card?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
          return
        }
        if (focusLevel !== undefined) {
          levelRefs.current
            .get(focusLevel)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [focusIngredientId, focusLevel, ingredients])

  const findLevelAtY = (clientY: number): number | null => {
    for (const [level, el] of levelRefs.current) {
      const rect = el.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) return level
    }
    return null
  }

  const finishDrag = (clientY: number) => {
    const drag = dragRef.current
    dragRef.current = null
    setDraggingId(null)
    setDropLevel(null)

    if (!drag?.dragging || !onIngredientMoveToLevel) return
    const targetLevel = findLevelAtY(clientY) ?? drag.fromLevel
    if (targetLevel !== drag.fromLevel) {
      onIngredientMoveToLevel(drag.id, targetLevel)
    }
  }

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: Ingredient,
    level: number,
  ) => {
    if (!onIngredientMoveToLevel) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: item.id,
      fromLevel: level,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.dragging = true
        setDraggingId(drag.id)
      } else {
        dragRef.current = null
        return
      }
    }
    if (drag.dragging) {
      setDropLevel(findLevelAtY(e.clientY))
    }
  }

  const handlePointerUp = (e: React.PointerEvent, item: Ingredient) => {
    const drag = dragRef.current
    if (!drag) return

    if (!drag.dragging) {
      dragRef.current = null
      onIngredientClick(item)
      return
    }

    finishDrag(e.clientY)
  }

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
            data-shelf-level={level}
            ref={(el) => {
              if (el) levelRefs.current.set(level, el)
              else levelRefs.current.delete(level)
            }}
            className={`flex shrink-0 flex-col border-b border-black/5 transition-colors last:border-b-0 ${
              dropLevel === level ? 'bg-white/35 ring-1 ring-inset ring-header/40' : ''
            }`}
          >
            <div className="shrink-0 px-2.5 pt-1.5">
              <span className="inline-block rounded-md bg-white/50 px-2 py-0.5 text-[10px] font-medium leading-none text-gray-600">
                {level + 1}
                {levelLabel}
              </span>
            </div>
            <div
              data-inner-swipe
              className="mx-2 min-w-0 shrink-0 overflow-x-hidden overflow-y-visible px-1 py-0.5"
              style={{ minHeight: ROW_MIN_HEIGHT_PX }}
            >
              {items.length === 0 ? (
                <p className="flex h-full items-center text-[11px] text-gray-400">비어있음</p>
              ) : (
                <div className="flex min-h-full w-full min-w-0 flex-wrap content-start items-start gap-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (el) ingredientRefs.current.set(item.id, el)
                        else ingredientRefs.current.delete(item.id)
                      }}
                      className={`shrink-0 touch-none select-none ${
                        draggingId === item.id ? 'opacity-60' : ''
                      }`}
                      onPointerDown={
                        onIngredientMoveToLevel
                          ? (e) => handlePointerDown(e, item, level)
                          : undefined
                      }
                      onPointerMove={onIngredientMoveToLevel ? handlePointerMove : undefined}
                      onPointerUp={
                        onIngredientMoveToLevel ? (e) => handlePointerUp(e, item) : undefined
                      }
                      onPointerCancel={
                        onIngredientMoveToLevel
                          ? (e) => {
                              if (dragRef.current?.dragging) finishDrag(e.clientY)
                              else dragRef.current = null
                            }
                          : undefined
                      }
                      onClick={
                        onIngredientMoveToLevel ? undefined : () => onIngredientClick(item)
                      }
                    >
                      <IngredientCard
                        ingredient={item}
                        onClick={onIngredientMoveToLevel ? undefined : () => onIngredientClick(item)}
                        compact
                        highlighted={focusIngredientId === item.id}
                      />
                    </div>
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
