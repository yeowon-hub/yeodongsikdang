import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppProviders } from '@/components/providers/AppProviders'
import { FridgePage } from '@/pages/ColdStoragePage'
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
            <Route index element={<Navigate to="/fridge" replace />} />
            <Route path="fridge" element={<FridgePage />} />
            <Route path="fridge1" element={<Navigate to="/fridge" replace />} />
            <Route path="fridge2" element={<Navigate to="/fridge" replace />} />
            <Route path="freezer" element={<Navigate to="/fridge" replace />} />
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
