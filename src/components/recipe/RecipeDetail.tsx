import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { Recipe } from '@/types'
import { getAvailableNames, hasMatchedIngredient } from '@/lib/recommend'
import type { Ingredient } from '@/types'

interface RecipeDetailProps {
  recipe: Recipe
  ingredients: Ingredient[]
  onEdit?: () => void
  onDelete?: () => void
}

export function RecipeDetailView({ recipe, ingredients, onEdit, onDelete }: RecipeDetailProps) {
  const available = getAvailableNames(ingredients)

  return (
    <div className="px-4 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      <Link to="/recipes" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500">
        <ArrowLeft size={16} />
        레시피 노트
      </Link>

      <h2 className="text-2xl font-bold text-gray-800">{recipe.title}</h2>
      {recipe.description && <p className="mt-2 text-sm text-gray-600">{recipe.description}</p>}

      {recipe.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <ExternalLink size={14} />
          참고 링크 열기
        </a>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
        {recipe.cookingTime && (
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {recipe.cookingTime}분
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center gap-1">
            <Users size={14} />
            {recipe.servings}인분
          </span>
        )}
        {recipe.category && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{recipe.category}</span>
        )}
      </div>

      <section className="mt-6">
        <h3 className="mb-3 font-semibold text-gray-800">재료</h3>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => {
            const has = hasMatchedIngredient(available, ing.name)
            return (
              <li
                key={i}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  ing.isOptional
                    ? 'bg-gray-50 text-gray-500'
                    : has
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-700'
                }`}
              >
                <span>
                  {ing.name}
                  {ing.isOptional && ' (선택)'}
                </span>
                <span className="text-xs">
                  {ing.quantity}
                  {ing.unit}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 font-semibold text-gray-800">조리 순서</h3>
        <ol className="space-y-3">
          {recipe.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.order} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-header text-xs font-bold text-header-text">
                  {step.order}
                </span>
                <span className="pt-0.5 text-gray-700">{step.text}</span>
              </li>
            ))}
        </ol>
      </section>

      {!recipe.isBuiltin && (onEdit || onDelete) && (
        <div className="mt-8 flex gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700"
            >
              <Pencil size={16} />
              수정
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600"
            >
              <Trash2 size={16} />
              삭제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
