import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

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

export function CompartmentSwipeView({
  slides,
  initialIndex = 0,
  onIndexChange,
  frameClassName = '',
  frameStyle,
}: CompartmentSwipeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || slides.length === 0) return
    const w = el.clientWidth || 1
    const idx = Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / w)))
    setActiveIndex(idx)
    onIndexChange?.(idx)
  }, [slides.length, onIndexChange])

  const scrollToIndex = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth
    el.scrollTo({ left: w * idx, behavior: 'smooth' })
    setActiveIndex(idx)
    onIndexChange?.(idx)
  }

  useEffect(() => {
    scrollToIndex(initialIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex])

  if (slides.length === 0) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-center gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollToIndex(i)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
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
      >
        <div
          ref={scrollRef}
          onScroll={syncIndexFromScroll}
          className="flex h-full min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex h-full w-full shrink-0 snap-center flex-col overflow-hidden"
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-1.5 shrink-0 text-center text-[10px] text-gray-500">
        ← 좌우로 밀어서 칸 이동 →
      </p>
    </div>
  )
}
