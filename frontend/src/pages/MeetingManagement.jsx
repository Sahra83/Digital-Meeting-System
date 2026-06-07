import { useEffect, useState } from 'react'
import { meetingApi } from '../services/api'
import MeetingTable from '../components/MeetingTable'
import MeetingModal from '../components/MeetingModal'
import MeetingViewModal from '../components/MeetingViewModal'
import AlertModal from '../components/AlertModal'
import Icon from '../components/Icon'

function MeetingManagement() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingMeeting, setViewingMeeting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editMeeting, setEditMeeting] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    organizer: '',
    project: '',
    participant: '',
  })
  
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' })

  const loadMeetings = async (nextFilters = filters) => {
    setLoading(true)
    try {
      const data = await meetingApi.list(nextFilters)
      setMeetings(data.meetings || [])
    } catch (err) {
      showAlert('error', 'Failed to load meetings', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMeetings(filters)
    }, 400)
    return () => clearTimeout(timer)
  }, [filters])

  const showAlert = (type, title, message, onConfirm = null) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: onConfirm || (() => setAlert(prev => ({ ...prev, isOpen: false })))
    })
  }

  const handleOpenAddModal = () => {
    setEditMeeting(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (meeting) => {
    setEditMeeting(meeting)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (formData) => {
    setSaving(true)
    try {
      if (editMeeting) {
        const res = await meetingApi.update(editMeeting.id, formData)
        const extra = res.newParticipantRegistered ? ' New participant registered and linked.' : ''
        showAlert('success', 'Meeting Updated', `The meeting schedule has been updated and participant emails are being sent.${extra}`)
      } else {
        const res = await meetingApi.create(formData)
        const extra = res.newParticipantRegistered ? ' New participant was registered and added to the meeting.' : ''
        showAlert('success', 'Meeting Scheduled', `Meeting scheduled and invitations sent to all participants!${extra}`)
      }
      // Small delay before closing to allow any browser extensions/listeners to finish
      // and prevent 'message channel closed before a response was received' error
      setTimeout(() => {
        setIsModalOpen(false)
        setSaving(false)
        loadMeetings(filters)
      }, 150)
    } catch (err) {
      const details = err.details ? `\n\nDetails:\n${err.details.map(d => `• ${d.msg}`).join('\n')}` : ''
      showAlert('error', 'Operation Failed', `${err.message}${details}`)
      setSaving(false)
    }
  }

  const handleDeleteClick = (meeting) => {
    const doDelete = async () => {
      setAlert(prev => ({ ...prev, isOpen: false }))
      try {
        await meetingApi.delete(meeting.id)
        showAlert('success', 'Meeting Cancelled', `"${meeting.title}" has been removed from the schedule.`)
        loadMeetings(filters)
      } catch (err) {
        showAlert('error', 'Cancellation Failed', err.message)
      }
    }
    showAlert(
      'danger',
      'Delete Meeting',
      `Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`,
      doDelete,
      'Delete Schedule'
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Meeting Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule new meetings, manage agendas, and track participants.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
        >
          <Icon name="plus" className="h-5 w-5" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/20">
        <div className="flex flex-col gap-4 border-b border-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings by title, agenda, or location..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            {loading ? 'Searching...' : `${meetings.length} Meetings Found`}
          </div>
        </div>
        <div className="grid gap-3 border-b border-slate-50 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
          />
          <input
            type="text"
            placeholder="Filter by organizer"
            value={filters.organizer}
            onChange={(e) => setFilters((prev) => ({ ...prev, organizer: e.target.value }))}
            className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
          />
          <input
            type="text"
            placeholder="Filter by project"
            value={filters.project}
            onChange={(e) => setFilters((prev) => ({ ...prev, project: e.target.value }))}
            className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
          />
          <input
            type="text"
            placeholder="Filter by participant"
            value={filters.participant}
            onChange={(e) => setFilters((prev) => ({ ...prev, participant: e.target.value }))}
            className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
          />
        </div>
        <div className="p-6">
          {loading && meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-slate-500">Fetching schedule...</p>
            </div>
          ) : (
            <MeetingTable 
              meetings={meetings} 
              onEdit={handleOpenEditModal} 
              onDelete={handleDeleteClick}
              onView={(meeting) => {
                setViewingMeeting(meeting)
                setIsViewModalOpen(true)
              }}
            />
          )}
        </div>
      </div>

      <MeetingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit}
        editMeeting={editMeeting}
        saving={saving}
      />

      <MeetingViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        meeting={viewingMeeting}
      />

      <AlertModal 
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={() => setAlert(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

export default MeetingManagement
