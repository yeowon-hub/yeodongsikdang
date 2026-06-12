import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useIngredients } from '@/hooks/useIngredients'
import { recommendRecipes } from '@/lib/recommend'
import { RecommendList } from '@/components/recipe/RecommendList'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { CATEGORIES } from '@/types'

type Tab = 'recommend' | 'my' | 'all'

export function RecipesPage() {
  const [tab, setTab] = useState<Tab>('recommend')
  const [formOpen, setFormOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('전체')
  const { recipes, myRecipes, builtinRecipes, addRecipe } = useRecipes()
  const { ingredients } = useIngredients()

  const matches = useMemo(
    () => recommendRecipes(recipes, ingredients),
    [recipes, ingredients],
  )

  const filteredBuiltin =
    categoryFilter === '전체'
      ? builtinRecipes
      : builtinRecipes.filter((r) => r.category === categoryFilter)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'recommend', label: '추천' },
    { id: 'my', label: '내 레시피' },
    { id: 'all', label: '전체' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#D8F2EE] px-4 py-4 pb-24">
      <h2 className="mb-3 text-base font-bold text-gray-800">레시피</h2>
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-800'
                : 'bg-white/60 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recommend' && <RecommendList matches={matches} />}

      {tab === 'my' && (
        <div className="space-y-3">
          {myRecipes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              아직 기록한 레시피가 없어요.
              <br />+ 버튼으로 나만의 레시피를 추가해보세요!
            </p>
          ) : (
            myRecipes.map((r) => <RecipeCard key={r.id} recipe={r} />)
          )}
        </div>
      )}

      {tab === 'all' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {['전체', ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  categoryFilter === c ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredBuiltin.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setFormOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark active:scale-95"
        aria-label="레시피 추가"
      >
        <Plus size={28} />
      </button>

      <RecipeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (data) => {
          await addRecipe(data)
        }}
      />
    </div>
  )
}
