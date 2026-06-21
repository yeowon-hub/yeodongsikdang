import {
  LevelStackInterior,
  getLevelStackFrameStyle,
} from '@/components/shared/LevelStackInterior'
import { getStorageDesign, type StorageDesignId } from '@/lib/storageDesignSpec'
import type { Ingredient } from '@/types'
import { StoragePageShell } from './StoragePageShell'

type DryStorageDesignId = Extract<StorageDesignId, 'shelf' | 'pantry'>

interface DryStorageViewProps {
  designId: DryStorageDesignId
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  onIngredientMoveToLevel?: (ingredientId: string, level: number) => void
  focusLevel?: number
  focusIngredientId?: string
  emptyMessage: string
}

export function DryStorageView({
  designId,
  ingredients,
  onIngredientClick,
  onIngredientMoveToLevel,
  focusLevel,
  focusIngredientId,
  emptyMessage,
}: DryStorageViewProps) {
  const design = getStorageDesign(designId)
  const theme = { bg: design.cardBg, border: design.cardBorder }

  return (
    <StoragePageShell designId={designId}>
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] shadow-md"
          style={getLevelStackFrameStyle(theme)}
        >
          <LevelStackInterior
            ingredients={ingredients}
            onIngredientClick={onIngredientClick}
            onIngredientMoveToLevel={onIngredientMoveToLevel}
            theme={theme}
            levelLabel="칸"
            focusLevel={focusLevel}
            focusIngredientId={focusIngredientId}
            emptyMessage={emptyMessage}
            dividerVariant="wood"
          />
        </div>
      </div>
    </StoragePageShell>
  )
}
