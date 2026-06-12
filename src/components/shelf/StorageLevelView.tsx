import type { Ingredient } from '@/types'
import { DryStorageView } from '@/components/storage/DryStorageView'
import type { StorageDesignId } from '@/lib/storageDesignSpec'

interface StorageLevelViewProps {
  designId: Extract<StorageDesignId, 'shelf' | 'pantry'>
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
  emptyMessage: string
}

export function StorageLevelView({
  designId,
  ingredients,
  onIngredientClick,
  emptyMessage,
}: StorageLevelViewProps) {
  return (
    <DryStorageView
      designId={designId}
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      emptyMessage={emptyMessage}
    />
  )
}
