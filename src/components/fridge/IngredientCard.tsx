import { getExpiryStatus } from '@/lib/recommend'
import type { Ingredient } from '@/types'
import { AlertTriangle, Clock } from 'lucide-react'

interface IngredientCardProps {
  ingredient: Ingredient
  onClick?: () => void
  compact?: boolean
  mini?: boolean
}

export function IngredientCard({ ingredient, onClick, compact, mini }: IngredientCardProps) {
  const expiryStatus = getExpiryStatus(ingredient.expiryDate)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex shrink-0 flex-col items-stretch overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
        expiryStatus === 'expired'
          ? 'border-red-300 bg-red-50'
          : expiryStatus === 'soon'
            ? 'border-amber-300 bg-amber-50'
            : 'border-gray-100'
      } ${
        mini
          ? 'min-w-[56px] max-w-[64px] p-1'
          : compact
            ? 'min-w-[88px] max-w-[calc(50%-0.25rem)] p-2'
            : 'w-full p-3'
      }`}
    >
      {ingredient.imageUrl && (
        <img
          src={ingredient.imageUrl}
          alt=""
          className={`w-full object-cover ${
            mini ? 'mb-0.5 h-8' : compact ? 'mb-1 h-14' : 'mb-2 h-24'
          }`}
        />
      )}
      <span
        className={`truncate font-medium text-gray-800 ${mini ? 'w-full px-0.5 text-[10px] leading-tight' : compact ? 'px-0.5' : ''}`}
      >
        {ingredient.name}
      </span>
      <span
        className={`text-gray-500 ${mini ? 'px-0.5 text-[9px] leading-tight' : compact ? 'px-0.5' : ''} ${mini ? '' : 'mt-0.5 text-xs'}`}
      >
        {ingredient.quantity}
        {ingredient.unit}
      </span>
      {ingredient.expiryDate && !mini && (
        <span
          className={`mt-1 flex items-center gap-0.5 text-[10px] ${
            expiryStatus === 'expired'
              ? 'text-red-600'
              : expiryStatus === 'soon'
                ? 'text-amber-600'
                : 'text-gray-400'
          }`}
        >
          {expiryStatus === 'expired' ? (
            <AlertTriangle size={10} />
          ) : expiryStatus === 'soon' ? (
            <Clock size={10} />
          ) : null}
          {ingredient.expiryDate}
        </span>
      )}
    </button>
  )
}
