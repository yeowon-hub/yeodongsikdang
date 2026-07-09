import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Ingredient } from '@/types'

const DRAG_THRESHOLD_PX = 12
const BUBBLE_NEAR_PADDING_PX = 72
const STORAGE_KEY = 'recipe-bubble-ingredients'

function pointInRect(x: number, y: number, rect: DOMRect, padding = 0) {
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  )
}

type DragSource = 'storage' | 'bubble'

interface ActiveDrag {
  ingredient: Ingredient
  source: DragSource
  x: number
  y: number
  startX: number
  startY: number
}

interface RecipeBubbleContextValue {
  bubbleIngredients: Ingredient[]
  addToBubble: (ingredient: Ingredient) => void
  removeFromBubble: (id: string) => void
  clearBubble: () => void
  bubbleDropRef: RefObject<HTMLDivElement | null>
  isOverBubble: (x: number, y: number) => boolean
  activeDrag: ActiveDrag | null
  isBubbleHover: boolean
  isBubbleNear: boolean
  updateBubbleProximity: (x: number, y: number) => void
  clearBubbleProximity: () => void
  tryAddAtDrop: (x: number, y: number, ingredient: Ingredient) => boolean
  beginStorageDrag: (ingredient: Ingredient, x: number, y: number) => void
  updateDrag: (x: number, y: number) => void
  endDrag: (x: number, y: number) => void
  cancelDrag: () => void
  beginBubbleDrag: (ingredient: Ingredient, x: number, y: number) => void
  createBubblePointerHandlers: (ingredient: Ingredient) => {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
    onPointerCancel: (e: React.PointerEvent) => void
  }
  createStoragePointerHandlers: (
    ingredient: Ingredient,
    options?: {
      onTap?: () => void
      onLongPress?: () => void
      longPressMs?: number
    },
  ) => {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
    onPointerCancel: (e: React.PointerEvent) => void
  }
}

const RecipeBubbleContext = createContext<RecipeBubbleContextValue | null>(null)

export function RecipeBubbleProvider({ children }: { children: ReactNode }) {
  const [bubbleIngredients, setBubbleIngredients] = useState<Ingredient[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Ingredient[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [isBubbleHover, setIsBubbleHover] = useState(false)
  const [isBubbleNear, setIsBubbleNear] = useState(false)
  const bubbleDropRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bubbleIngredients))
    } catch {
      /* ignore storage write errors */
    }
  }, [bubbleIngredients])

  const getBubbleRect = useCallback(() => bubbleDropRef.current?.getBoundingClientRect() ?? null, [])

  const isOverBubble = useCallback(
    (x: number, y: number) => {
      const rect = getBubbleRect()
      return rect ? pointInRect(x, y, rect) : false
    },
    [getBubbleRect],
  )

  const isNearBubble = useCallback(
    (x: number, y: number) => {
      const rect = getBubbleRect()
      return rect ? pointInRect(x, y, rect, BUBBLE_NEAR_PADDING_PX) : false
    },
    [getBubbleRect],
  )

  const updateBubbleProximity = useCallback(
    (x: number, y: number) => {
      setIsBubbleHover(isOverBubble(x, y))
      setIsBubbleNear(isNearBubble(x, y))
    },
    [isOverBubble, isNearBubble],
  )

  const clearBubbleProximity = useCallback(() => {
    setIsBubbleHover(false)
    setIsBubbleNear(false)
  }, [])

  const addToBubble = useCallback((ingredient: Ingredient) => {
    setBubbleIngredients((prev) => {
      if (prev.some((i) => i.id === ingredient.id)) return prev
      return [...prev, ingredient]
    })
  }, [])

  const tryAddAtDrop = useCallback(
    (x: number, y: number, ingredient: Ingredient) => {
      if (!isNearBubble(x, y)) return false
      addToBubble(ingredient)
      return true
    },
    [isNearBubble, addToBubble],
  )

  const removeFromBubble = useCallback((id: string) => {
    setBubbleIngredients((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearBubble = useCallback(() => {
    setBubbleIngredients([])
  }, [])

  const beginStorageDrag = useCallback(
    (ingredient: Ingredient, x: number, y: number) => {
      setActiveDrag({ ingredient, source: 'storage', x, y, startX: x, startY: y })
      updateBubbleProximity(x, y)
    },
    [updateBubbleProximity],
  )

  const beginBubbleDrag = useCallback((ingredient: Ingredient, x: number, y: number) => {
    setActiveDrag({ ingredient, source: 'bubble', x, y, startX: x, startY: y })
    setIsBubbleHover(false)
  }, [])

  const updateDrag = useCallback(
    (x: number, y: number) => {
      setActiveDrag((prev) => (prev ? { ...prev, x, y } : null))
      updateBubbleProximity(x, y)
    },
    [updateBubbleProximity],
  )

  const endDrag = useCallback(
    (x: number, y: number) => {
      setActiveDrag((prev) => {
        if (!prev) return null
        const over = isOverBubble(x, y)
        const moved = Math.hypot(x - prev.startX, y - prev.startY)

        if (prev.source === 'storage' && (over || isNearBubble(x, y))) {
          setBubbleIngredients((items) => {
            if (items.some((i) => i.id === prev.ingredient.id)) return items
            return [...items, prev.ingredient]
          })
        } else if (prev.source === 'bubble' && moved >= DRAG_THRESHOLD_PX) {
          setBubbleIngredients((items) => items.filter((i) => i.id !== prev.ingredient.id))
        }
        return null
      })
      clearBubbleProximity()
    },
    [isOverBubble, isNearBubble, clearBubbleProximity],
  )

  const cancelDrag = useCallback(() => {
    setActiveDrag(null)
    clearBubbleProximity()
  }, [clearBubbleProximity])

  const createStoragePointerHandlers = useCallback(
    (
      ingredient: Ingredient,
      options?: {
        onTap?: () => void
        onLongPress?: () => void
        longPressMs?: number
      },
    ) => {
      const longPressMs = options?.longPressMs ?? 500
      let startX = 0
      let startY = 0
      let mode: 'idle' | 'pending' | 'bubble' | 'longPressFired' = 'idle'
      let longPressTimer: ReturnType<typeof setTimeout> | null = null

      const clearLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer)
          longPressTimer = null
        }
      }

      return {
        onPointerDown: (e: React.PointerEvent) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          startX = e.clientX
          startY = e.clientY
          mode = 'pending'
          clearLongPress()
          if (options?.onLongPress) {
            longPressTimer = setTimeout(() => {
              if (mode === 'pending') {
                mode = 'longPressFired'
                options.onLongPress?.()
              }
            }, longPressMs)
          }
        },
        onPointerMove: (e: React.PointerEvent) => {
          if (mode === 'longPressFired' || mode === 'idle') return
          const dx = e.clientX - startX
          const dy = e.clientY - startY
          if (mode === 'pending' && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
            clearLongPress()
            mode = 'bubble'
            beginStorageDrag(ingredient, e.clientX, e.clientY)
          } else if (mode === 'bubble') {
            updateDrag(e.clientX, e.clientY)
          } else if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            clearLongPress()
          }
        },
        onPointerUp: (e: React.PointerEvent) => {
          clearLongPress()
          if (mode === 'bubble') {
            endDrag(e.clientX, e.clientY)
          } else if (mode === 'pending') {
            options?.onTap?.()
          }
          mode = 'idle'
          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {
            /* already released */
          }
        },
        onPointerCancel: () => {
          clearLongPress()
          if (mode === 'bubble') cancelDrag()
          mode = 'idle'
        },
      }
    },
    [beginStorageDrag, updateDrag, endDrag, cancelDrag],
  )

  const createBubblePointerHandlers = useCallback(
    (ingredient: Ingredient) => {
      let dragging = false
      let startX = 0
      let startY = 0

      return {
        onPointerDown: (e: React.PointerEvent) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          dragging = false
          startX = e.clientX
          startY = e.clientY
          beginBubbleDrag(ingredient, e.clientX, e.clientY)
        },
        onPointerMove: (e: React.PointerEvent) => {
          const moved = Math.hypot(e.clientX - startX, e.clientY - startY)
          if (!dragging && moved >= DRAG_THRESHOLD_PX) dragging = true
          if (dragging) updateDrag(e.clientX, e.clientY)
        },
        onPointerUp: (e: React.PointerEvent) => {
          const moved = Math.hypot(e.clientX - startX, e.clientY - startY)
          if (dragging && moved >= DRAG_THRESHOLD_PX) {
            endDrag(e.clientX, e.clientY)
          } else {
            cancelDrag()
          }
          dragging = false
          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {
            /* already released */
          }
        },
        onPointerCancel: () => {
          if (dragging) cancelDrag()
          dragging = false
        },
      }
    },
    [beginBubbleDrag, updateDrag, endDrag, cancelDrag],
  )

  const value = useMemo(
    () => ({
      bubbleIngredients,
      addToBubble,
      removeFromBubble,
      clearBubble,
      bubbleDropRef,
      isOverBubble,
      activeDrag,
      isBubbleHover,
      isBubbleNear,
      updateBubbleProximity,
      clearBubbleProximity,
      tryAddAtDrop,
      beginStorageDrag,
      updateDrag,
      endDrag,
      cancelDrag,
      beginBubbleDrag,
      createBubblePointerHandlers,
      createStoragePointerHandlers,
    }),
    [
      bubbleIngredients,
      addToBubble,
      removeFromBubble,
      clearBubble,
      isOverBubble,
      activeDrag,
      isBubbleHover,
      isBubbleNear,
      updateBubbleProximity,
      clearBubbleProximity,
      tryAddAtDrop,
      beginStorageDrag,
      updateDrag,
      endDrag,
      cancelDrag,
      beginBubbleDrag,
      createBubblePointerHandlers,
      createStoragePointerHandlers,
    ],
  )

  return (
    <RecipeBubbleContext.Provider value={value}>{children}</RecipeBubbleContext.Provider>
  )
}

export function useRecipeBubble() {
  const ctx = useContext(RecipeBubbleContext)
  if (!ctx) throw new Error('useRecipeBubble must be used within RecipeBubbleProvider')
  return ctx
}

export function useRecipeBubbleOptional() {
  return useContext(RecipeBubbleContext)
}
