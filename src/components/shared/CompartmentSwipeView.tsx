import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface CompartmentSlide {
  id: string
  label: string
  content: ReactNode
}

interface CompartmentSwipeViewProps {
  slides: CompartmentSlide[]
  initialIndex?: number
  onIndexChange?: (index: number) => void
  frameClassName?: string
  frameStyle?: React.CSSProperties
}

const SWIPE_THRESHOLD_PX = 56

export function CompartmentSwipeView({
  slides,
  initialIndex = 0,
  onIndexChange,
  frameClassName = '',
  frameStyle,
}: CompartmentSwipeViewProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const touchStart = useRef<{ x: number; y: number; innerSwipe: boolean } | null>(null)

  const goToIndex = (idx: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, idx))
    setActiveIndex(next)
    onIndexChange?.(next)
  }

  useEffect(() => {
    goToIndex(initialIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex])

  const onTouchStart = (e: React.TouchEvent) => {
    const innerSwipe = !!(e.target as HTMLElement).closest('[data-inner-swipe]')
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      innerSwipe,
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || touchStart.current.innerSwipe) {
      touchStart.current = null
      return
    }

    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return

    if (dx < 0 && activeIndex < slides.length - 1) {
      goToIndex(activeIndex + 1)
      e.stopPropagation()
      return
    }

    if (dx > 0 && activeIndex > 0) {
      goToIndex(activeIndex - 1)
      e.stopPropagation()
    }
    // 경계(첫·마지막 칸)에서는 전파 → 상위 탭 스와이프로 이어짐
  }

  const onTouchCancel = () => {
    touchStart.current = null
  }

  if (slides.length === 0) return null

  const activeSlide = slides[activeIndex]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-start gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goToIndex(i)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              i === activeIndex
                ? 'bg-white/90 text-gray-800 shadow-sm'
                : 'bg-white/40 text-gray-600 hover:bg-white/60'
            }`}
          >
            {slide.label}
          </button>
        ))}
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-inner ${frameClassName}`}
        style={frameStyle}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {activeSlide.content}
        </div>
      </div>
    </div>
  )
}
