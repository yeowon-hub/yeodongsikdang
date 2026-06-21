import { useCallback, useEffect, useState } from 'react'

import { Menu, Plus, Trash2, X } from 'lucide-react'

import { useDragReorder } from '@/hooks/useDragReorder'

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



type KeyedIngredient = RecipeIngredient & { _id: string }

type KeyedStep = RecipeStep & { _id: string }



function withIngredientIds(items: RecipeIngredient[]): KeyedIngredient[] {

  return items.map((item) => ({ ...item, _id: crypto.randomUUID() }))

}



function withStepIds(items: RecipeStep[]): KeyedStep[] {

  return items.map((item, index) => ({

    ...item,

    order: index + 1,

    _id: crypto.randomUUID(),

  }))

}



function newIngredientRow(): KeyedIngredient {

  return { name: '', quantity: '1', unit: '개', _id: crypto.randomUUID() }

}



function newStepRow(order: number): KeyedStep {

  return { order, text: '', _id: crypto.randomUUID() }

}



export function RecipeForm({ open, onClose, onSubmit, initial }: RecipeFormProps) {

  const [title, setTitle] = useState(initial?.title ?? '')

  const [description, setDescription] = useState(initial?.description ?? '')

  const [category, setCategory] = useState(initial?.category ?? '기타')

  const [cookingTime, setCookingTime] = useState(initial?.cookingTime ?? 30)

  const [servings, setServings] = useState(initial?.servings ?? 2)

  const [ingredients, setIngredients] = useState<KeyedIngredient[]>(() =>

    withIngredientIds(initial?.ingredients ?? [{ name: '', quantity: '1', unit: '개' }]),

  )

  const [steps, setSteps] = useState<KeyedStep[]>(() =>

    withStepIds(initial?.steps ?? [{ order: 1, text: '' }]),

  )

  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '')



  const reorderIngredients = useCallback((next: KeyedIngredient[]) => {

    setIngredients(next)

  }, [])



  const reorderSteps = useCallback((next: KeyedStep[]) => {

    setSteps(next.map((step, index) => ({ ...step, order: index + 1 })))

  }, [])



  const ingredientDrag = useDragReorder(ingredients, reorderIngredients)

  const stepDrag = useDragReorder(steps, reorderSteps)



  useEffect(() => {

    if (!open) return

    setTitle(initial?.title ?? '')

    setDescription(initial?.description ?? '')

    setCategory(initial?.category ?? '기타')

    setCookingTime(initial?.cookingTime ?? 30)

    setServings(initial?.servings ?? 2)

    setIngredients(withIngredientIds(initial?.ingredients ?? [{ name: '', quantity: '1', unit: '개' }]))

    setSteps(withStepIds(initial?.steps ?? [{ order: 1, text: '' }]))

    setSourceUrl(initial?.sourceUrl ?? '')

  }, [initial, open])



  if (!open) return null



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    if (!title.trim()) return

    const validIngredients = ingredients

      .filter((i) => i.name.trim())

      .map(({ _id: _ignored, ...item }) => item)

    const validSteps = steps

      .filter((s) => s.text.trim())

      .map(({ _id: _ignored, ...step }, i) => ({ ...step, order: i + 1 }))

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

    <>

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

            <label className="mb-2 block text-sm font-medium text-gray-700">재료</label>

            <p className="mb-2 text-xs text-gray-400">왼쪽 핸들을 길게 눌러 순서를 바꿀 수 있어요</p>

            <div ref={ingredientDrag.containerRef} className="space-y-2">

              {ingredients.map((ing, i) => (

                <div

                  key={ing._id}

                  data-reorder-item

                  className={ingredientDrag.getItemClassName(

                    i,

                    'rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 transition-colors',

                  )}

                >

                  <div className="flex min-w-0 items-center gap-1.5">

                    <button

                      type="button"

                      aria-label="재료 순서 변경"

                      className="flex h-9 w-8 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-lg text-gray-400 active:cursor-grabbing hover:bg-white hover:text-header-text"
                      style={{ touchAction: 'none' }}

                      {...ingredientDrag.bindHandle(i)}

                    >

                      <Menu size={18} />

                    </button>

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

                      onClick={() => setIngredients(ingredients.filter((item) => item._id !== ing._id))}

                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600"

                      aria-label="재료 삭제"

                    >

                      <Trash2 size={16} />

                    </button>

                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-2 pl-9">

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

            <div className="flex justify-end pt-1">

              <button

                type="button"

                onClick={() => setIngredients([...ingredients, newIngredientRow()])}

                className="flex h-10 w-10 items-center justify-center rounded-full bg-header text-header-text shadow-md hover:bg-header-dark active:scale-95"

                aria-label="재료 추가"

              >

                <Plus size={20} strokeWidth={2.5} />

              </button>

            </div>

          </div>



          <div>

            <label className="mb-2 block text-sm font-medium text-gray-700">조리 순서</label>

            <p className="mb-2 text-xs text-gray-400">왼쪽 핸들을 길게 눌러 순서를 바꿀 수 있어요</p>

            <div ref={stepDrag.containerRef} className="space-y-2">

              {steps.map((step, i) => (

                <div

                  key={step._id}

                  data-reorder-item

                  className={stepDrag.getItemClassName(i, 'flex gap-1.5 rounded-xl border border-transparent p-1 transition-colors')}

                >

                  <button

                    type="button"

                    aria-label="조리 순서 변경"

                    className="flex h-8 w-7 shrink-0 cursor-grab touch-none select-none items-center justify-center self-center rounded-lg text-gray-400 active:cursor-grabbing hover:bg-gray-50 hover:text-header-text"
                    style={{ touchAction: 'none' }}

                    {...stepDrag.bindHandle(i)}

                  >

                    <Menu size={18} />

                  </button>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full bg-header/10 text-xs font-bold text-header-text">

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

                    className="min-w-0 flex-1 self-center rounded-lg border border-gray-200 px-3 py-2 text-sm"

                  />

                  <button

                    type="button"

                    onClick={() =>

                      setSteps(

                        steps.filter((item) => item._id !== step._id).map((item, index) => ({

                          ...item,

                          order: index + 1,

                        })),

                      )

                    }

                    className="flex h-8 w-8 shrink-0 items-center justify-center self-center text-gray-400"

                    aria-label="조리 순서 삭제"

                  >

                    <Trash2 size={16} />

                  </button>

                </div>

              ))}

            </div>

            <div className="flex justify-end pt-1">

              <button

                type="button"

                onClick={() => setSteps([...steps, newStepRow(steps.length + 1)])}

                className="flex h-10 w-10 items-center justify-center rounded-full bg-header text-header-text shadow-md hover:bg-header-dark active:scale-95"

                aria-label="조리 순서 추가"

              >

                <Plus size={20} strokeWidth={2.5} />

              </button>

            </div>

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

    {ingredientDrag.previewPortal}

    {stepDrag.previewPortal}

    </>

  )

}


