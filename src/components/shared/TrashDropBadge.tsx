import { Trash2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useIngredientDragOptional } from '@/contexts/IngredientDragContext'

function isStoragePath(pathname: string) {
  return (
    pathname.startsWith('/fridge') ||
    pathname.startsWith('/shelf') ||
    pathname.startsWith('/pantry')
  )
}

export function TrashDropBadge() {
  const location = useLocation()
  const drag = useIngredientDragOptional()
  if (!drag || !isStoragePath(location.pathname)) return null

  const { trashDropRef, levelDrag, isTrashHover } = drag
  const dragging = levelDrag !== null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        ref={trashDropRef}
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-200 ${
          isTrashHover
            ? 'scale-110 bg-red-500 text-white ring-4 ring-red-300/50'
            : dragging
              ? 'text-black ring-2 ring-header/30'
              : 'text-black ring-1 ring-black/10'
        }`}
        aria-label="재료 삭제"
      >
        <Trash2 size={26} strokeWidth={2} />
      </div>
    </div>
  )
}
