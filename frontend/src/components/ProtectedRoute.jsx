import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-slate-700">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold">
          Checking your session...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.portal === 'participant') {
    return <Navigate to={user.default_path || '/participant/dashboard'} replace />
  }

  if (!['Admin', 'Meeting Organizer'].includes(user?.role_name)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
