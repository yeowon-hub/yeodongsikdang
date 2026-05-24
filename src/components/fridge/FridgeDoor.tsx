import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Refrigerator, Snowflake } from 'lucide-react'
import type { StorageLocation } from '@/types'
import { STORAGE_META } from '@/types'

interface FridgeDoorProps {
  location: StorageLocation
  isOpen: boolean
  onToggle: () => void
}

const DOOR_THEMES: Record<
  'fridge' | 'freezer',
  { gradient: string; border: string }
> = {
  fridge: {
    gradient: 'linear-gradient(145deg, #D4E8F5 0%, #A8CCE0 50%, #8BB8D0 100%)',
    border: '#7AA8C0',
  },
  freezer: {
    gradient: 'linear-gradient(145deg, #E8F4FF 0%, #B8D4F0 50%, #8AACD4 100%)',
    border: '#7A9CC0',
  },
}

export function FridgeDoor({ location, isOpen, onToggle }: FridgeDoorProps) {
  const [hint, setHint] = useState(true)
  const meta = STORAGE_META[location]
  const isFreezer = meta.kind === 'freezer'
  const theme = DOOR_THEMES[isFreezer ? 'freezer' : 'fridge']
  const Icon = isFreezer ? Snowflake : Refrigerator

  const handleOpen = () => {
    setHint(false)
    onToggle()
  }

  if (isOpen) return null

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col px-3 py-2"
      style={{ perspective: '1200px' }}
    >
      <motion.button
        type="button"
        onClick={handleOpen}
        className="relative flex h-full min-h-[min(520px,calc(100dvh-11rem))] w-full max-w-full cursor-pointer flex-col border-0 bg-transparent p-0"
        aria-label={meta.label + ' \uBB38 \uC5F4\uAE30'}
        whileTap={{ scale: 0.99 }}
      >
        <div
          className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: theme.gradient,
            border: `4px solid ${theme.border}`,
          }}
        >
          <div className="h-3 shrink-0 bg-gradient-to-b from-white/40 to-transparent" />

          <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/35 shadow-inner">
                <Icon size={44} strokeWidth={1.5} className="text-white drop-shadow-sm" />
              </div>
              <p className="text-lg font-bold text-white drop-shadow-sm">{meta.label}</p>
            </div>

            <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2 sm:right-6">
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="flex h-24 w-5 flex-col items-center justify-center rounded-full shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, #C0C0C0, #E8E8E8, #C0C0C0)',
                  border: '1px solid #999',
                }}
              >
                <div className="h-10 w-1 rounded-full bg-gray-500" />
              </motion.div>
            </div>

            {hint && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-0 right-0 z-10 px-4 text-center text-sm font-medium text-white drop-shadow"
              >
                {'\uD0ED\uD574\uC11C '}
                {meta.label}
                {'\uC744 \uC5F4\uC5B4\uBCF4\uC138\uC694'}
                <ChevronRight className="ml-0.5 inline" size={16} />
              </motion.p>
            )}
          </div>

          <div className="h-4 shrink-0 bg-gradient-to-t from-gray-400/30 to-transparent" />
        </div>
      </motion.button>
    </div>
  )
}
