import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { useSessionTimeout } from '../hooks/useSessionTimeout'

function ParticipantLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useSessionTimeout(Boolean(user), () => {
    logout('Your session expired after 1 minute of inactivity.')
    navigate('/login', { replace: true })
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const menuItems = [
    { name: 'Dashboard Overview', path: '/participant/dashboard', icon: 'dashboard' },
    { name: 'My Meetings', path: '/participant/meetings', icon: 'calendar' },
    { name: 'My Tasks', path: '/participant/tasks', icon: 'tasks' },
    { name: 'Profile', path: '/participant/profile', icon: 'user' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 px-6">
            <Link to="/participant/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-700/30">
                <Icon name="minutes" className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-950">Participant Portal</h2>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      name={item.icon}
                      className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
                    />
                    <span>{item.name}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-700" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <span className="text-sm font-bold">{user?.fullname?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{user?.fullname}</p>
                <p className="truncate text-xs text-slate-500">{user?.role_name || 'Participant'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open participant navigation"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <Link to="/participant/dashboard" className="group flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
                <Icon name="shield" className="h-6 w-6" />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-lg font-bold leading-none tracking-tight text-slate-900">Digital Meeting</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">Participant</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden h-8 w-px bg-slate-200 lg:block" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.fullname}</p>
              <p className="text-[11px] font-medium uppercase text-slate-500">{user?.role_name || 'Participant'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Logout"
            >
              <Icon name="close" className="h-5 w-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ParticipantLayout
