import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Ingredient } from '@/types'
import { SHELF_LEVELS } from '@/types'
import { IngredientCard } from '@/components/fridge/IngredientCard'
import { useIngredientDragOptional } from '@/contexts/IngredientDragContext'
import { useRecipeBubbleOptional } from '@/contexts/RecipeBubbleContext'
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
  onIngredientDelete?: (ingredientId: string) => void
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
  onIngredientDelete,
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
    item: Ingredient
    fromLevel: number
    startX: number
    startY: number
    dragging: boolean
  } | null>(null)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropLevel, setDropLevel] = useState<number | null>(null)
  const recipeBubble = useRecipeBubbleOptional()
  const ingredientDrag = useIngredientDragOptional()
  const levelDrag = ingredientDrag?.levelDrag ?? null
  const isTrashNear = ingredientDrag?.isTrashNear ?? false
  const isBubbleNear = recipeBubble?.isBubbleNear ?? false

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

  const finishDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    dragRef.current = null
    setDraggingId(null)
    setDropLevel(null)

    if (!drag?.dragging) {
      ingredientDrag?.cancelLevelDrag()
      recipeBubble?.clearBubbleProximity()
      return
    }

    const droppedOnTrash = ingredientDrag?.endLevelDrag(clientX, clientY) ?? false
    if (droppedOnTrash && onIngredientDelete) {
      onIngredientDelete(drag.id)
      recipeBubble?.removeFromBubble(drag.id)
      recipeBubble?.clearBubbleProximity()
      return
    }

    const droppedOnBubble =
      recipeBubble?.tryAddAtDrop(clientX, clientY, drag.item) ?? false
    recipeBubble?.clearBubbleProximity()
    if (droppedOnBubble) return
    if (!onIngredientMoveToLevel) return
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
    if (!onIngredientMoveToLevel && !onIngredientDelete && !recipeBubble) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: item.id,
      item,
      fromLevel: level,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, item: Ingredient) => {
    const drag = dragRef.current
    if (!drag) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.dragging = true
      setDraggingId(drag.id)
      ingredientDrag?.beginLevelDrag(item, e.clientX, e.clientY)
      recipeBubble?.updateBubbleProximity(e.clientX, e.clientY)
    }
    if (drag.dragging) {
      ingredientDrag?.updateLevelDrag(e.clientX, e.clientY)
      recipeBubble?.updateBubbleProximity(e.clientX, e.clientY)
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

    finishDrag(e.clientX, e.clientY)
  }

  const grouped = SHELF_LEVELS.map((level) => ({
    level,
    items: sortByExpiry(ingredients.filter((i) => (i.shelfLevel ?? 0) === level)),
  }))

  const dividerStyle =
    dividerVariant === 'wood'
      ? 'linear-gradient(180deg, #C4A882 0%, #8B6548 100%)'
      : 'linear-gradient(90deg, rgba(0,0,0,0.12), rgba(255,255,255,0.5), rgba(0,0,0,0.12))'

  const canDrag =
    onIngredientMoveToLevel || onIngredientDelete || recipeBubble

  return (
    <>
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
                className="mx-2 shrink-0 px-1 py-1"
                style={{ minHeight: ROW_MIN_HEIGHT_PX }}
              >
                {items.length === 0 ? (
                  <p className="flex h-full min-h-[70px] items-center text-[11px] text-gray-400">
                    비어있음
                  </p>
                ) : (
                  <div className="flex flex-wrap content-start items-start gap-1.5">
                    {items.map((item) => {
                      const isDragging = draggingId === item.id
                      return (
                        <div
                          key={item.id}
                          ref={(el) => {
                            if (el) ingredientRefs.current.set(item.id, el)
                            else ingredientRefs.current.delete(item.id)
                          }}
                          className={`shrink-0 touch-none select-none transition-opacity ${
                            isDragging ? 'opacity-0' : ''
                          }`}
                          onPointerDown={
                            canDrag ? (e) => handlePointerDown(e, item, level) : undefined
                          }
                          onPointerMove={canDrag ? (e) => handlePointerMove(e, item) : undefined}
                          onPointerUp={canDrag ? (e) => handlePointerUp(e, item) : undefined}
                          onPointerCancel={
                            canDrag
                              ? (e) => {
                                  if (dragRef.current?.dragging) finishDrag(e.clientX, e.clientY)
                                  else {
                                    ingredientDrag?.cancelLevelDrag()
                                    recipeBubble?.clearBubbleProximity()
                                  }
                                  dragRef.current = null
                                }
                              : undefined
                          }
                          onClick={canDrag ? undefined : () => onIngredientClick(item)}
                        >
                          <IngredientCard
                            ingredient={item}
                            onClick={canDrag ? undefined : () => onIngredientClick(item)}
                            compact
                            highlighted={focusIngredientId === item.id}
                          />
                        </div>
                      )
                    })}
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

      {levelDrag &&
        createPortal(
          <div
            className={`pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
              isTrashNear || isBubbleNear ? 'opacity-35' : 'opacity-100'
            }`}
            style={{ left: levelDrag.x, top: levelDrag.y }}
          >
            <IngredientCard ingredient={levelDrag.ingredient} compact asDiv />
          </div>,
          document.body,
        )}
    </>
  )
}

export function getLevelStackFrameStyle(theme: LevelStackTheme) {
  return {
    backgroundColor: theme.bg,
    border: `3px solid ${theme.border}`,
  }
}
