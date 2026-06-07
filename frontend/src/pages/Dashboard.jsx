import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { meetingApi } from '../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function Dashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    meetingApi.dashboard()
      .then((result) => {
        if (active) setDashboard(result.dashboard)
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load dashboard details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const summary = dashboard?.stats || {}
  const stats = [
    { label: 'Total Users', value: summary.total_users ?? 0, icon: 'users', color: 'bg-blue-600', note: `${summary.active_users ?? 0} active` },
    { label: 'Scheduled Meetings', value: summary.scheduled_meetings ?? 0, icon: 'calendar', color: 'bg-emerald-600', note: 'scheduled' },
    { label: 'Completed Meetings', value: summary.completed_meetings ?? 0, icon: 'check', color: 'bg-slate-700', note: 'completed' },
    { label: 'Pending Actions', value: summary.pending_action_items ?? 0, icon: 'tasks', color: 'bg-amber-600', note: `${summary.total_action_items ?? 0} total` },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-slate-900 px-8 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.fullname?.split(' ')[0] || 'Admin'}!</h1>
            <p className="mt-2 text-slate-300">Live meeting, report, user, and action-item details from the system.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/reports" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500">
              View Reports
            </Link>
            <Link to="/dashboard/meetings" className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20">
              Manage Meetings
            </Link>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${stat.color}`}>
                <Icon name={stat.icon} className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{loading ? 'loading' : stat.note}</span>
            </div>
            <div className="mt-5">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Panel title="Scheduled Meetings" items={dashboard?.upcomingMeetings || []} renderItem={(meeting) => (
          <>
            <p className="text-sm font-bold text-slate-900">{meeting.title}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(meeting.meeting_date)} - {meeting.organizer_name}</p>
          </>
        )} />

        <Panel title="Completed Meetings" items={dashboard?.completedMeetings || []} renderItem={(meeting) => (
          <>
            <p className="text-sm font-bold text-slate-900">{meeting.title}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(meeting.meeting_date)} - {meeting.organizer_name}</p>
          </>
        )} />

        <Panel title="Pending Action Items" items={dashboard?.pendingActionItems || []} renderItem={(task) => (
          <>
            <p className="text-sm font-bold text-slate-900">{task.task_description}</p>
            <p className="mt-1 text-xs text-slate-500">{task.assigned_to_name || 'Unassigned'} - {task.meeting_title}</p>
          </>
        )} />
      </div>
    </div>
  )
}

function Panel({ title, items, renderItem }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-50 p-4">
            {renderItem(item)}
          </div>
        )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nothing to show yet.</p>}
      </div>
    </section>
  )
}

export default Dashboard
