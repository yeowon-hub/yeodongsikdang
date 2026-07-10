import { useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useRecipe, useRecipes } from '@/hooks/useRecipes'
import { useIngredients } from '@/hooks/useIngredients'
import { useRecipeBubbleOptional } from '@/contexts/RecipeBubbleContext'
import { RecipeDetailView } from '@/components/recipe/RecipeDetail'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { useSuppressGlobalAddFab } from '@/contexts/GlobalAddFabContext'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useRecipe(id)
  const { ingredients } = useIngredients()
  const bubble = useRecipeBubbleOptional()
  const { updateRecipe, deleteRecipe } = useRecipes()
  const [editOpen, setEditOpen] = useState(false)
  useSuppressGlobalAddFab(editOpen)

  const ingredientsForMatch = useMemo(() => {
    const bubbleOnly = (bubble?.bubbleIngredients ?? []).filter(
      (item) => !ingredients.some((ing) => ing.id === item.id),
    )
    return [...ingredients, ...bubbleOnly]
  }, [ingredients, bubble?.bubbleIngredients])

  if (recipe === undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#D8F2EE]">
        <p className="py-8 text-center text-sm text-gray-500">불러오는 중...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#D8F2EE]">
        <p className="py-8 text-center text-sm text-gray-500">레시피를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#D8F2EE]">
        <RecipeDetailView
          recipe={recipe}
          ingredients={ingredientsForMatch}
          onEdit={!recipe.isBuiltin ? () => setEditOpen(true) : undefined}
          onDelete={
            !recipe.isBuiltin
              ? async () => {
                  await deleteRecipe(recipe.id)
                  navigate('/recipes')
                }
              : undefined
          }
        />
      </div>
      {!recipe.isBuiltin && (
        <RecipeForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={recipe}
          onSubmit={async (data) => {
            await updateRecipe(recipe.id, data)
          }}
          onDelete={async () => {
            await deleteRecipe(recipe.id)
            navigate('/recipes')
          }}
        />
      )}
    </>
  )
}
