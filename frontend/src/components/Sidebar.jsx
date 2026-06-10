import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../hooks/useAuth'

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()

  const menuItems = [
    // { name: 'Collaboration', path: '/dashboard/collaboration', icon: 'chat' },
    { name: 'Dashboard Overview', path: '/dashboard/overview', icon: 'dashboard' },
    { name: 'User Management', path: '/dashboard/users', icon: 'users' },
    { name: 'Meeting Schedule', path: '/dashboard/meetings', icon: 'calendar' },
    { name: 'Assigned Tasks', path: '/dashboard/tasks', icon: 'tasks' },
    { name: 'Reports & Analytics', path: '/dashboard/reports', icon: 'chart' },
    { name: 'User Logs', path: '/dashboard/user-logs', icon: 'history' },
    { name: 'Admin Profile', path: '/dashboard/profile', icon: 'user' }
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside className={`fixed left-0 top-0 z-50 h-screen w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex h-20 items-center gap-3 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-700/30">
              <Icon name="collab" className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Admin Portal</h2>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
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
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-700" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile Info (Small) */}
          <div className="border-t border-slate-200 p-4">
            <NavLink
              to="/dashboard/profile"
              onClick={() => window.innerWidth < 1024 && onClose()}
              className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 transition hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <span className="text-sm font-bold">{user?.fullname?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-slate-900">{user?.fullname}</p>
                <p className="truncate text-xs text-slate-500">@{user?.username} · {user?.role_name}</p>
              </div>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
