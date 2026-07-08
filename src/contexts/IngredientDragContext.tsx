import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Ingredient } from '@/types'

const TRASH_NEAR_PADDING_PX = 56

interface LevelDrag {
  ingredient: Ingredient
  x: number
  y: number
}

interface IngredientDragContextValue {
  levelDrag: LevelDrag | null
  isTrashHover: boolean
  isTrashNear: boolean
  trashDropRef: RefObject<HTMLDivElement | null>
  beginLevelDrag: (ingredient: Ingredient, x: number, y: number) => void
  updateLevelDrag: (x: number, y: number) => void
  endLevelDrag: (x: number, y: number) => boolean
  cancelLevelDrag: () => void
}

const IngredientDragContext = createContext<IngredientDragContextValue | null>(null)

function pointInRect(
  x: number,
  y: number,
  rect: DOMRect,
  padding = 0,
) {
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  )
}

export function IngredientDragProvider({ children }: { children: ReactNode }) {
  const [levelDrag, setLevelDrag] = useState<LevelDrag | null>(null)
  const [isTrashHover, setIsTrashHover] = useState(false)
  const [isTrashNear, setIsTrashNear] = useState(false)
  const trashDropRef = useRef<HTMLDivElement | null>(null)

  const updateTrashState = useCallback((x: number, y: number) => {
    const el = trashDropRef.current
    if (!el) {
      setIsTrashHover(false)
      setIsTrashNear(false)
      return
    }
    const rect = el.getBoundingClientRect()
    setIsTrashHover(pointInRect(x, y, rect))
    setIsTrashNear(pointInRect(x, y, rect, TRASH_NEAR_PADDING_PX))
  }, [])

  const beginLevelDrag = useCallback(
    (ingredient: Ingredient, x: number, y: number) => {
      setLevelDrag({ ingredient, x, y })
      updateTrashState(x, y)
    },
    [updateTrashState],
  )

  const updateLevelDrag = useCallback(
    (x: number, y: number) => {
      setLevelDrag((prev) => (prev ? { ...prev, x, y } : null))
      updateTrashState(x, y)
    },
    [updateTrashState],
  )

  const endLevelDrag = useCallback(
    (x: number, y: number) => {
      const el = trashDropRef.current
      const overTrash = el ? pointInRect(x, y, el.getBoundingClientRect()) : false
      setLevelDrag(null)
      setIsTrashHover(false)
      setIsTrashNear(false)
      return overTrash
    },
    [],
  )

  const cancelLevelDrag = useCallback(() => {
    setLevelDrag(null)
    setIsTrashHover(false)
    setIsTrashNear(false)
  }, [])

  const value = useMemo(
    () => ({
      levelDrag,
      isTrashHover,
      isTrashNear,
      trashDropRef,
      beginLevelDrag,
      updateLevelDrag,
      endLevelDrag,
      cancelLevelDrag,
    }),
    [
      levelDrag,
      isTrashHover,
      isTrashNear,
      beginLevelDrag,
      updateLevelDrag,
      endLevelDrag,
      cancelLevelDrag,
    ],
  )

  return (
    <IngredientDragContext.Provider value={value}>{children}</IngredientDragContext.Provider>
  )
}

export function useIngredientDrag() {
  const ctx = useContext(IngredientDragContext)
  if (!ctx) throw new Error('useIngredientDrag must be used within IngredientDragProvider')
  return ctx
}

export function useIngredientDragOptional() {
  return useContext(IngredientDragContext)
}
