import type { Ingredient } from '@/types'
import { StorageLevelView } from '@/components/shelf/StorageLevelView'
import { requestIngredientRecipes } from '@/lib/ingredientActions'

interface PantryViewProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

export function PantryView({ ingredients, onIngredientClick }: PantryViewProps) {
  return (
    <StorageLevelView
      designId="pantry"
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      onIngredientLongPress={(ingredient) => requestIngredientRecipes(ingredient.id)}
      emptyMessage={'펜트리가 비어있어요.\n+ 버튼으로 재료를 추가해보세요!'}
    />
  )
}
