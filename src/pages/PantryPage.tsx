import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseLevelIndex } from '@/lib/navigation'
import { IngredientForm } from '@/components/fridge/IngredientForm'
import { DryStorageView } from '@/components/storage/DryStorageView'
import { useSuppressGlobalAddFab } from '@/contexts/GlobalAddFabContext'
import { useIngredients } from '@/hooks/useIngredients'
import type { Ingredient } from '@/types'

export function PantryPage() {
  const [searchParams] = useSearchParams()
  const focusLevel = parseLevelIndex(searchParams.get('level'))
  const focusIngredientId = searchParams.get('ingredient') ?? undefined
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  useSuppressGlobalAddFab(formOpen)
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, moveIngredient, moveIngredientToLevel } =
    useIngredients('pantry')

  const handleSubmit = async (data: Parameters<typeof addIngredient>[0]) => {
    if (editing) {
      await updateIngredient(editing.id, data)
    } else {
      await addIngredient(data)
    }
    setEditing(undefined)
  }

  const handleBatchSubmit = async (items: Parameters<typeof addIngredient>[0][]) => {
    for (const item of items) {
      await addIngredient(item)
    }
    setEditing(undefined)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <DryStorageView
        designId="pantry"
        ingredients={ingredients}
        onIngredientClick={(ing) => {
          setEditing(ing)
          setFormOpen(true)
        }}
        onIngredientMoveToLevel={(id, level) => moveIngredientToLevel(id, level)}
        focusLevel={focusLevel}
        focusIngredientId={focusIngredientId}
        emptyMessage={'펜트리가 비어있어요.\n추가하기 버튼으로 재료를 추가해보세요!'}
      />

      <IngredientForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(undefined)
        }}
        onSubmit={handleSubmit}
        onSubmitBatch={handleBatchSubmit}
        onDelete={editing ? () => deleteIngredient(editing.id) : undefined}
        onMove={editing ? (loc) => moveIngredient(editing.id, loc) : undefined}
        initial={editing}
        defaultLocation="pantry"
      />
    </div>
  )
}
