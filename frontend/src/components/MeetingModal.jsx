import { useEffect, useState } from 'react'
import Icon from './Icon'
import { participantApi } from '../services/api'

const EMPTY_NEW_PARTICIPANT = {
  fullname: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  roleId: '',
  createLogin: false,
}

const getParticipantRoleId = (roles) => {
  const participantRole = roles.find((role) => role.role_name === 'Participant')
  return participantRole ? String(participantRole.id) : ''
}

function MeetingModal({ isOpen, onClose, onSubmit, editMeeting, saving }) {
  const [formData, setFormData] = useState({
    title: '',
    agenda: '',
    meeting_date: '',
    meeting_time: '',
    location: '',
    participants: [],
  })
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState('')

  // Toggle: false = invite registered users, true = register new participant
  const [registerMode, setRegisterMode] = useState(false)
  const [newParticipant, setNewParticipant] = useState(EMPTY_NEW_PARTICIPANT)
  const [npError, setNpError] = useState('')

  /* ─── Date / time validation ─── */
  const validateForm = () => {
    // Only enforce future date/time for NEW meetings
    // For editing existing meetings, we skip this to allow participant updates
    if (!editMeeting) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(formData.meeting_date)

      if (selectedDate < today) {
        setError('Meeting date cannot be in the past.')
        return false
      }

      if (selectedDate.toDateString() === today.toDateString()) {
        const now = new Date()
        const [hours, minutes] = formData.meeting_time.split(':').map(Number)
        const selectedTime = new Date(now)
        selectedTime.setHours(hours, minutes, 0, 0)
        if (selectedTime <= now) {
          setError('Meeting time must be in the future for today.')
          return false
        }
      }
    }

    setError('')
    return true
  }

  /* ─── New participant form validation ─── */
  const validateNewParticipant = () => {
    const np = newParticipant
    if (!np.fullname.trim()) { setNpError('Full name is required.'); return false }
    if (!np.roleId) { setNpError('Role is required.'); return false }
    if (!np.createLogin && !np.email.trim()) { setNpError('Email is required when login access is off.'); return false }
    if (np.createLogin && (!np.username.trim() || np.username.length < 3)) { setNpError('Username must be at least 3 characters.'); return false }
    if (np.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(np.email)) { setNpError('Please enter a valid email address.'); return false }
    if (np.createLogin && (!np.password || np.password.length < 4)) { setNpError('Password must be at least 4 characters.'); return false }
    setNpError('')
    return true
  }

  /* ─── Load on open ─── */
  useEffect(() => {
    if (isOpen) {
      loadUsers()
      loadRoles()
      setError('')
      setNpError('')
      setRegisterMode(false)
      setNewParticipant({ ...EMPTY_NEW_PARTICIPANT, roleId: getParticipantRoleId(roles) })

      if (editMeeting) {
        setFormData({
          title: editMeeting.title || '',
          agenda: editMeeting.agenda || '',
          meeting_date: editMeeting.meeting_date
            ? new Date(editMeeting.meeting_date).toISOString().split('T')[0]
            : '',
          meeting_time: editMeeting.meeting_time 
            ? editMeeting.meeting_time.substring(0, 5) 
            : '',
          location: editMeeting.location || '',
          participants: editMeeting.participants
            ? editMeeting.participants
                .filter((p) => p && p.id)
                .map((p) => p.id)
            : [],
        })
      } else {
        setFormData({
          title: '', agenda: '', meeting_date: '', meeting_time: '',
          location: '', participants: [],
        })
      }
    }
  }, [isOpen, editMeeting])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await participantApi.list()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await participantApi.roles()
      const loadedRoles = data.roles || []
      setRoles(loadedRoles)
      setNewParticipant((prev) => ({
        ...prev,
        roleId: prev.roleId || getParticipantRoleId(loadedRoles),
      }))
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNpChange = (e) => {
    const { name, value, type, checked } = e.target
    setNpError('')
    setNewParticipant((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleParticipantToggle = (userId) => {
    setFormData((prev) => {
      const participants = prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId]
      return { ...prev, participants }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    if (registerMode && !validateNewParticipant()) return

    const payload = { ...formData }
    if (registerMode && newParticipant.fullname.trim()) {
      payload.newParticipant = { ...newParticipant }
      // Don't also send participants when in register mode (unless some were pre-selected)
    }
    
    try {
      await onSubmit(payload)
    } catch (err) {
      console.error('Submit error:', err)
    }
  }

  if (!isOpen) return null

  const inputCls =
    'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm ${saving ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
        onClick={() => !saving && onClose()} 
      />
      <div className="relative w-full max-w-2xl scale-100 transform overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {editMeeting ? 'Update Meeting' : 'Schedule New Meeting'}
            </h3>
            <p className="text-sm text-slate-500">
              Fill in the details and invite participants.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={saving}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-8 py-6">

          {/* Meeting error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
              <Icon name="info" className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Meeting Title</label>
              <input required type="text" name="title" value={formData.title}
                onChange={handleChange} placeholder="e.g. Monthly Strategy Review"
                className={inputCls} />
            </div>

            {/* Agenda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Agenda</label>
              <textarea name="agenda" value={formData.agenda} onChange={handleChange}
                placeholder="Briefly describe the meeting objective..." rows="3"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5" />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-slate-700">Date</label>
              <input 
                required 
                type="date" 
                name="meeting_date" 
                value={formData.meeting_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleChange} 
                className={inputCls} 
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-bold text-slate-700">Time</label>
              <input required type="time" name="meeting_time" value={formData.meeting_time}
                onChange={handleChange} className={inputCls} />
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Location</label>
              <div className="relative mt-2">
                <Icon name="location" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input type="text" name="location" value={formData.location}
                  onChange={handleChange} placeholder="e.g. Conference Room A or Zoom link"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5" />
              </div>
            </div>

            {/* ── Participants Section ── */}
            <div className="md:col-span-2">

              {/* Section header with toggle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-700">Invite Participants</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {registerMode
                      ? 'Register a new user and auto-invite them to this meeting.'
                      : 'Select from existing registered users.'}
                  </p>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => { setRegisterMode((v) => !v); setNpError('') }}
                  className={`relative flex h-8 w-[140px] items-center rounded-full border text-[11px] font-bold transition-all duration-300 ${
                    registerMode
                      ? 'border-blue-200 bg-blue-600 text-white'
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className={`absolute h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-300 ${
                    registerMode ? 'left-[108px]' : 'left-1'
                  }`} />
                  <span className={`absolute transition-all duration-300 ${registerMode ? 'left-3' : 'left-9'}`}>
                    {registerMode ? 'New User' : 'Existing'}
                  </span>
                </button>
              </div>

              {/* ── MODE: Select Existing Users ── */}
              {!registerMode && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50">
                  {loadingUsers ? (
                    <p className="p-4 text-center text-sm text-slate-500">Loading users...</p>
                  ) : users.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-400 italic">No registered users found.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition first:rounded-t-2xl last:rounded-b-2xl ${
                            formData.participants.includes(user.id)
                              ? 'bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                            checked={formData.participants.includes(user.id)}
                            onChange={() => handleParticipantToggle(user.id)}
                          />
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {user.fullname.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.fullname}</p>
                            <p className="text-xs text-slate-400 truncate">{user.username} · {user.role_name}</p>
                          </div>
                          {formData.participants.includes(user.id) && (
                            <Icon name="check" className="h-4 w-4 text-blue-600 shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.participants.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-2 text-xs font-bold text-blue-600">
                      {formData.participants.length} participant{formData.participants.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              )}

              {/* ── MODE: Register New Participant ── */}
              {registerMode && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                    <Icon name="user" className="h-4 w-4" />
                    New Participant Details
                  </div>

                  {npError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      <Icon name="info" className="h-4 w-4 shrink-0" />
                      {npError}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text" name="fullname" value={newParticipant.fullname}
                        onChange={handleNpChange} placeholder="e.g. Ahmed Al-Rashid"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Role <span className="text-red-500">*</span></label>
                      <select
                        name="roleId"
                        value={newParticipant.roleId}
                        onChange={handleNpChange}
                        className={inputCls}
                      >
                        <option value="">Select role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.role_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Email {!newParticipant.createLogin && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="email" name="email" value={newParticipant.email}
                        onChange={handleNpChange} placeholder="email@example.com"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                      <input
                        type="tel" name="phone" value={newParticipant.phone}
                        onChange={handleNpChange} placeholder="+1 234 567 8900"
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <label className="flex items-center justify-between gap-4">
                        <span>
                          <span className="block text-sm font-bold text-slate-700">Give login username and password?</span>
                          <span className="block text-xs text-slate-400">Turn on only when this participant should log in to the system.</span>
                        </span>
                        <input
                          type="checkbox"
                          name="createLogin"
                          checked={newParticipant.createLogin}
                          onChange={handleNpChange}
                          className="h-5 w-5 rounded border-slate-300 text-blue-600 accent-blue-600"
                        />
                      </label>
                    </div>

                    {newParticipant.createLogin && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Username <span className="text-red-500">*</span></label>
                          <input
                            type="text" name="username" value={newParticipant.username}
                            onChange={handleNpChange} placeholder="e.g. ahmed.rashid"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Password <span className="text-red-500">*</span></label>
                          <input
                            type="password" name="password" value={newParticipant.password}
                            onChange={handleNpChange} placeholder="Min. 4 characters"
                            className={inputCls}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    If login access is off, the system stores an internal username and password, then uses the participant email for invitations.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
            <button
              type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-[2] rounded-xl bg-blue-700 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-70"
            >
              {saving
                ? 'Saving...'
                : editMeeting
                ? 'Update Schedule'
                : registerMode
                ? 'Register & Schedule'
                : 'Confirm & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MeetingModal
