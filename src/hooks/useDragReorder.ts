import { useCallback, useRef, useState } from 'react'

const DRAG_THRESHOLD_PX = 6

export function reorderArray<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list
  }
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function useDragReorder<T>(items: T[], onReorder: (items: T[]) => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef(items)
  const onReorderRef = useRef(onReorder)
  itemsRef.current = items
  onReorderRef.current = onReorder

  const dragRef = useRef<{
    fromIndex: number
    startY: number
    dragging: boolean
    cleanup: () => void
  } | null>(null)

  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const getIndexAtY = useCallback((clientY: number) => {
    const container = containerRef.current
    if (!container) return 0
    const rows = container.querySelectorAll('[data-reorder-item]')
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return Math.max(0, rows.length - 1)
  }, [])

  const bindHandle = useCallback(
    (index: number) => ({
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return

        e.preventDefault()
        e.stopPropagation()

        dragRef.current?.cleanup()

        const handleEl = e.currentTarget

        const onMove = (ev: PointerEvent) => {
          const drag = dragRef.current
          if (!drag || drag.fromIndex !== index) return

          if (!drag.dragging) {
            if (Math.abs(ev.clientY - drag.startY) < DRAG_THRESHOLD_PX) return
            drag.dragging = true
            setDragFrom(index)
          }

          ev.preventDefault()
          setDragOver(getIndexAtY(ev.clientY))
        }

        const onEnd = (ev: PointerEvent) => {
          const drag = dragRef.current
          if (!drag || drag.fromIndex !== index) return

          drag.cleanup()
          dragRef.current = null
          setDragFrom(null)
          setDragOver(null)

          if (drag.dragging) {
            const toIndex = getIndexAtY(ev.clientY)
            if (toIndex !== drag.fromIndex) {
              onReorderRef.current(reorderArray(itemsRef.current, drag.fromIndex, toIndex))
            }
          }
        }

        const cleanup = () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onEnd)
          window.removeEventListener('pointercancel', onEnd)
          try {
            handleEl.releasePointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
        }

        dragRef.current = {
          fromIndex: index,
          startY: e.clientY,
          dragging: false,
          cleanup,
        }

        handleEl.setPointerCapture(e.pointerId)
        window.addEventListener('pointermove', onMove, { passive: false })
        window.addEventListener('pointerup', onEnd)
        window.addEventListener('pointercancel', onEnd)
      },
    }),
    [getIndexAtY],
  )

  const getItemClassName = useCallback(
    (index: number, base: string) => {
      let cls = base
      if (dragFrom === index) cls += ' opacity-70 shadow-md ring-2 ring-header/40'
      if (dragOver === index && dragFrom !== null && dragFrom !== index) {
        cls += ' border-header bg-header/5'
      }
      return cls
    },
    [dragFrom, dragOver],
  )

  return { containerRef, bindHandle, getItemClassName, isDragging: dragFrom !== null }
}
