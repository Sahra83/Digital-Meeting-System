import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../hooks/useAuth'

function Navbar({ onOpenSidebar }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-slate-200/60 bg-white/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open Sidebar"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>

        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
            <Icon name="shield" className="h-6 w-6" />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-lg font-bold leading-none tracking-tight text-slate-900">
              Digital Meeting
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">
              Collaboration
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden h-8 w-[1px] bg-slate-200 lg:block mr-2" />

        <div className="flex items-center gap-3 pl-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.fullname}</p>
                <p className="text-[11px] font-medium uppercase tracking-tighter text-slate-500">
                  {user?.role_name}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Logout"
              >
                <Icon name="close" className="h-5 w-5 transition-transform group-hover:rotate-90" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
