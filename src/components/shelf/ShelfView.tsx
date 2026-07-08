import type { Ingredient } from '@/types'
import { StorageLevelView } from './StorageLevelView'
import { requestIngredientRecipes } from '@/lib/ingredientActions'

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
      onIngredientLongPress={(ingredient) => requestIngredientRecipes(ingredient.id)}
      emptyMessage={'선반이 비어있어요.\n+ 버튼으로 재료를 추가해보세요!'}
    />
  )
}
