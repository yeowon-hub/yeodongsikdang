import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
  matchScore?: number
  matchedCount?: number
}

export function RecipeCard({ recipe, matchScore, matchedCount }: RecipeCardProps) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
    >
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt=""
          className="h-36 w-full object-cover"
        />
      )}
      <div className="p-4">
      <p className="flex items-start justify-between gap-2">
        <span className="font-semibold text-gray-800">{recipe.title}</span>
        {matchScore !== undefined && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
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
        {matchedCount !== undefined && matchedCount > 0 && (
          <span className="text-green-600">재료 {matchedCount}개 매칭</span>
        )}
      </div>
      {recipe.isBuiltin && (
        <span className="mt-2 inline-block text-[10px] text-gray-400">
          기본 레시피{recipe.builtinCustomized ? ' · 수정됨' : ''}
        </span>
      )}
      </div>
    </Link>
  )
}
