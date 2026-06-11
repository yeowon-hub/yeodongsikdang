import type { Ingredient } from '@/types'
import { StorageLevelView } from './StorageLevelView'

interface ShelfViewProps {
  ingredients: Ingredient[]
  onIngredientClick: (ingredient: Ingredient) => void
}

export function ShelfView({ ingredients, onIngredientClick }: ShelfViewProps) {
  return (
    <StorageLevelView
      title="선반"
      subtitle="실온 보관 · 좌우로 칸 이동"
      ingredients={ingredients}
      onIngredientClick={onIngredientClick}
      levelLabel="칸"
      pageBg="bg-shelf"
      emptyMessage="선반이 비어있어요. + 버튼으로 재료를 추가해보세요!"
      frameStyle={{
        background: 'linear-gradient(180deg, #F5E6D3 0%, #E8D4BC 100%)',
        border: '3px solid #D4B896',
      }}
    />
  )
}
