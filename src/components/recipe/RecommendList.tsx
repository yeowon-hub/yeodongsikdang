import type { RecipeMatch } from '@/types'
import { RecipeCard } from './RecipeCard'

interface RecommendListProps {
  matches: RecipeMatch[]
}

export function RecommendList({ matches }: RecommendListProps) {
  const ready = matches.filter((m) => m.tier === 'ready')
  const almost = matches.filter((m) => m.tier === 'almost')

  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        재료를 등록하면 맞춤 레시피를 추천해드려요!
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {ready.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-green-700">지금 만들 수 있어요</h3>
          <div className="space-y-3">
            {ready.map((m) => (
              <RecipeCard
                key={m.recipe.id}
                recipe={m.recipe}
                matchScore={m.matchScore}
              />
            ))}
          </div>
        </section>
      )}
      {almost.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-amber-700">재료 조금만 더 있으면</h3>
          <div className="space-y-3">
            {almost.map((m) => (
              <RecipeCard
                key={m.recipe.id}
                recipe={m.recipe}
                matchScore={m.matchScore}
                missingCount={m.missingIngredients.length}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
