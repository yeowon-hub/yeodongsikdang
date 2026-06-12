import { formatExpiryDisplay, getExpiryStatus } from '@/lib/recommend'
import type { Ingredient } from '@/types'
import { INGREDIENT_CARD_SIZE } from '@/types'
import { AlertTriangle, Clock } from 'lucide-react'

interface IngredientCardProps {
  ingredient: Ingredient
  onClick?: () => void
  compact?: boolean
  mini?: boolean
  highlighted?: boolean
}

const { compactWidth, compactHeight } = INGREDIENT_CARD_SIZE

export function IngredientCard({ ingredient, onClick, compact, mini, highlighted }: IngredientCardProps) {
  const expiryStatus = getExpiryStatus(ingredient.expiryDate)

  return (
    <button
      type="button"
      onClick={onClick}
      style={
        compact
          ? { width: compactWidth, height: compactHeight, minWidth: compactWidth, maxWidth: compactWidth }
          : undefined
      }
      className={`group relative flex shrink-0 grow-0 flex-col items-stretch overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
        highlighted
          ? 'z-10 border-header ring-2 ring-header ring-offset-1'
          : expiryStatus === 'expired'
            ? 'border-red-300 bg-red-50'
            : expiryStatus === 'soon'
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-100'
      } ${
        mini
          ? 'min-w-[56px] max-w-[64px] p-1'
          : compact
            ? 'box-border p-1'
            : 'w-full p-3'
      }`}
    >
      {ingredient.imageUrl && (
        <img
          src={ingredient.imageUrl}
          alt=""
          className={`w-full shrink-0 object-cover ${
            mini ? 'mb-0.5 h-8' : compact ? 'mb-0.5 h-7' : 'mb-2 h-24'
          }`}
        />
      )}
      <span
        className={`block w-full truncate font-medium text-gray-800 ${
          mini ? 'px-0.5 text-[10px] leading-tight' : compact ? 'text-[10px] leading-tight' : ''
        }`}
      >
        {ingredient.name}
      </span>
      <span
        className={`block w-full truncate text-gray-500 ${
          mini ? 'px-0.5 text-[9px] leading-tight' : compact ? 'text-[9px] leading-tight' : 'mt-0.5 text-xs'
        }`}
      >
        {ingredient.quantity}
        {ingredient.unit}
      </span>
      {ingredient.expiryDate && !mini && (
        <span
          className={`mt-auto flex w-full items-center gap-0.5 truncate ${
            compact ? 'text-[8px]' : 'text-[10px]'
          } ${
            expiryStatus === 'expired'
              ? 'text-red-600'
              : expiryStatus === 'soon'
                ? 'text-amber-600'
                : 'text-gray-400'
          }`}
        >
          {expiryStatus === 'expired' ? (
            <AlertTriangle size={compact ? 8 : 10} className="shrink-0" />
          ) : expiryStatus === 'soon' ? (
            <Clock size={compact ? 8 : 10} className="shrink-0" />
          ) : null}
          <span className="truncate">{formatExpiryDisplay(ingredient.expiryDate)}</span>
        </span>
      )}
    </button>
  )
}
