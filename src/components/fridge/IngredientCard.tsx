import { formatExpiryDisplay, getExpiryStatus } from '@/lib/recommend'
import type { Ingredient } from '@/types'
import { INGREDIENT_CARD_SIZE } from '@/types'
import { AlertTriangle, Clock } from 'lucide-react'

interface IngredientCardProps {
  ingredient: Ingredient
  onClick?: () => void
  compact?: boolean
  mini?: boolean
  banner?: boolean
  highlighted?: boolean
  asDiv?: boolean
}

const { compactWidth, compactHeight } = INGREDIENT_CARD_SIZE
const BANNER_WIDTH = 92
const BANNER_HEIGHT = 90

export function IngredientCard({
  ingredient,
  onClick,
  compact,
  mini,
  banner,
  highlighted,
  asDiv,
}: IngredientCardProps) {
  const expiryStatus = getExpiryStatus(ingredient.expiryDate)
  const Tag = asDiv ? 'div' : 'button'

  return (
    <Tag
      type={asDiv ? undefined : 'button'}
      onClick={asDiv ? undefined : onClick}
      style={
        compact
          ? { width: compactWidth, height: compactHeight, minWidth: compactWidth, maxWidth: compactWidth }
          : banner
            ? {
                width: BANNER_WIDTH,
                height: BANNER_HEIGHT,
                minWidth: BANNER_WIDTH,
                maxWidth: BANNER_WIDTH,
              }
            : undefined
      }
      className={`group relative flex shrink-0 grow-0 flex-col items-stretch overflow-hidden text-left ${
        banner
          ? 'rounded-lg bg-white/92 shadow-sm'
          : 'rounded-xl border bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]'
      } ${
        highlighted
          ? 'z-10 border-header ring-2 ring-header ring-offset-1'
          : !banner &&
              (expiryStatus === 'expired'
                ? 'border-red-300 bg-red-50'
                : expiryStatus === 'soon'
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-gray-100')
      } ${
        mini
          ? 'min-w-[56px] max-w-[64px] p-1'
          : banner
            ? 'box-border p-1.5'
            : compact
              ? 'box-border p-1'
              : 'w-full p-3'
      }`}
    >
      <span
        className={`block w-full shrink-0 truncate font-medium text-gray-800 ${
          mini
            ? 'px-0.5 text-[10px] leading-tight'
            : banner
              ? 'text-[11px] font-semibold leading-tight'
              : compact
                ? 'text-[10px] leading-tight'
                : ''
        }`}
      >
        {ingredient.name}
      </span>
      {!banner && (
        <span
          className={`block w-full shrink-0 truncate text-gray-500 ${
            mini ? 'px-0.5 text-[9px] leading-tight' : compact ? 'text-[9px] leading-tight' : 'mt-0.5 text-xs'
          }`}
        >
          {ingredient.quantity}
          {ingredient.unit}
        </span>
      )}
      {ingredient.expiryDate && !mini && (
        <span
          className={`flex w-full shrink-0 items-center gap-0.5 truncate ${
            banner ? 'text-[10px]' : compact ? 'text-[8px]' : 'text-[10px]'
          } ${
            expiryStatus === 'expired'
              ? 'text-red-600'
              : expiryStatus === 'soon'
                ? 'text-amber-600'
                : 'text-gray-400'
          }`}
        >
          {expiryStatus === 'expired' ? (
            <AlertTriangle size={banner ? 10 : compact ? 8 : 10} className="shrink-0" />
          ) : expiryStatus === 'soon' ? (
            <Clock size={banner ? 10 : compact ? 8 : 10} className="shrink-0" />
          ) : null}
          <span className="truncate">{formatExpiryDisplay(ingredient.expiryDate)}</span>
        </span>
      )}
      {ingredient.imageUrl ? (
        <img
          src={ingredient.imageUrl}
          alt=""
          className={`mt-auto w-full shrink-0 object-cover ${
            mini
              ? 'mt-0.5 h-8'
              : banner
                ? 'h-10 rounded-md'
                : compact
                  ? 'mt-0.5 h-7'
                  : 'mt-2 h-24'
          }`}
        />
      ) : (
        banner && <div className="mt-auto h-10 shrink-0" aria-hidden />
      )}
    </Tag>
  )
}
