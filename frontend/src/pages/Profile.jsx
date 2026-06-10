import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { userApi } from '../services/api'

function Profile() {
  const { updateCurrentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    fullname: '',
    username: '',
    phone: '',
    email: '',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const result = await userApi.getProfile()
        if (!active) return

        setForm({
          fullname: result.user?.fullname || '',
          username: result.user?.username || '',
          phone: result.user?.phone || '',
          email: result.user?.email || '',
        })
        updateCurrentUser(result.user)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [updateCurrentUser])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const updatePasswordField = (event) => {
    const { name, value } = event.target
    setPasswords((currentPasswords) => ({ ...currentPasswords, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const payload = {
        ...form,
        ...(passwords.newPassword
          ? {
              currentPassword: passwords.currentPassword,
              newPassword: passwords.newPassword,
            }
          : {}),
      }
      const result = await userApi.updateProfile(payload)
      updateCurrentUser(result.user)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading profile...</div>
  }

  return (
    <main className="rounded-lg border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-semibold text-slate-950">Admin profile</h1>

      {(message || error) && (
        <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-3xl gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Full name</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="fullname" value={form.fullname} onChange={updateField} required />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Username</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="username" value={form.username} onChange={updateField} required minLength={3} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Email address</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="email" value={form.email} onChange={updateField} type="email" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Phone</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="phone" value={form.phone} onChange={updateField} />
          </label>
        </div>

        <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Current password</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="currentPassword" value={passwords.currentPassword} onChange={updatePasswordField} type="password" autoComplete="current-password" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">New password</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="newPassword" value={passwords.newPassword} onChange={updatePasswordField} type="password" autoComplete="new-password" minLength={4} />
          </label>
        </div>

        <div>
          <button type="submit" className="h-11 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800">
            Save profile
          </button>
        </div>
      </form>
    </main>
  )
}

export default Profile
