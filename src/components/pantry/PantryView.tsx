import type { Ingredient } from '@/types'
import { StorageLevelView } from '@/components/shelf/StorageLevelView'

interface PantryViewProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

export function PantryView({ ingredients, onIngredientClick }: PantryViewProps) {
  return (
    <StorageLevelView
      title="펜트리"
      subtitle="건식·통조림 보관 · 좌우로 칸 이동"
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      levelLabel="칸"
      pageBg="bg-pantry"
      emptyMessage="펜트리가 비어있어요. + 버튼으로 재료를 추가해보세요!"
      frameStyle={{
        background: 'linear-gradient(180deg, #EDE7F6 0%, #D1C4E9 100%)',
        border: '3px solid #B39DDB',
      }}
    />
  )
}
