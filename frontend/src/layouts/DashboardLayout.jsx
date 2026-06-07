import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { useSessionTimeout } from '../hooks/useSessionTimeout'

function DashboardLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  useSessionTimeout(Boolean(user), () => {
    logout('Your session expired after 1 minute of inactivity.')
    navigate('/login', { replace: true })
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard/users" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-700 text-white">
              <Icon name="users" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">User Management</span>
              <span className="hidden text-xs text-slate-500 sm:block">{user?.role_name}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-700 hover:text-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-xl border border-slate-200 bg-white p-3">
          <nav className="grid gap-1">
            <NavLink
              to="/dashboard/users"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
                }`
              }
            >
              Users
            </NavLink>
            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
                }`
              }
            >
              Profile
            </NavLink>
          </nav>
        </aside>
        <Outlet />
      </div>
    </div>
  )
}

export default DashboardLayout
