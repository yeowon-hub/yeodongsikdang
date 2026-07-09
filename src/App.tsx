import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppProviders } from '@/components/providers/AppProviders'
import { HomePage } from '@/pages/HomePage'
import { GeneralFridgePage } from '@/pages/GeneralFridgePage'
import { KimchiFridgePage } from '@/pages/KimchiFridgePage'
import { ShelfPage } from '@/pages/ShelfPage'
import { PantryPage } from '@/pages/PantryPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { AccountPage } from '@/pages/AccountPage'
import { AccountManagePage } from '@/pages/AccountManagePage'
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
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="fridge" element={<Navigate to="/fridge/general?compartment=fridge" replace />} />
            <Route path="fridge/general" element={<GeneralFridgePage />} />
            <Route path="fridge/kimchi" element={<KimchiFridgePage />} />
            <Route path="fridge1" element={<Navigate to="/fridge/general?compartment=fridge" replace />} />
            <Route path="fridge2" element={<Navigate to="/fridge/kimchi?compartment=fridge" replace />} />
            <Route path="freezer" element={<Navigate to="/fridge/general?compartment=fridge" replace />} />
            <Route path="shelf" element={<ShelfPage />} />
            <Route path="pantry" element={<PantryPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="account/manage" element={<AccountManagePage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
          <Route path="login" element={<Navigate to="/account" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}
