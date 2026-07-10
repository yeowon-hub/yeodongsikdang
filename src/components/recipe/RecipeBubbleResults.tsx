import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Ingredient, RecipeMatch } from '@/types'
import { APP_BUILD_LABEL } from '@/lib/appVersion'
import { RecipeCard } from './RecipeCard'

interface RecipeBubbleResultsProps {
  open: boolean
  onClose: () => void
  matches: RecipeMatch[]
  bubbleIngredients: Ingredient[]
  searchedRecipeCount: number
  searching?: boolean
}

export function RecipeBubbleResults({
  open,
  onClose,
  matches,
  bubbleIngredients,
  searchedRecipeCount,
  searching = false,
}: RecipeBubbleResultsProps) {
  if (!open) return null

  const bubbleNames = bubbleIngredients.map((ing) => ing.name).join(', ')

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="flex max-h-[min(80dvh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bubble-results-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 pr-2">
            <h2 id="bubble-results-title" className="text-base font-bold text-gray-800">
              추천 레시피
            </h2>
            <p className="mt-1 text-xs font-medium text-header-text">
              {searching
                ? '저장된 레시피를 검색하는 중...'
                : `저장된 레시피 ${searchedRecipeCount}개 검색 완료`}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              말풍선: {bubbleNames} · 일치 {matches.length}개
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">버전 {APP_BUILD_LABEL}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {searching ? (
            <p className="py-10 text-center text-sm text-gray-500">잠시만 기다려 주세요...</p>
          ) : matches.length === 0 ? (
            <div className="space-y-2 py-10 text-center text-sm text-gray-500">
              <p>말풍선에 추가한 모든 재료를 사용하는 레시피를 찾을 수 없어요.</p>
              <p className="text-xs text-gray-400">
                삼겹살·목살 등은 돼지고기 레시피와 연결됩니다.
                <br />
                위에 &quot;저장된 레시피 N개 검색 완료&quot;가 안 보이면 Ctrl+F5로 새로고침해 주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.recipe.id}>
                  <RecipeCard
                    recipe={m.recipe}
                    matchScore={m.matchScore}
                    matchedCount={bubbleIngredients.length}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-4 py-3">
          <Link
            to="/recipes"
            onClick={onClose}
            className="block rounded-xl bg-header/10 py-2.5 text-center text-sm font-medium text-header-text"
          >
            레시피 노트로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
