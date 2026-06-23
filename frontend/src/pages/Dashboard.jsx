import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { meetingApi } from '../services/api'
import { PieChart, BarChart, LineChart } from '../components/Charts'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not set'
}

function formatTime(value) {
  if (!value) return '';
  const [h, m] = value.split(':');
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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
    { label: 'Total Users', value: summary.total_users ?? 0, icon: 'users', color: 'from-blue-600 to-indigo-600', note: `${summary.active_users ?? 0} active` },
    { label: 'Scheduled Meetings', value: summary.scheduled_meetings ?? 0, icon: 'calendar', color: 'from-emerald-500 to-teal-600', note: 'upcoming' },
    { label: 'Completed Meetings', value: summary.completed_meetings ?? 0, icon: 'check', color: 'from-slate-700 to-slate-900', note: 'finished' },
    { label: 'Pending Actions', value: summary.pending_action_items ?? 0, icon: 'tasks', color: 'from-amber-500 to-orange-600', note: `${summary.total_action_items ?? 0} total` },
  ]

  const taskStatusData = [
    { label: 'Pending', value: summary.pending_action_items ?? 0, color: '#f59e0b' },
    { label: 'Completed', value: Math.max(0, (summary.total_action_items ?? 0) - (summary.pending_action_items ?? 0)), color: '#10b981' }
  ];

  const organizerData = (dashboard?.meetingsByOrganizer || []).map(org => ({
    label: org.organizer_name.split(' ')[0],
    value: org.meeting_count
  }));

  // Line chart showing trend of completed meetings
  const recentCompleted = (dashboard?.completedMeetings || []).slice().reverse();
  const timelineData = recentCompleted.reduce((acc, m) => {
    const d = new Date(m.meeting_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const existing = acc.find(x => x.label === d);
    if (existing) existing.value += 1;
    else acc.push({ label: d, value: 1 });
    return acc;
  }, []);
  
  if (timelineData.length === 1) timelineData.unshift({ label: 'Past', value: 0 });
  if (timelineData.length === 0) timelineData.push({label: 'No Data', value: 0}, {label: 'Now', value: 0});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600 blur-[80px] opacity-40 mix-blend-screen pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500 blur-[80px] opacity-20 mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Welcome back, <span className="text-blue-400">{user?.fullname?.split(' ')[0] || 'Admin'}</span>!</h1>
            <p className="mt-3 text-lg text-slate-300 max-w-xl">Here is what's happening with your meetings, tasks, and team productivity today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/reports" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500 shadow-lg shadow-blue-500/30">
              View Analytics
            </Link>
            <Link to="/dashboard/meetings" className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/20 backdrop-blur-md">
              Manage Meetings
            </Link>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white bg-gradient-to-br ${stat.color} shadow-inner`}>
                <Icon name={stat.icon} className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{loading ? 'loading' : stat.note}</span>
            </div>
            <div className="mt-5">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`}></div>
          </div>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Task Completion</h2>
          <div className="flex-1 flex items-center justify-center">
            <PieChart data={taskStatusData} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Meetings by Organizer</h2>
          <div className="flex-1 flex items-end">
            <BarChart data={organizerData} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Completion Trend</h2>
          <div className="flex-1 flex items-end">
            <LineChart data={timelineData} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Upcoming Meetings" items={dashboard?.upcomingMeetings || []} renderItem={(meeting) => (
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 p-2 min-w-[3.5rem]">
              <span className="text-xs font-bold uppercase">{new Date(meeting.meeting_date).toLocaleDateString(undefined, { month: 'short' })}</span>
              <span className="text-lg font-black">{new Date(meeting.meeting_date).getDate()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{meeting.title}</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">{formatTime(meeting.meeting_time)} • {meeting.location}</p>
              <p className="mt-1 text-xs text-slate-400">Org: {meeting.organizer_name}</p>
            </div>
          </div>
        )} />

        <Panel title="Pending Action Items" items={dashboard?.pendingActionItems || []} renderItem={(task) => (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-500">
              <Icon name="tasks" className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{task.task_description}</p>
              <p className="mt-1 text-xs font-medium text-amber-600">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</p>
              <p className="mt-1 text-xs text-slate-500">{task.assigned_to_name || 'Unassigned'} • {task.meeting_title}</p>
            </div>
          </div>
        )} />

        <Panel className="xl:col-span-1 lg:col-span-2" title="Recently Completed" items={dashboard?.completedMeetings || []} renderItem={(meeting) => (
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icon name="check" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{meeting.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatDate(meeting.meeting_date)}</p>
            </div>
          </div>
        )} />
      </div>
    </div>
  )
}

function Panel({ title, items, renderItem, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {items.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-50 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
            {renderItem(item)}
          </div>
        )) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <p className="text-sm text-slate-500 font-medium">Nothing to show yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Dashboard
