import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { BookOpen, Plus, ShoppingBasket } from 'lucide-react'
import { IngredientForm } from '@/components/fridge/IngredientForm'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { useGlobalAddFabSuppressed } from '@/contexts/GlobalAddFabContext'
import { useIngredients } from '@/hooks/useIngredients'
import { useRecipes } from '@/hooks/useRecipes'
import { inferAddStorageFromPath } from '@/lib/addStorageOptions'

type AddStep = 'closed' | 'kind' | 'recipe' | 'ingredient'

const FAB_BOTTOM = 'calc(4.5rem + env(safe-area-inset-bottom, 0px))'

function AddPickerSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end bg-black/40 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="border-b border-gray-100 px-4 py-4">
          <h2 className="text-center text-base font-bold text-gray-800">{title}</h2>
        </div>
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function GlobalAddButton() {
  const location = useLocation()
  const suppressed = useGlobalAddFabSuppressed()
  const { addIngredient } = useIngredients()
  const { addRecipe } = useRecipes()

  const [step, setStep] = useState<AddStep>('closed')
  const [ingredientDefaultLocation, setIngredientDefaultLocation] = useState(
    inferAddStorageFromPath(location.pathname),
  )

  const fabVisible = step === 'closed' && !suppressed

  const closeAll = () => setStep('closed')

  const openKindPicker = () => setStep('kind')

  const openIngredientForm = () => {
    setIngredientDefaultLocation(inferAddStorageFromPath(location.pathname))
    setStep('ingredient')
  }

  const handleIngredientSubmit = async (data: Parameters<typeof addIngredient>[0]) => {
    await addIngredient(data)
    closeAll()
  }

  const handleIngredientBatchSubmit = async (items: Parameters<typeof addIngredient>[0][]) => {
    for (const item of items) {
      await addIngredient(item)
    }
    closeAll()
  }

  const handleRecipeSubmit = async (data: Parameters<typeof addRecipe>[0]) => {
    await addRecipe(data)
    closeAll()
  }

  return (
    <>
      {fabVisible && (
        <button
          type="button"
          onClick={openKindPicker}
          className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-header text-header-text shadow-lg hover:bg-header-dark active:scale-95"
          style={{ bottom: FAB_BOTTOM }}
          aria-label="추가하기"
        >
          <Plus size={28} />
        </button>
      )}

      {step === 'kind' && (
        <AddPickerSheet title="무엇을 추가할까요?" onClose={closeAll}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStep('recipe')}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-4 text-center hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-header/25 text-header-text">
                <BookOpen size={22} />
              </span>
              <span className="text-sm font-bold text-gray-800">레시피</span>
            </button>
            <button
              type="button"
              onClick={openIngredientForm}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-4 text-center hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-header/25 text-header-text">
                <ShoppingBasket size={22} />
              </span>
              <span className="text-sm font-bold text-gray-800">재료</span>
            </button>
          </div>
        </AddPickerSheet>
      )}

      <RecipeForm
        open={step === 'recipe'}
        onClose={() => setStep('kind')}
        onSubmit={handleRecipeSubmit}
      />

      <IngredientForm
        open={step === 'ingredient'}
        onClose={() => setStep('kind')}
        onSubmit={handleIngredientSubmit}
        onSubmitBatch={handleIngredientBatchSubmit}
        defaultLocation={ingredientDefaultLocation}
      />
    </>
  )
}
