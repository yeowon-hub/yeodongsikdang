import { motion } from 'framer-motion'
import { ChevronRight, Refrigerator, Snowflake } from 'lucide-react'

const DOOR_THEMES = {
  fridge: {
    gradient: 'linear-gradient(145deg, #D4E8F5 0%, #A8CCE0 50%, #8BB8D0 100%)',
    border: '#7AA8C0',
  },
  freezer: {
    gradient: 'linear-gradient(145deg, #E8F4FF 0%, #B8D4F0 50%, #8AACD4 100%)',
    border: '#7A9CC0',
  },
  kimchi_fridge: {
    gradient: 'linear-gradient(145deg, #F5E6D3 0%, #E8C9A0 50%, #D4B896 100%)',
    border: '#C4A574',
  },
  kimchi_freezer: {
    gradient: 'linear-gradient(145deg, #EDE0D0 0%, #D8C4A8 50%, #C4B08C 100%)',
    border: '#B89A6A',
  },
} as const

interface CompartmentDoorProps {
  side: 'left' | 'right'
  shortLabel: string
  kind: 'fridge' | 'freezer'
  unitId: 'general' | 'kimchi'
  isOpen: boolean
  onOpen: () => void
}

export function CompartmentDoor({
  side,
  shortLabel,
  kind,
  unitId,
  isOpen,
  onOpen,
}: CompartmentDoorProps) {
  const themeKey =
    unitId === 'kimchi'
      ? kind === 'freezer'
        ? 'kimchi_freezer'
        : 'kimchi_fridge'
      : kind
  const theme = DOOR_THEMES[themeKey]
  const Icon = kind === 'freezer' ? Snowflake : Refrigerator
  const hinge = side === 'left' ? 'right center' : 'left center'
  const openRotate = side === 'left' ? -102 : 102

  return (
    <motion.div
      className="relative min-h-0 min-w-0 flex-1"
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
    >
      <motion.button
        type="button"
        onClick={onOpen}
        disabled={isOpen}
        aria-label={`${shortLabel} 문 열기`}
        className="relative h-full min-h-[min(480px,calc(100dvh-12rem))] w-full border-0 bg-transparent p-0 disabled:pointer-events-none"
        style={{ transformOrigin: hinge }}
        animate={{
          rotateY: isOpen ? openRotate : 0,
          opacity: isOpen ? 0 : 1,
        }}
        initial={{ rotateY: side === 'left' ? -24 : 24, opacity: 0.85 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        whileTap={isOpen ? undefined : { scale: 0.99 }}
      >
        <div
          className="flex h-full w-full flex-col overflow-hidden shadow-2xl"
          style={{
            background: theme.gradient,
            border: `4px solid ${theme.border}`,
            borderRadius: side === 'left' ? '16px 4px 4px 16px' : '4px 16px 16px 4px',
          }}
        >
          <div className="h-2 shrink-0 bg-gradient-to-b from-white/40 to-transparent" />
          <div className="relative flex flex-1 flex-col items-center justify-center px-3 py-4">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/35 shadow-inner">
              <Icon size={36} strokeWidth={1.5} className="text-white drop-shadow-sm" />
            </div>
            <p className="text-base font-bold text-white drop-shadow-sm">{shortLabel}</p>
            <p className="mt-1 text-[11px] font-medium text-white/90">탭하여 열기</p>
            {side === 'right' && (
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <ChevronRight size={20} className="text-white/80" />
              </motion.div>
            )}
            {side === 'left' && (
              <motion.div
                animate={{ x: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rotate-180"
              >
                <ChevronRight size={20} className="text-white/80" />
              </motion.div>
            )}
          </div>
          <div className="h-3 shrink-0 bg-gradient-to-t from-gray-500/20 to-transparent" />
        </div>
      </motion.button>
    </motion.div>
  )
}
