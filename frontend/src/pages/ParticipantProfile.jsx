import { useEffect, useState } from 'react'
import { participantApi } from '../services/api'

function ParticipantProfile() {
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadProfile = () => {
    participantApi.getProfile()
      .then((res) => {
        setProfile(res.profile)
        setUsername(res.profile?.username || '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadProfile, [])

  const updateUsername = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await participantApi.updateProfile({ username })
      setMessage('Username updated.')
      loadProfile()
    } catch (err) {
      setError(err.message)
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await participantApi.changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Password updated.')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading profile...</div>

  return (
    <div className="grid gap-4">
      <section>
        <h1 className="text-2xl font-semibold leading-tight text-slate-950">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account information.</p>
      </section>

      {(message || error) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Account Details</h2>
        <dl className="mt-4 grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-slate-500">Full name</dt><dd className="mt-1 text-slate-900">{profile.fullname}</dd></div>
          <div><dt className="font-semibold text-slate-500">Username</dt><dd className="mt-1 text-slate-900">{profile.username}</dd></div>
          <div><dt className="font-semibold text-slate-500">Email</dt><dd className="mt-1 text-slate-900">{profile.email || 'Not set'}</dd></div>
          <div><dt className="font-semibold text-slate-500">Phone</dt><dd className="mt-1 text-slate-900">{profile.phone || 'Not set'}</dd></div>
          <div><dt className="font-semibold text-slate-500">Status</dt><dd className="mt-1 capitalize text-slate-900">{profile.status}</dd></div>
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={updateUsername} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Update Username</h2>
          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Username</span>
            <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} />
          </label>
          <button type="submit" className="mt-4 h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Save Username</button>
        </form>

        <form onSubmit={changePassword} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Change Password</h2>
          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Current password</span>
            <input type="password" className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required />
          </label>
          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">New password</span>
            <input type="password" className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} required minLength={8} />
          </label>
          <button type="submit" className="mt-4 h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Change Password</button>
        </form>
      </section>
    </div>
  )
}

export default ParticipantProfile
