import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HOME_BODY_FLEX } from '@/lib/homeDesignSpec'

const DESIGN_W = 360
const DESIGN_H = HOME_BODY_FLEX

interface HomeViewportProps {
  children: ReactNode
}

/** 홈 본문(360×511.3)을 비율 유지하며 남은 영역에 맞게 축소 */
export function HomeViewport({ children }: HomeViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const { clientWidth: cw, clientHeight: ch } = el
      if (!cw || !ch) return
      setScale(Math.min(cw / DESIGN_W, ch / DESIGN_H, 1))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
    >
      <div
        className="relative flex shrink-0 flex-col overflow-hidden"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
