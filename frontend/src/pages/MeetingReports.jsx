import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { meetingApi } from '../services/api'
import { PieChart, BarChart } from '../components/Charts'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not set'
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
    status: '',
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
    { label: 'Total Meetings', value: stats.total_meetings || 0, icon: 'dashboard', color: 'from-blue-600 to-indigo-600' },
    { label: 'Completed Meetings', value: stats.completed_meetings || 0, icon: 'check', color: 'from-emerald-500 to-teal-600', note: 'date passed' },
    { label: 'Upcoming Soon', value: stats.upcoming_soon || 0, icon: 'tasks', color: 'from-amber-500 to-orange-500', note: 'next 3 days' },
    { label: 'Reports Available', value: stats.meetings_with_minutes || 0, icon: 'minutes', color: 'from-slate-700 to-slate-900' },
  ]

  const meetingTaskComparison = dashboard?.meetingTaskComparison || [];
  const distinctStatuses = dashboard?.distinctStatuses || [];

  // Build bar chart data: each meeting with completed_pct
  const barChartData = meetingTaskComparison.map(m => ({
    label: m.meeting_title.length > 12 ? m.meeting_title.slice(0, 12) + '…' : m.meeting_title,
    value: m.completed_pct || 0
  }));

  // Build pie chart data: each meeting's completed tasks count for comparison
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];
  const pieChartData = meetingTaskComparison
    .filter(m => m.completed_tasks > 0)
    .map((m, idx) => ({
      label: m.meeting_title.length > 14 ? m.meeting_title.slice(0, 14) + '…' : m.meeting_title,
      value: m.completed_tasks,
      color: pieColors[idx % pieColors.length]
    }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-8 text-white shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Meeting Reports & Analytics</h1>
          <p className="mt-2 text-slate-300">Filter meetings, view advanced analytics, and export full reports.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white bg-gradient-to-br ${card.color} shadow-inner`}>
                <Icon name={card.icon} className="h-6 w-6" />
              </div>
              {card.note && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.note}</span>}
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${card.color} opacity-0 transition-opacity group-hover:opacity-100`}></div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Big Bar Chart: Every meeting task completion comparison */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-2">All Meetings — Task Completion (%)</h2>
          <p className="text-xs text-slate-500 mb-6">Percentage of tasks submitted/completed per meeting. Data from database.</p>
          <div className="flex-1 flex items-end min-h-[220px]">
            {barChartData.length > 0 ? (
              <BarChart data={barChartData} />
            ) : (
              <div className="flex w-full h-32 items-center justify-center text-slate-400 text-sm italic">No meeting task data available</div>
            )}
          </div>
          {/* Legend table under the chart */}
          {meetingTaskComparison.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Meeting</th>
                    <th className="py-2 pr-3 text-center">Total</th>
                    <th className="py-2 pr-3 text-center">Completed</th>
                    <th className="py-2 pr-3 text-center">Pending</th>
                    <th className="py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {meetingTaskComparison.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1.5 pr-3 font-semibold text-slate-700 truncate max-w-[160px]">{m.meeting_title}</td>
                      <td className="py-1.5 pr-3 text-center text-slate-600">{m.total_tasks}</td>
                      <td className="py-1.5 pr-3 text-center text-emerald-600 font-bold">{m.completed_tasks}</td>
                      <td className="py-1.5 pr-3 text-center text-amber-600 font-bold">{m.pending_tasks}</td>
                      <td className="py-1.5 text-right font-black text-slate-900">{m.completed_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie Chart: Submitted tasks distribution across meetings + top submitters */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Submitted Tasks by Meeting</h2>
          <p className="text-xs text-slate-500 mb-6">Compare which meetings have the most submitted/completed tasks.</p>
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            {pieChartData.length > 0 ? (
              <PieChart data={pieChartData} />
            ) : (
              <div className="flex w-full h-32 items-center justify-center text-slate-400 text-sm italic">No submitted task data</div>
            )}
          </div>
          {/* Top submitters */}
          {meetingTaskComparison.some(m => m.top_submitters) && (
            <div className="mt-6 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top Submitters per Meeting</h3>
              {meetingTaskComparison.filter(m => m.top_submitters).map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-slate-700 whitespace-nowrap">{m.meeting_title.length > 20 ? m.meeting_title.slice(0, 20) + '…' : m.meeting_title}:</span>
                  <span className="text-slate-500">{m.top_submitters}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Filter Meetings</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <input className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white" placeholder="Search meetings" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white" placeholder="Project" value={filters.project} onChange={(e) => updateFilter('project', e.target.value)} />
          <input className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white" placeholder="Participant" value={filters.participant} onChange={(e) => updateFilter('participant', e.target.value)} />
          <select className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {distinctStatuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Meeting List */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Select Event to View Full Report</h2>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">{loading ? 'Loading...' : `${meetings.length} found`}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => setSelectedMeetingId(meeting.id)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
            >
              <div>
                <p className="font-bold text-slate-900 line-clamp-1">{meeting.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Icon name="calendar" className="h-3.5 w-3.5" />
                  {formatDate(meeting.meeting_date)}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Icon name="users" className="h-3.5 w-3.5" />
                  {meeting.organizer_name}
                </div>
              </div>
              <div className="mt-4 flex w-full items-center justify-between">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${meeting.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {meeting.status || 'scheduled'}
                </span>
                <span className="text-xs font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1">
                  View <Icon name="check" className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
          {!loading && meetings.length === 0 && <div className="py-10 text-center text-sm font-medium text-slate-500 lg:col-span-2 xl:col-span-3">No meetings matched the current query.</div>}
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
    const completed = tasks.filter((task) => task.status === 'completed' || task.status === 'approved').length
    const submitted = tasks.filter((task) => task.status === 'submitted').length
    const pending = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').length
    const notSubmitted = tasks.filter((task) => !['submitted', 'completed', 'approved'].includes(task.status)).length

    return { completed, submitted, pending, notSubmitted, total: tasks.length }
  }, [tasks])

  const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8'];
  const modalPieData = [
    { label: 'Completed', value: taskStats.completed, color: pieColors[0] },
    { label: 'Submitted', value: taskStats.submitted, color: pieColors[1] },
    { label: 'Pending', value: taskStats.pending, color: pieColors[2] },
    { label: 'Not Submitted', value: taskStats.notSubmitted, color: pieColors[3] }
  ].filter(d => d.value > 0);

  // Bar chart: per-assignee task count
  const assigneeCounts = {};
  tasks.forEach(t => {
    const name = t.assigned_to_name || 'Unassigned';
    if (!assigneeCounts[name]) assigneeCounts[name] = { completed: 0, total: 0 };
    assigneeCounts[name].total++;
    if (['completed', 'approved', 'submitted'].includes(t.status)) assigneeCounts[name].completed++;
  });
  const modalBarData = Object.entries(assigneeCounts).map(([name, c]) => ({
    label: name.split(' ')[0],
    value: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Meeting Report</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-100px)] overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Icon name="chart" className="h-10 w-10 animate-pulse mb-4" />
              <p className="text-sm font-bold uppercase tracking-wider">Loading report...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="rounded-2xl border border-slate-100 p-6 bg-white shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900">{meeting?.title || 'Untitled meeting'}</h3>
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Agenda</h4>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{meeting?.agenda || 'No agenda recorded.'}</p>
                    </div>
                  </div>
                  <div className="grid min-w-[280px] gap-3 text-sm text-slate-600 rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="font-bold text-slate-900 text-xs uppercase">Date</span>
                      <span className="font-medium">{formatDate(meeting?.meeting_date)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="font-bold text-slate-900 text-xs uppercase">Time</span>
                      <span className="font-medium">{meeting?.meeting_time || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="font-bold text-slate-900 text-xs uppercase">Location</span>
                      <span className="font-medium">{meeting?.location || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs uppercase">Status</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${meeting?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {meeting?.status || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 p-6 bg-white shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-5">Participants ({participants.length})</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {participants.length ? participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                        {participant.fullname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{participant.fullname}</p>
                        <p className="text-xs font-medium text-slate-500">@{participant.username || 'user'}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic">No participants recorded.</p>}
                </div>
              </section>

              {/* Charts in the modal */}
              <section className="rounded-2xl border border-slate-100 p-6 bg-white shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-6">Task Analytics</h3>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Pie chart: task status breakdown */}
                  <div className="flex flex-col items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Task Status Breakdown</h4>
                    {modalPieData.length > 0 ? (
                      <PieChart data={modalPieData} />
                    ) : (
                      <p className="text-sm text-slate-400 italic mt-8">No tasks recorded</p>
                    )}
                  </div>
                  {/* Bar chart: completion % per assignee */}
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Completion (%) by Assignee</h4>
                    <div className="flex-1 flex items-end min-h-[180px]">
                      {modalBarData.length > 0 ? (
                        <BarChart data={modalBarData} />
                      ) : (
                        <p className="text-sm text-slate-400 italic mt-8">No assignee data</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 p-6 bg-white shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Action Items Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <TaskMetric label="Total" value={taskStats.total} color="slate" />
                    <TaskMetric label="Completed" value={taskStats.completed} color="emerald" />
                    <TaskMetric label="Submitted" value={taskStats.submitted} color="blue" />
                    <TaskMetric label="Pending" value={taskStats.pending} color="amber" />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-4 pl-5 pr-4">Task name</th>
                        <th className="py-4 pr-4">Assigned to</th>
                        <th className="py-4 pr-4">Deadline</th>
                        <th className="py-4 pr-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasks.length ? tasks.map((task) => (
                        <tr key={task.id} className="transition hover:bg-slate-50/50">
                          <td className="py-4 pl-5 pr-4 font-semibold text-slate-800">{task.task_description}</td>
                          <td className="py-4 pr-4 text-slate-600 font-medium">
                            {task.assigned_to_name ? (
                               <span className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">{task.assigned_to_name.charAt(0)}</div>{task.assigned_to_name}</span>
                            ) : 'Unassigned'}
                          </td>
                          <td className="py-4 pr-4 text-slate-500">{formatDate(task.deadline)}</td>
                          <td className="py-4 pr-5 text-right">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                              ${task.status === 'completed' || task.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                task.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                              {task.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500 italic">No tasks recorded for this meeting.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-slate-100 pt-6 mt-6">
                <button type="button" onClick={() => meetingApi.exportReport(meeting.id, 'pdf', safeFilename(title))} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm">
                  <Icon name="dashboard" className="h-4 w-4" /> Export PDF
                </button>
                <button type="button" onClick={() => meetingApi.exportReport(meeting.id, 'word', safeFilename(title))} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
                  <Icon name="tasks" className="h-4 w-4" /> Export Word
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskMetric({ label, value, color }) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <div className={`rounded-lg px-4 py-2 text-center ${colorMap[color] || colorMap.slate}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  )
}

export default MeetingReports
