import type { FridgeUnitId } from '@/types'
import { getFridgeUnitTheme } from '@/lib/mainTabs'
import { getLevelStackFrameStyle, type LevelStackTheme } from '@/components/shared/LevelStackInterior'

export function getFridgeFrameStyle(unitId: FridgeUnitId) {
  return getLevelStackFrameStyle(getFridgeUnitTheme(unitId))
}

export type { LevelStackTheme }
