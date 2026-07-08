import type { Ingredient } from '@/types'
import { DryStorageView } from '@/components/storage/DryStorageView'
import type { StorageDesignId } from '@/lib/storageDesignSpec'

interface StorageLevelViewProps {
  designId: Extract<StorageDesignId, 'shelf' | 'pantry'>
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  onIngredientLongPress?: (ingredient: Ingredient) => void
  emptyMessage: string
}

export function StorageLevelView({
  designId,
  ingredients,
  onIngredientClick,
  onIngredientLongPress,
  emptyMessage,
}: StorageLevelViewProps) {
  return (
    <DryStorageView
      designId={designId}
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      onIngredientLongPress={onIngredientLongPress}
      emptyMessage={emptyMessage}
    />
  )
}
