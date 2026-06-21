import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { compressImageToDataUrl } from '@/lib/image'
import type { Ingredient, StorageLocation } from '@/types'
import {
  ALL_STORAGE_LOCATIONS,
  SHELF_LEVELS,
  SHELF_LEVEL_COUNT,
  STORAGE_META,
  UNITS,
  usesShelfLevel,
} from '@/types'

const CUSTOM_UNIT_VALUE = '__custom__'

function resolveUnit(select: string, custom: string) {
  if (select === CUSTOM_UNIT_VALUE) return custom.trim() || '개'
  return select
}

function initUnitState(unit: string) {
  if ((UNITS as readonly string[]).includes(unit)) {
    return { select: unit, custom: '' }
  }
  return { select: CUSTOM_UNIT_VALUE, custom: unit }
}

interface IngredientFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    quantity: number
    unit: string
    location: StorageLocation
    expiryDate?: string
    shelfLevel?: number
    imageUrl?: string
  }) => void
  onDelete?: () => void
  onMove?: (location: StorageLocation) => void
  initial?: Ingredient
  defaultLocation: StorageLocation
}

export function IngredientForm({
  open,
  onClose,
  onSubmit,
  onDelete,
  onMove,
  initial,
  defaultLocation,
}: IngredientFormProps) {
  const [name, setName] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [unitSelect, setUnitSelect] = useState<string>('개')
  const [customUnit, setCustomUnit] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [shelfLevel, setShelfLevel] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [imageError, setImageError] = useState('')
  const [modalMaxH, setModalMaxH] = useState<number | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setQuantityInput(String(initial.quantity))
      const unitState = initUnitState(initial.unit)
      setUnitSelect(unitState.select)
      setCustomUnit(unitState.custom)
      setExpiryDate(initial.expiryDate ?? '')
      setShelfLevel(initial.shelfLevel ?? 0)
      setImageUrl(initial.imageUrl)
    } else {
      setName('')
      setQuantityInput('')
      setUnitSelect('개')
      setCustomUnit('')
      setExpiryDate('')
      setShelfLevel(0)
      setImageUrl(undefined)
    }
    setImageError('')
  }, [initial, open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    const update = () => {
      if (vv) setModalMaxH(Math.floor(vv.height * 0.92))
      else setModalMaxH(undefined)
    }
    update()
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
    }
  }, [open])

  const scrollFieldIntoView = (el: HTMLElement) => {
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  if (!open) return null

  const showShelfLevel = usesShelfLevel(defaultLocation)
  const moveTargets = ALL_STORAGE_LOCATIONS.filter((loc) => loc !== initial?.location)

  const parseQuantity = () => {
    const trimmed = quantityInput.trim()
    if (!trimmed || trimmed === '.') return 1
    const n = Number(trimmed)
    if (!Number.isFinite(n) || n <= 0) return 1
    return n
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      quantity: parseQuantity(),
      unit: resolveUnit(unitSelect, customUnit),
      location: initial?.location ?? defaultLocation,
      expiryDate: expiryDate || undefined,
      shelfLevel: showShelfLevel ? shelfLevel : undefined,
      imageUrl,
    })
    onClose()
  }

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 올릴 수 있어요')
      return
    }
    try {
      setImageError('')
      const dataUrl = await compressImageToDataUrl(file)
      setImageUrl(dataUrl)
    } catch {
      setImageError('사진을 불러오지 못했어요')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingredient-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        className="relative flex w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        style={{
          maxHeight: modalMaxH ? `${modalMaxH}px` : 'min(92dvh, 100%)',
        }}
      >
        <form id="ingredient-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 pb-3 pt-5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h3 id="ingredient-form-title" className="shrink-0 text-lg font-bold text-gray-800">
                {initial ? '재료 수정' : '재료 추가'}
              </h3>
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-header px-4 py-2 text-sm font-semibold text-header-text hover:bg-header-dark active:scale-[0.99]"
              >
                {initial ? '수정하기' : '추가하기'}
              </button>
              {initial && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete()
                    onClose()
                  }}
                  className="shrink-0 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 active:scale-[0.99]"
                >
                  삭제하기
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 hover:bg-gray-100"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">사진 (선택)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    void handleImagePick(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="재료 사진"
                      className="h-36 w-full rounded-xl object-cover"
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
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-gray-500 hover:border-brand hover:text-brand"
                  >
                    <Camera size={28} />
                    <span className="text-sm">사진 추가하기</span>
                  </button>
                )}
                {imageError && <p className="mt-1 text-xs text-red-500">{imageError}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">재료 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                  placeholder="예: 두부, 계란, 김치"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">수량</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantityInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/,/g, '.')
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setQuantityInput(v)
                    }}
                    onFocus={(e) => {
                      if (quantityInput === '0') setQuantityInput('')
                      e.currentTarget.select()
                      scrollFieldIntoView(e.currentTarget)
                    }}
                    onBlur={() => {
                      const trimmed = quantityInput.trim()
                      if (!trimmed || trimmed === '.' || Number(trimmed) <= 0) {
                        setQuantityInput(initial ? String(initial.quantity) : '')
                      }
                    }}
                    placeholder="1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">단위</label>
                  <select
                    value={unitSelect}
                    onChange={(e) => setUnitSelect(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:border-brand focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value={CUSTOM_UNIT_VALUE}>직접 입력</option>
                  </select>
                </div>
              </div>

              {unitSelect === CUSTOM_UNIT_VALUE && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">단위 직접 입력</label>
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                    placeholder="예: 조각, 마리, 봉지"
                    maxLength={12}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">유통기한 (선택)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:border-brand focus:outline-none"
                />
              </div>

              {showShelfLevel && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {defaultLocation === 'shelf'
                      ? '선반 칸'
                      : defaultLocation === 'pantry'
                        ? '펜트리 칸'
                        : '선반 단'}
                  </label>
                  <select
                    value={shelfLevel}
                    onChange={(e) => setShelfLevel(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:border-brand focus:outline-none"
                  >
                    {SHELF_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level + 1}
                        {defaultLocation === 'shelf' || defaultLocation === 'pantry' ? '칸' : '단'}
                        {level === 0 ? ' (최상)' : level === SHELF_LEVEL_COUNT - 1 ? ' (최하)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {initial && onMove && moveTargets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">다른 곳으로 이동</p>
                  {moveTargets.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        onMove(loc)
                        onClose()
                      }}
                      className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      {STORAGE_META[loc].label}(으)로 이동
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
