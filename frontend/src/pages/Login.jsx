import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../hooks/useAuth'

const initialTouched = {
  username: false,
  password: false,
}

function Login() {
  const [values, setValues] = useState({ username: '', password: '' })
  const [touched, setTouched] = useState(initialTouched)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { login, sessionMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const errors = useMemo(() => {
    const nextErrors = {}

    if (!values.username.trim()) {
      nextErrors.username = 'Username is required'
    } else if (values.username.length < 3) {
      nextErrors.username = 'Username must be at least 3 characters'
    }

    if (!values.password) {
      nextErrors.password = 'Password is required'
    } else if (values.password.length < 4) {
      nextErrors.password = 'Password must be at least 4 characters'
    }

    return nextErrors
  }, [values.username, values.password])

  const hasErrors = Object.keys(errors).length > 0

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched({ username: true, password: true })
    setFormError('')

    if (hasErrors) return

    setLoading(true)
    login({ username: values.username, password: values.password })
      .then((user) => {
        const target = location.state?.from?.pathname || user.default_path
        navigate(target, { replace: true })
      })
      .catch((error) => {
        setFormError(error.message)
      })
      .finally(() => setLoading(false))
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="Back to Digital Meeting Minutes home">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-700 text-white">
              <Icon name="minutes" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">Digital Meeting Minutes</span>
              <span className="hidden text-xs text-slate-500 sm:block">Secure workspace access</span>
            </span>
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Enterprise access</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-slate-950">
              Sign in to manage meetings, minutes, decisions, and action items.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              Access a focused collaboration environment for organizers, administrators, and participants with secure
              role-based controls and clean record retrieval.
            </p>
            <div className="mt-8 grid max-w-xl gap-3">
              {['Role-based dashboards', 'Structured minutes archive', 'Action item follow-up'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Welcome back</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Login</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Use your organization username and password to continue.
                </p>
              </div>

              <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
                {(sessionMessage || formError) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {formError || sessionMessage}
                  </div>
                )}
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Username</span>
                  <span className="relative">
                    <Icon name="user" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      value={values.username}
                      onChange={updateValue}
                      onBlur={() => setTouched((currentTouched) => ({ ...currentTouched, username: true }))}
                      className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                        touched.username && errors.username
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                      }`}
                      placeholder="Enter your username"
                      aria-invalid={Boolean(touched.username && errors.username)}
                    />
                  </span>
                  {touched.username && errors.username && <span className="text-sm text-red-600">{errors.username}</span>}
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <span className="relative">
                    <Icon name="lock" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={values.password}
                      onChange={updateValue}
                      onBlur={() => setTouched((currentTouched) => ({ ...currentTouched, password: true }))}
                      className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                        touched.password && errors.password
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                      }`}
                      placeholder="Enter your password"
                      aria-invalid={Boolean(touched.password && errors.password)}
                    />
                  </span>
                  {touched.password && errors.password && <span className="text-sm text-red-600">{errors.password}</span>}
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>
              </form>

              <Link
                to="/"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-blue-700 hover:text-blue-700"
              >
                Back to home
                <Icon name="chevron" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
