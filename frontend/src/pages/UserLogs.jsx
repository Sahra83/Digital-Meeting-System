import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { userApi } from '../services/api'

const typeLabels = {
  user_created: 'User created',
  user_updated: 'Profile updated',
  meeting_created: 'Meeting created',
  task_assigned: 'Task assigned',
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function UserLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadLogs() {
      try {
        const result = await userApi.getLogs({ limit: 120 })
        if (active) setLogs(result.logs || [])
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadLogs()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h1 className="text-2xl font-semibold text-slate-950">User logs</h1>
      </div>

      {loading && <div className="p-5 text-sm text-slate-600">Loading user logs...</div>}

      {!loading && error && (
        <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="p-5 text-sm text-slate-600">No user logs found.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="divide-y divide-slate-100">
          {logs.map((log, index) => (
            <article key={`${log.type}-${log.occurred_at}-${index}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Icon name={log.type === 'meeting_created' ? 'calendar' : log.type === 'task_assigned' ? 'tasks' : 'user'} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{typeLabels[log.type] || log.title}</p>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {log.actor_name} @{log.actor_username} · {log.actor_role}
                </p>
                {log.metadata?.meetingTitle && (
                  <p className="mt-1 text-sm text-slate-600">{log.metadata.meetingTitle}</p>
                )}
              </div>
              <time className="text-sm text-slate-500" dateTime={log.occurred_at}>
                {formatDate(log.occurred_at)}
              </time>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default UserLogs
