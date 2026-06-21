import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'

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

interface GhostPosition {
  top: number
  left: number
  width: number
  grabOffsetY: number
}

function DragGhost({
  position,
  cloneRef,
}: {
  position: GhostPosition
  cloneRef: RefObject<HTMLElement | null>
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    const clone = cloneRef.current
    if (!host || !clone) return
    if (clone.parentElement !== host) {
      host.replaceChildren(clone)
    }
  }, [cloneRef, position.left, position.width])

  return createPortal(
    <div
      className="pointer-events-none z-[110]"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      <div className="relative overflow-hidden rounded-xl shadow-lg ring-2 ring-header/40">
        <div ref={hostRef} />
        <div className="absolute inset-0 rounded-xl bg-header/15" aria-hidden />
      </div>
    </div>,
    document.body,
  )
}

export function useDragReorder<T>(items: T[], onReorder: (items: T[]) => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef(items)
  const onReorderRef = useRef(onReorder)
  const ghostCloneRef = useRef<HTMLElement | null>(null)
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
  const [ghostPosition, setGhostPosition] = useState<GhostPosition | null>(null)

  const clearDragVisuals = useCallback(() => {
    setDragFrom(null)
    setDragOver(null)
    setGhostPosition(null)
    ghostCloneRef.current = null
  }, [])

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

  const startDragVisuals = useCallback((index: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return
    const row = container.querySelectorAll('[data-reorder-item]')[index] as HTMLElement | undefined
    if (!row) return

    const rect = row.getBoundingClientRect()
    ghostCloneRef.current = row.cloneNode(true) as HTMLElement
    setDragFrom(index)
    setGhostPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      grabOffsetY: clientY - rect.top,
    })
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
            startDragVisuals(index, ev.clientY)
          }

          ev.preventDefault()
          setGhostPosition((prev) =>
            prev
              ? {
                  ...prev,
                  top: ev.clientY - prev.grabOffsetY,
                }
              : null,
          )
          setDragOver(getIndexAtY(ev.clientY))
        }

        const onEnd = (ev: PointerEvent) => {
          const drag = dragRef.current
          if (!drag || drag.fromIndex !== index) return

          drag.cleanup()
          dragRef.current = null

          const didDrag = drag.dragging
          if (didDrag) {
            const toIndex = getIndexAtY(ev.clientY)
            if (toIndex !== drag.fromIndex) {
              onReorderRef.current(reorderArray(itemsRef.current, drag.fromIndex, toIndex))
            }
          }

          clearDragVisuals()
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
    [clearDragVisuals, getIndexAtY, startDragVisuals],
  )

  const getItemClassName = useCallback(
    (index: number, base: string) => {
      let cls = base
      if (dragFrom === index) {
        cls += ' opacity-0'
      } else if (dragOver === index && dragFrom !== null) {
        cls += ' border-header bg-header/5 ring-1 ring-header/25'
      }
      return cls
    },
    [dragFrom, dragOver],
  )

  const previewPortal =
    ghostPosition && ghostCloneRef.current ? (
      <DragGhost position={ghostPosition} cloneRef={ghostCloneRef} />
    ) : null

  return {
    containerRef,
    bindHandle,
    getItemClassName,
    isDragging: dragFrom !== null,
    previewPortal,
  }
}
