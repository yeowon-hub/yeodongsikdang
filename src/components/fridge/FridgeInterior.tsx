import type { Ingredient, FridgeUnitId, StorageLocation } from '@/types'
import { STORAGE_META } from '@/types'
import { getFridgeUnitTheme } from '@/lib/mainTabs'
import {
  LevelStackInterior,
  getLevelStackFrameStyle,
  type LevelStackTheme,
} from '@/components/shared/LevelStackInterior'

interface FridgeInteriorProps {
  unitId: FridgeUnitId
  location: StorageLocation
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

export function FridgeInterior({
  unitId,
  location,
  ingredients,
  onIngredientClick,
}: FridgeInteriorProps) {
  const meta = STORAGE_META[location]
  const theme = getFridgeUnitTheme(unitId)

  return (
    <LevelStackInterior
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      theme={theme}
      levelLabel="단"
      headerLabel={meta.shortLabel}
      emptyMessage={`${meta.shortLabel}이 비어있어요.\n+ 버튼으로 재료를 추가해보세요!`}
      dividerVariant="metal"
    />
  )
}

export function getFridgeFrameStyle(unitId: FridgeUnitId) {
  return getLevelStackFrameStyle(getFridgeUnitTheme(unitId))
}

export type { LevelStackTheme }
