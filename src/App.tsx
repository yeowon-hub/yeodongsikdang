import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppProviders } from '@/components/providers/AppProviders'
import { GeneralFridgePage } from '@/pages/GeneralFridgePage'
import { KimchiFridgePage } from '@/pages/KimchiFridgePage'
import { ShelfPage } from '@/pages/ShelfPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { AccountPage } from '@/pages/AccountPage'
import { seedIfNeeded } from '@/lib/seed'

export default function App() {
  useEffect(() => {
    seedIfNeeded()
  }, [])

  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/fridge/general" replace />} />
            <Route path="fridge" element={<Navigate to="/fridge/general" replace />} />
            <Route path="fridge/general" element={<GeneralFridgePage />} />
            <Route path="fridge/kimchi" element={<KimchiFridgePage />} />
            <Route path="fridge1" element={<Navigate to="/fridge/general" replace />} />
            <Route path="fridge2" element={<Navigate to="/fridge/kimchi" replace />} />
            <Route path="freezer" element={<Navigate to="/fridge/general" replace />} />
            <Route path="shelf" element={<ShelfPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
          <Route path="login" element={<Navigate to="/account" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}
