import { useEffect, useState } from 'react'
import { participantApi } from '../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function priorityClass(priority) {
  if (priority === 'high') return 'border-red-200 bg-red-50'
  if (priority === 'medium') return 'border-amber-200 bg-amber-50'
  return 'border-slate-200 bg-white'
}

function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [completionNote, setCompletionNote] = useState('')
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await participantApi.getMyTasks()
      setTasks(res.tasks || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    async function loadInitialTasks() {
      setLoading(true)
      try {
        const res = await participantApi.getMyTasks()
        if (active) setTasks(res.tasks || [])
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadInitialTasks()
    return () => {
      active = false
    }
  }, [])

  const startTask = async (taskId) => {
    setMessage('')
    setError('')
    try {
      await participantApi.startTask(taskId)
      setMessage('Task started.')
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  const submitTask = async (event) => {
    event.preventDefault()
    if (!selectedTask) return
    setMessage('')
    setError('')
    const formData = new FormData()
    formData.append('completion_note', completionNote)
    Array.from(attachments).forEach((file) => formData.append('attachments', file))

    try {
      await participantApi.submitTask(selectedTask.id, formData)
      setMessage('Task submitted for organizer review.')
      setSelectedTask(null)
      setCompletionNote('')
      setAttachments([])
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  const downloadAttachment = async (attachment) => {
    setError('')
    try {
      await participantApi.downloadAttachment(attachment.id, attachment.original_name)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading tasks...</div>

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-2xl font-semibold text-slate-950">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Tasks assigned to you for meeting follow-up.</p>
      </section>

      {(message || error) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <section className="grid gap-3">
        {tasks.map((task) => (
          <article key={task.id} className={`rounded-lg border p-4 ${priorityClass(task.priority)}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">{task.task_description}</h2>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-700">{task.priority}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">{task.status.replace('_', ' ')}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{task.meeting_title}</p>
                <p className="mt-1 text-sm text-slate-500">Deadline: {formatDate(task.deadline)} · Created: {formatDate(task.created_at)}</p>
                {task.rejection_reason && <p className="mt-2 text-sm text-red-700">Rejected: {task.rejection_reason}</p>}
                {task.attachments?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.attachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        type="button"
                        onClick={() => downloadAttachment(attachment)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-700 hover:bg-blue-50"
                      >
                        {attachment.original_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {task.status === 'pending' && (
                  <button onClick={() => startTask(task.id)} className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Start</button>
                )}
                {(task.status === 'pending' || task.status === 'in_progress') && (
                  <button onClick={() => setSelectedTask(task)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-700">Submit</button>
                )}
              </div>
            </div>
          </article>
        ))}
        {tasks.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">No tasks assigned.</div>}
      </section>

      {selectedTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <form onSubmit={submitTask} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Submit Task</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedTask.task_description}</p>
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Completion note</span>
              <textarea className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600" value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} required />
            </label>
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Attachments</span>
              <input type="file" multiple onChange={(event) => setAttachments(event.target.files)} className="text-sm" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedTask(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Submit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MyTasks
