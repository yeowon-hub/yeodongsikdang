import type { Ingredient } from '@/types'
import { StorageLevelView } from './StorageLevelView'

interface ShelfViewProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

export function ShelfView({ ingredients, onIngredientClick }: ShelfViewProps) {
  return (
    <StorageLevelView
      designId="shelf"
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      emptyMessage={'선반이 비어있어요.\n+ 버튼으로 재료를 추가해보세요!'}
    />
  )
}
