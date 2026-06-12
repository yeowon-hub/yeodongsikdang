import { useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  getAdjacentMainTabPath,
  getMainTabTheme,
  isMainTabPath,
} from '@/lib/mainTabs'

const SWIPE_THRESHOLD_PX = 56

type TouchStartState = {
  x: number
  y: number
  innerEl: HTMLElement | null
  innerScrollLeft: number
}

function canExitInnerSwipe(
  innerEl: HTMLElement,
  innerScrollLeft: number,
  dx: number,
): boolean {
  const maxScroll = Math.max(0, innerEl.scrollWidth - innerEl.clientWidth)
  const atLeft = innerScrollLeft <= 1
  const atRight = innerScrollLeft >= maxScroll - 1
  const scrolledDuring = Math.abs(innerEl.scrollLeft - innerScrollLeft) > 2

  if (scrolledDuring) return false
  if (dx > 0 && atLeft) return true
  if (dx < 0 && atRight) return true
  return maxScroll <= 0
}

export function SwipeableMainOutlet() {
  const location = useLocation()
  const navigate = useNavigate()
  const touchStart = useRef<TouchStartState | null>(null)

  const onMainTab = isMainTabPath(location.pathname)
  const theme = getMainTabTheme(location.pathname)

  const clearTouch = () => {
    touchStart.current = null
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (!onMainTab) return
    const innerEl = (e.target as HTMLElement).closest(
      '[data-inner-swipe]',
    ) as HTMLElement | null
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      innerEl,
      innerScrollLeft: innerEl?.scrollLeft ?? 0,
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!onMainTab || !touchStart.current) {
      clearTouch()
      return
    }

    const { x, y, innerEl, innerScrollLeft } = touchStart.current
    const dx = e.changedTouches[0].clientX - x
    const dy = e.changedTouches[0].clientY - y
    clearTouch()

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return

    if (innerEl && !canExitInnerSwipe(innerEl, innerScrollLeft, dx)) return

    const nextPath = getAdjacentMainTabPath(
      location.pathname,
      dx < 0 ? 'next' : 'prev',
    )
    if (nextPath) navigate(nextPath)
  }

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col transition-colors duration-200"
      style={{ backgroundColor: theme }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={clearTouch}
    >
      <Outlet />
    </div>
  )
}
