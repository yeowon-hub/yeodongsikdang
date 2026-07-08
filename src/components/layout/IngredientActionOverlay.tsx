import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { CircleHelp, MessageCircle, Trash2, X } from 'lucide-react'
import { useIngredients } from '@/hooks/useIngredients'
import { useRecipes } from '@/hooks/useRecipes'
import { INGREDIENT_RECIPE_EVENT } from '@/lib/ingredientActions'
import { getRecipeRoute } from '@/lib/navigation'
import { recipeUsesIngredient } from '@/lib/recommend'
import type { Ingredient, Recipe } from '@/types'

const DRAG_MIME = 'application/x-yeodong-ingredient-id'
const ACTION_PATHS = ['/home', '/fridge', '/shelf', '/pantry']

function getDraggedIngredientId(e: React.DragEvent) {
  return e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain')
}

function recipeMatchesIngredient(recipe: Recipe, ingredient: Ingredient) {
  return recipeUsesIngredient(recipe, ingredient.name)
}

export function IngredientActionOverlay() {
  const location = useLocation()
  const navigate = useNavigate()
  const { ingredients, deleteIngredient } = useIngredients()
  const { recipes } = useRecipes()
  const [trashOver, setTrashOver] = useState(false)
  const [balloonOver, setBalloonOver] = useState(false)
  const [balloonIngredientId, setBalloonIngredientId] = useState<string | null>(null)
  const [recipeIngredientId, setRecipeIngredientId] = useState<string | null>(null)

  const visible = ACTION_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
  const balloonIngredient = ingredients.find((item) => item.id === balloonIngredientId) ?? null
  const recipeIngredient = ingredients.find((item) => item.id === recipeIngredientId) ?? null
  const matchedRecipes = useMemo(() => {
    if (!recipeIngredient) return []
    return recipes.filter((recipe) => recipeMatchesIngredient(recipe, recipeIngredient))
  }, [recipeIngredient, recipes])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ ingredientId?: string }>).detail
      if (detail?.ingredientId) setRecipeIngredientId(detail.ingredientId)
    }
    window.addEventListener(INGREDIENT_RECIPE_EVENT, handler)
    return () => window.removeEventListener(INGREDIENT_RECIPE_EVENT, handler)
  }, [])

  if (!visible) return null

  const handleDropToTrash = async (e: React.DragEvent) => {
    e.preventDefault()
    setTrashOver(false)
    const id = getDraggedIngredientId(e)
    if (!id) return
    await deleteIngredient(id)
    if (balloonIngredientId === id) setBalloonIngredientId(null)
    if (recipeIngredientId === id) setRecipeIngredientId(null)
  }

  const handleDropToBalloon = (e: React.DragEvent) => {
    e.preventDefault()
    setBalloonOver(false)
    const id = getDraggedIngredientId(e)
    if (id && ingredients.some((item) => item.id === id)) setBalloonIngredientId(id)
  }

  const openRecipeList = () => {
    if (balloonIngredientId) setRecipeIngredientId(balloonIngredientId)
  }

  return createPortal(
    <>
      <div
        className="fixed right-4 top-[4.75rem] z-40 flex flex-col items-center gap-1"
        onDragOver={(e) => {
          e.preventDefault()
          setBalloonOver(true)
        }}
        onDragLeave={() => setBalloonOver(false)}
        onDrop={handleDropToBalloon}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white shadow-lg transition-all ${
            balloonOver ? 'scale-110 border-header bg-header/20' : 'border-header/30'
          }`}
          aria-label="추천 재료 담기"
        >
          <MessageCircle size={25} className="text-header-text" />
        </div>
        <button
          type="button"
          onClick={openRecipeList}
          disabled={!balloonIngredient}
          className="flex h-8 min-w-8 items-center justify-center rounded-full bg-header px-2 text-header-text shadow-md disabled:bg-gray-200 disabled:text-gray-400"
          aria-label="담은 재료 추천 레시피 보기"
        >
          <CircleHelp size={18} />
          {balloonIngredient && (
            <span className="ml-1 max-w-16 truncate text-[10px] font-semibold">{balloonIngredient.name}</span>
          )}
        </button>
      </div>

      <div
        className={`fixed left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white shadow-lg transition-all ${
          trashOver ? 'scale-110 border-red-300 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'
        }`}
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setTrashOver(true)
        }}
        onDragLeave={() => setTrashOver(false)}
        onDrop={handleDropToTrash}
        aria-label="재료 삭제"
      >
        <Trash2 size={24} />
      </div>

      {recipeIngredient && (
        <div className="fixed inset-0 z-[95] flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="닫기"
            onClick={() => setRecipeIngredientId(null)}
          />
          <div className="relative w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-header/20 text-header-text">
                <MessageCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-800">{recipeIngredient.name} 추천 레시피</h2>
                <p className="text-xs text-gray-500">이 재료를 포함하거나 대체해서 쓸 수 있는 레시피</p>
              </div>
              <button
                type="button"
                onClick={() => setRecipeIngredientId(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                aria-label="닫기"
              >
                <X size={17} />
              </button>
            </div>

            {matchedRecipes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                아직 이 재료를 포함한 추천 레시피가 없어요.
              </p>
            ) : (
              <div className="max-h-[60dvh] space-y-2 overflow-y-auto pr-1">
                {matchedRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => {
                      setRecipeIngredientId(null)
                      navigate(getRecipeRoute(recipe.id))
                    }}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left hover:bg-header/10"
                  >
                    <p className="font-semibold text-gray-800">{recipe.title}</p>
                    {recipe.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{recipe.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}
