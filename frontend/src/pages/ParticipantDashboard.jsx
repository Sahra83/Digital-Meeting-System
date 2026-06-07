import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { participantApi } from '../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function ParticipantDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    participantApi.getDashboardStats()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading dashboard...</div>
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your meetings and action items.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">My Meetings</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.meetingCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">My Tasks</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.taskCount}</p>
        </div>
        {Object.entries(data.taskStats || {}).map(([status, count]) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium capitalize text-slate-500">{status.replace('_', ' ')}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{count}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">My Meetings</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(data.meetings || []).map((meeting) => (
              <Link key={meeting.id} to={`/participant/meetings/${meeting.id}`} className="block px-5 py-4 hover:bg-slate-50">
                <p className="font-semibold text-slate-900">{meeting.title}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(meeting.meeting_date)} at {meeting.meeting_time || 'Not set'}</p>
                <p className="mt-1 text-sm text-slate-500">{meeting.location || 'No location'} · {meeting.organizer_name}</p>
              </Link>
            ))}
            {data.meetings?.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No meetings found.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">My Tasks</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(data.tasks || []).map((task) => (
              <div key={task.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900">{task.task_description}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">{task.priority}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{task.meeting_title}</p>
                <p className="mt-1 text-sm text-slate-500">Deadline: {formatDate(task.deadline)} · {task.status}</p>
              </div>
            ))}
            {data.tasks?.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No tasks assigned.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ParticipantDashboard
