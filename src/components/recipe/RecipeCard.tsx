import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
  matchScore?: number
  missingCount?: number
}

export function RecipeCard({ recipe, matchScore, missingCount }: RecipeCardProps) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
    >
      <p className="flex items-start justify-between gap-2">
        <span className="font-semibold text-gray-800">{recipe.title}</span>
        {matchScore !== undefined && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
              matchScore >= 70
                ? 'bg-green-100 text-green-700'
                : matchScore >= 40
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {matchScore}%
          </span>
        )}
      </p>
      {recipe.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{recipe.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {recipe.category && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5">{recipe.category}</span>
        )}
        {recipe.cookingTime && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {recipe.cookingTime}분
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {recipe.servings}인분
          </span>
        )}
        {missingCount !== undefined && missingCount > 0 && (
          <span className="text-amber-600">{missingCount}개 재료 부족</span>
        )}
      </div>
      {recipe.isBuiltin && (
        <span className="mt-2 inline-block text-[10px] text-gray-400">기본 레시피</span>
      )}
    </Link>
  )
}
