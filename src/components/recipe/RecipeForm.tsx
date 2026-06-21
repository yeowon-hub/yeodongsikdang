import { useEffect, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Recipe, RecipeIngredient, RecipeStep } from '@/types'
import { CATEGORIES, UNITS } from '@/types'

interface RecipeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    description?: string
    category?: string
    cookingTime?: number
    servings?: number
    ingredients: RecipeIngredient[]
    steps: RecipeStep[]
    sourceUrl?: string
  }) => void
  initial?: Recipe
}

export function RecipeForm({ open, onClose, onSubmit, initial }: RecipeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '기타')
  const [cookingTime, setCookingTime] = useState(initial?.cookingTime ?? 30)
  const [servings, setServings] = useState(initial?.servings ?? 2)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initial?.ingredients ?? [{ name: '', quantity: '1', unit: '개' }],
  )
  const [steps, setSteps] = useState<RecipeStep[]>(
    initial?.steps ?? [{ order: 1, text: '' }],
  )
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '')

  useEffect(() => {
    if (!open) return
    setTitle(initial?.title ?? '')
    setDescription(initial?.description ?? '')
    setCategory(initial?.category ?? '기타')
    setCookingTime(initial?.cookingTime ?? 30)
    setServings(initial?.servings ?? 2)
    setIngredients(initial?.ingredients ?? [{ name: '', quantity: '1', unit: '개' }])
    setSteps(initial?.steps ?? [{ order: 1, text: '' }])
    setSourceUrl(initial?.sourceUrl ?? '')
  }, [initial, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const validIngredients = ingredients.filter((i) => i.name.trim())
    const validSteps = steps.filter((s) => s.text.trim()).map((s, i) => ({ ...s, order: i + 1 }))
    if (validIngredients.length === 0 || validSteps.length === 0) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      cookingTime,
      servings,
      ingredients: validIngredients,
      steps: validSteps,
      sourceUrl: sourceUrl.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="mx-auto min-h-full max-w-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{initial ? '레시피 수정' : '레시피 작성'}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="레시피 이름"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명 (선택)"
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">참고 링크 (선택)</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="유튜브, 블로그 URL"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              inputMode="url"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={cookingTime}
              onChange={(e) => setCookingTime(Number(e.target.value))}
              className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="분"
            />
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="인분"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">재료</label>
              <button
                type="button"
                onClick={() => setIngredients([...ingredients, { name: '', quantity: '1', unit: '개' }])}
                className="text-xs font-semibold text-header-text hover:text-header-dark"
              >
                <Plus size={14} className="inline" /> 추가
              </button>
            </div>
            {ingredients.map((ing, i) => (
              <div
                key={i}
                className="mb-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const next = [...ingredients]
                      next[i] = { ...ing, name: e.target.value }
                      setIngredients(next)
                    }}
                    placeholder="재료명"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600"
                    aria-label="재료 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-2 flex min-w-0 items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={ing.quantity ?? ''}
                    onChange={(e) => {
                      const next = [...ingredients]
                      next[i] = { ...ing, quantity: e.target.value }
                      setIngredients(next)
                    }}
                    placeholder="수량"
                    aria-label="수량"
                    className="w-[4.75rem] shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-center text-sm"
                  />
                  <select
                    value={ing.unit ?? '개'}
                    onChange={(e) => {
                      const next = [...ingredients]
                      next[i] = { ...ing, unit: e.target.value }
                      setIngredients(next)
                    }}
                    aria-label="단위"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">조리 순서</label>
              <button
                type="button"
                onClick={() => setSteps([...steps, { order: steps.length + 1, text: '' }])}
                className="text-xs font-semibold text-header-text hover:text-header-dark"
              >
                <Plus size={14} className="inline" /> 추가
              </button>
            </div>
            {steps.map((step, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-header/10 text-xs font-bold text-header-text">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={step.text}
                  onChange={(e) => {
                    const next = [...steps]
                    next[i] = { ...step, text: e.target.value }
                    setSteps(next)
                  }}
                  placeholder="조리 방법"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                  className="text-gray-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-header py-3 text-sm font-semibold text-header-text hover:bg-header-dark"
          >
            {initial ? '수정하기' : '저장하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
