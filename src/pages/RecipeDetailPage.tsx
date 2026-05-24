import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useRecipe, useRecipes } from '@/hooks/useRecipes'
import { useIngredients } from '@/hooks/useIngredients'
import { RecipeDetailView } from '@/components/recipe/RecipeDetail'
import { RecipeForm } from '@/components/recipe/RecipeForm'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useRecipe(id)
  const { ingredients } = useIngredients()
  const { updateRecipe, deleteRecipe } = useRecipes()
  const [editOpen, setEditOpen] = useState(false)

  if (recipe === undefined) {
    return <p className="py-8 text-center text-sm text-gray-500">불러오는 중...</p>
  }

  if (!recipe) {
    return <p className="py-8 text-center text-sm text-gray-500">레시피를 찾을 수 없습니다.</p>
  }

  return (
    <>
      <RecipeDetailView
        recipe={recipe}
        ingredients={ingredients}
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
      {!recipe.isBuiltin && (
        <RecipeForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={recipe}
          onSubmit={async (data) => {
            await updateRecipe(recipe.id, data)
          }}
        />
      )}
    </>
  )
}
