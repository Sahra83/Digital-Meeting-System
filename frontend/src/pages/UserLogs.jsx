import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { userApi } from '../services/api'

const typeLabels = {
  login_success: 'Login successful',
  login_failed: 'Login failed',
  logout: 'Logout',
  meeting_created: 'Meeting created',
  meeting_updated: 'Meeting updated',
  meeting_deleted: 'Meeting deleted',
  minutes_created: 'Meeting minutes created',
  minutes_updated: 'Meeting minutes updated',
  minutes_sent: 'Meeting minutes sent',
  minutes_restored: 'Meeting minutes restored',
  task_started: 'Task started',
  task_submitted: 'Task submitted',
  task_approved: 'Task approved',
  task_rejected: 'Task rejected',
  task_email_resent: 'Task email resent',
  comment_added: 'Comment added',
  comment_updated: 'Comment updated',
  comment_deleted: 'Comment deleted',
  user_created: 'User created',
  user_updated: 'Profile updated',
  user_deleted: 'User deleted',
  profile_updated: 'Profile updated',
}

function getReadableApiAction(log) {
  const rawPath = log.metadata?.path || log.details || ''
  const methodMatch = rawPath.match(/^(GET|POST|PUT|PATCH|DELETE)\s+/)
  const method = log.metadata?.method || methodMatch?.[1] || log.type?.replace('api_', '')?.toUpperCase()
  const path = rawPath
    .replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/, '')
    .replace(/^\/api(?:\/v1)?/, '')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')

  const actions = {
    'POST /meetings': 'Meeting created',
    'PUT /meetings/:id': 'Meeting updated',
    'DELETE /meetings/:id': 'Meeting deleted',
    'POST /meetings/:id/minutes': 'Meeting minutes created',
    'PUT /meetings/:id/minutes': 'Meeting minutes updated',
    'POST /meetings/:id/minutes/notify': 'Meeting minutes sent',
    'POST /meetings/:id/minutes/versions/:id/restore': 'Meeting minutes restored',
    'POST /participant/tasks/:id/submit': 'Task submitted',
    'PATCH /participant/tasks/:id/start': 'Task started',
    'PATCH /organizer/tasks/:id/approve': 'Task approved',
    'PATCH /organizer/tasks/:id/reject': 'Task rejected',
    'POST /tasks/:id/resend-email': 'Task email resent',
    'POST /collaboration/comments': 'Comment added',
    'PUT /collaboration/comments/:id': 'Comment updated',
    'DELETE /collaboration/comments/:id': 'Comment deleted',
  }

  return actions[`${method} ${path}`] || typeLabels[log.type] || log.title?.replace(/_/g, ' ')
}

function getLogTitle(log) {
  if (log.type?.startsWith('api_')) return getReadableApiAction(log)
  return typeLabels[log.type] || log.title?.replace(/_/g, ' ')
}

function getLogDetails(log) {
  if (log.type?.startsWith('api_')) return ''
  return log.details || ''
}

function getActorText(log) {
  return `${log.actor_name || 'System'} @${log.actor_username || 'system'} - ${log.actor_role || 'System'}`
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
                <Icon name={log.type?.includes('login') || log.type === 'logout' ? 'history' : 'user'} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{getLogTitle(log)}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{getActorText(log)}</p>
                <p className="hidden">
                  {log.actor_name} @{log.actor_username} · {log.actor_role}
                </p>
                {log.metadata?.meetingTitle && (
                  <p className="mt-1 text-sm text-slate-600">{log.metadata.meetingTitle}</p>
                )}
                {getLogDetails(log) && (
                  <p className="mt-1 text-sm text-slate-600">{getLogDetails(log)}</p>
                )}
                {(log.target_username || log.ip_address) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {log.target_username ? `Target: @${log.target_username}` : ''}{log.target_username && log.ip_address ? ' - ' : ''}{log.ip_address ? `IP: ${log.ip_address}` : ''}
                  </p>
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
