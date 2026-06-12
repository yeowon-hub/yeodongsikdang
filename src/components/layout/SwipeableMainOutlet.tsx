import { Outlet, useLocation } from 'react-router-dom'
import { getMainTabTheme } from '@/lib/mainTabs'

export function SwipeableMainOutlet() {
  const location = useLocation()
  const theme = getMainTabTheme(location.pathname)

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col transition-colors duration-200"
      style={{ backgroundColor: theme }}
    >
      <Outlet />
    </div>
  )
}
