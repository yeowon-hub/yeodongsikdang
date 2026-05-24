import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Ingredient, StorageLocation } from '@/types'
import {
  ALL_STORAGE_LOCATIONS,
  SHELF_LEVELS,
  STORAGE_META,
  UNITS,
  usesShelfLevel,
} from '@/types'

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
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('개')
  const [expiryDate, setExpiryDate] = useState('')
  const [shelfLevel, setShelfLevel] = useState(0)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setQuantity(initial.quantity)
      setUnit(initial.unit)
      setExpiryDate(initial.expiryDate ?? '')
      setShelfLevel(initial.shelfLevel ?? 0)
    } else {
      setName('')
      setQuantity(1)
      setUnit('개')
      setExpiryDate('')
      setShelfLevel(0)
    }
  }, [initial, open])

  if (!open) return null

  const showShelfLevel = usesShelfLevel(defaultLocation)
  const moveTargets = ALL_STORAGE_LOCATIONS.filter((loc) => loc !== initial?.location)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      quantity,
      unit,
      location: initial?.location ?? defaultLocation,
      expiryDate: expiryDate || undefined,
      shelfLevel: showShelfLevel ? shelfLevel : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            {initial ? '재료 수정' : '재료 추가'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">재료 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 두부, 계란, 김치"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">수량</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">단위</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">유통기한 (선택)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          {showShelfLevel && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {defaultLocation === 'shelf' ? '선반 칸' : '선반 단'}
              </label>
              <select
                value={shelfLevel}
                onChange={(e) => setShelfLevel(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
              >
                {SHELF_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level + 1}
                    {defaultLocation === 'shelf' ? '칸' : '단'}
                    {level === 0 ? ' (최상)' : level === 3 ? ' (최하)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {initial ? '수정하기' : '추가하기'}
          </button>

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

          {initial && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="w-full py-2 text-sm text-red-500 hover:text-red-600"
            >
              삭제하기
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
