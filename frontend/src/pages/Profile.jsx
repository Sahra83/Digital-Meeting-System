import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { participantApi } from '../services/api'

function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    fullname: user?.fullname || '',
    phone: user?.phone || '',
    email: user?.email || '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      await participantApi.updateProfile({
        ...form
      })
      setMessage('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="rounded-xl border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-semibold text-slate-950">Profile management</h1>
      <p className="mt-2 text-sm text-slate-500">Update your documented user profile details.</p>

      {(message || error) && (
        <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-2xl gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Full Name</span>
          <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="fullname" value={form.fullname} onChange={updateField} placeholder="Full name" required />
        </label>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Email Address (Optional)</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="email" value={form.email} onChange={updateField} placeholder="Email address" type="email" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Phone (Optional)</span>
            <input className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" name="phone" value={form.phone} onChange={updateField} placeholder="Phone" />
          </label>
        </div>

        <div className="mt-4">
          <button type="submit" className="h-11 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800">
            Save profile
          </button>
        </div>
      </form>
    </main>
  )
}

export default Profile
