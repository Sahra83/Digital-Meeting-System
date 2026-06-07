import { useEffect, useState } from 'react'
import Icon from './Icon'

const emptyForm = {
  fullname: '',
  username: '',
  email: '',
  password: '',
  roleId: '',
  phone: '',
}

function UserModal({ isOpen, onClose, onSubmit, roles, editUser = null, saving = false }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editUser) {
      setForm({
        fullname: editUser.fullname || '',
        username: editUser.username || '',
        email: editUser.email || '',
        password: '', // Password is optional on edit
        roleId: editUser.role_id || '',
        phone: editUser.phone || '',
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [editUser, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.fullname) newErrors.fullname = 'Full name is required'
    if (!form.username) newErrors.username = 'Username is required'
    if (!editUser && !form.password) newErrors.password = 'Password is required'
    if (form.password && form.password.length < 4) newErrors.password = 'Password must be at least 4 characters'
    if (!form.roleId) newErrors.roleId = 'Role is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validate()) {
      try {
        await onSubmit(form)
      } catch (err) {
        console.error('Submit error:', err)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${saving ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
        onClick={() => !saving && onClose()}
      />
      <div className="relative w-full max-w-lg scale-100 transform overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {editUser ? 'Update User Account' : 'Register New User'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {editUser ? 'Modify existing user details.' : 'Create a new account for the system.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-5">
            {/* Full Name */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={`h-12 w-full rounded-xl border bg-slate-50 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${errors.fullname ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                />
              </div>
              {errors.fullname && <p className="mt-1 text-xs text-red-500">{errors.fullname}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Username */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="johndoe123"
                  className={`h-12 w-full rounded-xl border bg-slate-50 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${errors.username ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                <select
                  name="roleId"
                  value={form.roleId}
                  onChange={handleChange}
                  className={`h-12 w-full rounded-xl border bg-slate-50 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${errors.roleId ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.role_name}</option>
                  ))}
                </select>
                {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Phone (Optional)</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                {editUser ? 'New Password (Optional)' : 'Password'}
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`h-12 w-full rounded-xl border bg-slate-50 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${errors.password ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-70"
            >
              {saving ? 'Processing...' : (editUser ? 'Update User' : 'Register User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal
