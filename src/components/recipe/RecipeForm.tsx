import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Image, Menu, Plus, Trash2, X } from 'lucide-react'
import { useDragReorder } from '@/hooks/useDragReorder'
import { compressImageToDataUrl } from '@/lib/image'
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
    imageUrl?: string
  }) => void
  onDelete?: () => void
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

export function RecipeForm({ open, onClose, onSubmit, onDelete, initial }: RecipeFormProps) {
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
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl)
  const [imageError, setImageError] = useState('')
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  const ingredientNameRefs = useRef<Array<HTMLInputElement | null>>([])
  const stepTextRefs = useRef<Array<HTMLInputElement | null>>([])
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

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
    setImageUrl(initial?.imageUrl)
    setImageError('')
    setPhotoSourceOpen(false)
    setImageLoading(false)
  }, [initial, open])

  if (!open) return null

  const addIngredientAfter = (index: number) => {
    const newRow = newIngredientRow()
    setIngredients((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, newRow)
      return next
    })
    requestAnimationFrame(() => {
      ingredientNameRefs.current[index + 1]?.focus()
    })
  }

  const addStepAfter = (index: number) => {
    const newRow = newStepRow(index + 2)
    setSteps((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, newRow)
      return next.map((step, stepIndex) => ({ ...step, order: stepIndex + 1 }))
    })
    requestAnimationFrame(() => {
      stepTextRefs.current[index + 1]?.focus()
    })
  }

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return
    setPhotoSourceOpen(false)
    const looksLikeImage =
      file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)
    if (!looksLikeImage) {
      setImageError('이미지 파일만 올릴 수 있어요')
      return
    }
    setImageLoading(true)
    setImageError('')
    try {
      setImageUrl(await compressImageToDataUrl(file, 640))
    } catch {
      setImageError('사진을 불러오지 못했어요')
    } finally {
      setImageLoading(false)
    }
  }

  const openCameraPicker = () => {
    cameraInputRef.current?.click()
    setPhotoSourceOpen(false)
  }

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
      imageUrl,
    })
    onClose()
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 sm:items-center sm:justify-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-form-title"
      >
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="닫기"
          onClick={onClose}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void handleImagePick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <input
          ref={galleryInputRef}
          id="recipe-form-gallery-input"
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void handleImagePick(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <div className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl max-h-[min(92dvh,100%)]">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 pb-3 pt-5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h3 id="recipe-form-title" className="shrink-0 text-lg font-bold">
                {initial ? '레시피 수정' : '레시피 작성'}
              </h3>
              {initial && (
                <>
                  <button
                    type="submit"
                    form="recipe-form"
                    className="shrink-0 rounded-xl bg-header px-4 py-2 text-sm font-semibold text-header-text hover:bg-header-dark active:scale-[0.99]"
                  >
                    수정
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete()
                        onClose()
                      }}
                      className="shrink-0 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 active:scale-[0.99]"
                    >
                      삭제
                    </button>
                  )}
                </>
              )}
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-full p-2 hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          <form id="recipe-form" onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="레시피 이름"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              required
            />

            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">사진 (선택)</label>
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="레시피 사진"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(undefined)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"
                    aria-label="사진 삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : imageLoading ? (
                <div className="flex h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-header/40 bg-header/5 text-sm text-header-text">
                  사진 처리 중...
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoSourceOpen((open) => !open)}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-header/40 bg-header/5 py-8 text-header-text/80 transition-colors hover:border-header hover:bg-header/15 hover:text-header-text active:bg-header/20"
                  >
                    <Camera size={28} />
                    <span className="text-sm font-medium">사진 추가하기</span>
                  </button>
                  {photoSourceOpen && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      <p className="border-b border-gray-100 px-4 py-2.5 text-center text-sm font-semibold text-gray-800">
                        사진 가져오기
                      </p>
                      <div className="space-y-1 p-2">
                        <button
                          type="button"
                          onClick={openCameraPicker}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-header/25 text-header-text">
                            <Camera size={20} />
                          </span>
                          <span className="text-sm font-semibold text-gray-800">카메라</span>
                        </button>
                        <label
                          htmlFor="recipe-form-gallery-input"
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-header/25 text-header-text">
                            <Image size={20} />
                          </span>
                          <span className="text-sm font-semibold text-gray-800">갤러리</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setPhotoSourceOpen(false)}
                          className="w-full rounded-lg py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {imageError && <p className="mt-1 text-xs text-red-500">{imageError}</p>}
            </div>

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

            <div className="grid grid-cols-3 gap-2">
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-gray-700">음식종류</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-gray-700">소요시간</label>
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2">
                  <input
                    type="number"
                    min={1}
                    value={cookingTime}
                    onChange={(e) => setCookingTime(Number(e.target.value))}
                    className="min-w-0 w-full border-0 bg-transparent p-0 text-sm outline-none"
                    aria-label="소요시간"
                  />
                  <span className="shrink-0 text-xs text-gray-500">분</span>
                </div>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-gray-700">인분</label>
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2">
                  <input
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="min-w-0 w-full border-0 bg-transparent p-0 text-sm outline-none"
                    aria-label="인분"
                  />
                  <span className="shrink-0 text-xs text-gray-500">인분</span>
                </div>
              </div>
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
                        ref={(el) => {
                          ingredientNameRefs.current[i] = el
                        }}
                        type="text"
                        value={ing.name}
                        onChange={(e) => {
                          const next = [...ingredients]
                          next[i] = { ...ing, name: e.target.value }
                          setIngredients(next)
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return
                          e.preventDefault()
                          addIngredientAfter(i)
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
                    className={stepDrag.getItemClassName(
                      i,
                      'flex gap-1.5 rounded-xl border border-transparent p-1 transition-colors',
                    )}
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
                      ref={(el) => {
                        stepTextRefs.current[i] = el
                      }}
                      type="text"
                      value={step.text}
                      onChange={(e) => {
                        const next = [...steps]
                        next[i] = { ...step, text: e.target.value }
                        setSteps(next)
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        addStepAfter(i)
                      }}
                      placeholder="조리 방법"
                      className="min-w-0 flex-1 self-center rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSteps(
                          steps
                            .filter((item) => item._id !== step._id)
                            .map((item, index) => ({
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
              저장
            </button>
          </form>
          </div>
        </div>
      </div>
      {ingredientDrag.previewPortal}
      {stepDrag.previewPortal}
    </>,
    document.body,
  )
}
