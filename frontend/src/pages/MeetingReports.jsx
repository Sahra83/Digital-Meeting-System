import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { meetingApi } from '../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function safeFilename(value) {
  return (value || 'meeting-report').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

function MeetingReports() {
  const [dashboard, setDashboard] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [minutes, setMinutes] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    organizer: '',
    project: '',
    participant: '',
  })
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [dashboardResult, meetingResult] = await Promise.all([
          meetingApi.dashboard({ dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
          meetingApi.list(filters),
        ])

        if (!active) return
        setDashboard(dashboardResult.dashboard)
        setMeetings(meetingResult.meetings || [])
      } catch (err) {
        if (active) setError(err.message || 'Failed to load reports.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = setTimeout(loadData, 350)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [filters])

  useEffect(() => {
    let active = true

    async function loadSelectedReport() {
      if (!selectedMeetingId) {
        setSelectedMeeting(null)
        setMinutes(null)
        return
      }

      setReportLoading(true)
      setError('')

      try {
        const [meetingResult, minutesResult] = await Promise.all([
          meetingApi.get(selectedMeetingId),
          meetingApi.getMinutes(selectedMeetingId),
        ])

        if (!active) return
        setSelectedMeeting(meetingResult.meeting)
        setMinutes(minutesResult.minutes)
      } catch (err) {
        if (active) setError(err.message || 'Failed to load selected meeting report.')
      } finally {
        if (active) setReportLoading(false)
      }
    }

    loadSelectedReport()
    return () => {
      active = false
    }
  }, [selectedMeetingId])

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const closeReport = () => {
    setSelectedMeetingId('')
    setSelectedMeeting(null)
    setMinutes(null)
  }

  const stats = dashboard?.stats || {}
  const cards = [
    { label: 'Scheduled meetings', value: stats.scheduled_meetings || 0, icon: 'calendar', color: 'bg-blue-600' },
    { label: 'Completed meetings', value: stats.completed_meetings || 0, icon: 'check', color: 'bg-emerald-600' },
    { label: 'Pending action items', value: stats.pending_action_items || 0, icon: 'tasks', color: 'bg-amber-600' },
    { label: 'Meeting reports', value: stats.meetings_with_minutes || 0, icon: 'minutes', color: 'bg-slate-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Meeting Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Search meetings, select an event, then view its full report.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${card.color}`}>
              <Icon name={card.icon} className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white" placeholder="Search meetings" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white" type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white" type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white" placeholder="Organizer" value={filters.organizer} onChange={(e) => updateFilter('organizer', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white" placeholder="Project" value={filters.project} onChange={(e) => updateFilter('project', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:bg-white" placeholder="Participant" value={filters.participant} onChange={(e) => updateFilter('participant', e.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Select Event</h2>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{loading ? 'Loading...' : `${meetings.length} found`}</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => setSelectedMeetingId(meeting.id)}
              className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{meeting.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(meeting.meeting_date)} - {meeting.organizer_name}</p>
                  <p className="mt-1 text-xs text-slate-400">{meeting.location || 'No location'}</p>
                </div>
                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">View report</span>
              </div>
            </button>
          ))}
          {!loading && meetings.length === 0 && <p className="py-10 text-center text-sm text-slate-500 lg:col-span-2">No meetings matched the current query.</p>}
        </div>
      </section>

      {selectedMeetingId && (
        <ReportModal
          loading={reportLoading}
          meeting={selectedMeeting}
          minutes={minutes}
          onClose={closeReport}
        />
      )}
    </div>
  )
}

function ReportModal({ loading, meeting, minutes, onClose }) {
  const tasks = minutes?.assigned_tasks || []
  const participants = meeting?.participants || []
  const title = meeting?.title || 'Meeting report'
  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length
    const submitted = tasks.filter((task) => task.status === 'submitted').length
    const pending = tasks.filter((task) => task.status === 'pending').length
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length
    const notSubmitted = tasks.filter((task) => !['submitted', 'completed'].includes(task.status)).length

    return { completed, submitted, pending, inProgress, notSubmitted, total: tasks.length }
  }, [tasks])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Meeting Report</h2>
            <p className="mt-1 text-sm text-slate-500">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Loading selected report...</div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{meeting?.title || 'Untitled meeting'}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{meeting?.agenda || 'No agenda recorded.'}</p>
                  </div>
                  <div className="grid min-w-64 gap-2 text-sm text-slate-600">
                    <p><span className="font-bold text-slate-900">Date:</span> {formatDate(meeting?.meeting_date)}</p>
                    <p><span className="font-bold text-slate-900">Time:</span> {meeting?.meeting_time || 'Not set'}</p>
                    <p><span className="font-bold text-slate-900">Location:</span> {meeting?.location || 'Not set'}</p>
                    <p><span className="font-bold text-slate-900">Status:</span> {meeting?.status || 'Not set'}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-100 p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Participants</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {participants.length ? participants.map((participant) => (
                    <div key={participant.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-bold text-slate-900">{participant.fullname}</p>
                      <p className="mt-1 text-xs text-slate-500">{participant.username || 'Participant'}</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">No participants recorded.</p>}
                </div>
              </section>

              <section className="rounded-xl border border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Tasks</h3>
                  <div className="grid gap-2 sm:grid-cols-5">
                    <TaskMetric label="Total" value={taskStats.total} />
                    <TaskMetric label="Completed" value={taskStats.completed} />
                    <TaskMetric label="Submitted" value={taskStats.submitted} />
                    <TaskMetric label="Pending" value={taskStats.pending} />
                    <TaskMetric label="Not submitted" value={taskStats.notSubmitted} />
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 pr-4">Task name</th>
                        <th className="py-3 pr-4">Assigned to</th>
                        <th className="py-3 pr-4">Deadline</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length ? tasks.map((task) => (
                        <tr key={task.id} className="border-b border-slate-50">
                          <td className="py-3 pr-4 font-semibold text-slate-800">{task.task_description}</td>
                          <td className="py-3 pr-4 text-slate-600">{task.assigned_to_name || 'Unassigned'}</td>
                          <td className="py-3 pr-4 text-slate-600">{formatDate(task.deadline)}</td>
                          <td className="py-3 pr-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">{task.status || 'pending'}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-slate-500">No tasks recorded for this meeting.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => meetingApi.exportReport(meeting.id, 'pdf', safeFilename(title))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Export PDF</button>
                <button type="button" onClick={() => meetingApi.exportReport(meeting.id, 'word', safeFilename(title))} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Export Word</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  )
}

export default MeetingReports
