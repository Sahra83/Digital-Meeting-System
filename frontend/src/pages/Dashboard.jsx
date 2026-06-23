import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { meetingApi } from '../services/api'

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
    { label: 'Scheduled Meetings', value: summary.scheduled_meetings ?? 0, icon: 'calendar', color: 'from-emerald-500 to-teal-600', note: 'total upcoming' },
    { label: 'Past Scheduled', value: summary.scheduled_past_meetings ?? 0, icon: 'check', color: 'from-slate-700 to-slate-900', note: 'date finished' },
    { label: 'Closing Soon', value: summary.closing_soon_meetings ?? 0, icon: 'tasks', color: 'from-amber-500 to-orange-600', note: 'next 3 days' },
  ]

  const meetingTaskComparison = dashboard?.meetingTaskComparison || [];
  const topParticipants = dashboard?.topParticipants || [];
  const delinquentMeetings = dashboard?.delinquentMeetings || [];
  const upcomingMeetings = dashboard?.upcomingMeetings || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
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

      {/* Big Chart: Meeting Task Comparison */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
        <h2 className="text-xl font-black text-slate-900 mb-6">Meeting Task Completion Comparison</h2>
        <div className="flex-1 space-y-5">
          {meetingTaskComparison.length > 0 ? meetingTaskComparison.map((m, idx) => {
            const completedPct = m.total_tasks > 0 ? Math.round((m.completed_tasks / m.total_tasks) * 100) : 0;
            const pendingPct = m.total_tasks > 0 ? 100 - completedPct : 0;
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-700 truncate mr-4">{m.meeting_title}</span>
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{m.total_tasks} Total Tasks</span>
                </div>
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-emerald-500 transition-all duration-1000 flex items-center justify-center" style={{ width: `${completedPct}%` }}>
                    {completedPct > 10 && <span className="text-[10px] font-bold text-white">{completedPct}% Completed</span>}
                  </div>
                  <div className="bg-amber-400 transition-all duration-1000 flex items-center justify-center" style={{ width: `${pendingPct}%` }}>
                    {pendingPct > 10 && <span className="text-[10px] font-bold text-white">{pendingPct}% Not Completed</span>}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm italic">No meeting tasks available</div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Participants Analytics */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Top Participants Task Performance</h2>
          <div className="flex-1 space-y-6">
            {topParticipants.length > 0 ? topParticipants.map((p, idx) => {
              const compPct = p.tasks_assigned > 0 ? Math.round((p.tasks_completed / p.tasks_assigned) * 100) : 0;
              const pendPct = p.tasks_assigned > 0 ? 100 - compPct : 0;
              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{p.participant_name.charAt(0)}</div>
                      <span className="text-sm font-bold text-slate-800">{p.participant_name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{p.meetings_attended} meetings</span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 mb-1">
                    <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${compPct}%` }} title={`Completed: ${p.tasks_completed}`}></div>
                    <div className="bg-rose-500 transition-all duration-1000" style={{ width: `${pendPct}%` }} title={`Not Submitted: ${p.tasks_pending}`}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>{p.tasks_completed} Submitted</span>
                    <span>{p.tasks_pending} Not Submitted</span>
                  </div>
                </div>
              );
            }) : (
              <div className="flex h-32 items-center justify-center text-slate-400 text-sm italic">No participants data available</div>
            )}
          </div>
        </section>

        {/* Meeting Task Delinquency List */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Highest Pending Tasks</h2>
          <p className="text-xs text-slate-500 mb-5">Meetings where participants have not submitted their tasks.</p>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {delinquentMeetings.length > 0 ? delinquentMeetings.map((m) => {
              const delinquentPct = Math.round((m.pending_tasks / m.total_tasks) * 100);
              return (
                <div key={m.id} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-red-200 hover:bg-red-50/30 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-red-900 transition-colors">{m.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{new Date(m.meeting_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-rose-600">{m.pending_tasks} <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span></span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200 mt-1">{delinquentPct}% of total</span>
                  </div>
                </div>
              );
            }) : (
              <div className="flex h-32 items-center justify-center text-slate-400 text-sm italic">No delinquent meetings</div>
            )}
          </div>
        </section>
      </div>

      {/* Upcoming Meetings List */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Scheduled Meetings</h2>
          <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {upcomingMeetings.length}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {upcomingMeetings.length ? upcomingMeetings.map((meeting) => (
            <div key={meeting.id} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
              <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700 p-2 min-w-[3.5rem] shrink-0 border border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{new Date(meeting.meeting_date).toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="text-lg font-black leading-none mt-1">{new Date(meeting.meeting_date).getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{meeting.title}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Icon name="calendar" className="h-3 w-3" /> {formatTime(meeting.meeting_time)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon name="users" className="h-3 w-3" /> {meeting.organizer_name}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full flex h-32 items-center justify-center text-slate-400 text-sm italic border border-dashed rounded-xl border-slate-200">
              No upcoming meetings scheduled.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
