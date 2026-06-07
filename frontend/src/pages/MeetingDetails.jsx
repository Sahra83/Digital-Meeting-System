import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { participantApi } from '../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function MeetingDetails() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    participantApi.getMeetingDetails(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading meeting...</div>
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>

  const { meeting, minutes, discussionPoints, decisions, documents, tasks } = data

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-950">{meeting.title}</h1>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>Date: {formatDate(meeting.meeting_date)}</p>
          <p>Time: {meeting.meeting_time || 'Not set'}</p>
          <p>Location: {meeting.location || 'No location'}</p>
          <p>Organizer: {meeting.organizer_name}</p>
          <p className="capitalize">Status: {meeting.status}</p>
        </div>
        {meeting.agenda && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{meeting.agenda}</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Meeting Minutes</h2>
        {minutes ? <p className="mt-2 text-sm text-slate-500">Created {formatDate(minutes.created_at)}</p> : <p className="mt-2 text-sm text-slate-500">No minutes recorded.</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Discussion Points</h2>
          <div className="mt-3 grid gap-3">
            {(discussionPoints || []).map((point) => <p key={point.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{point.topic}</p>)}
            {discussionPoints?.length === 0 && <p className="text-sm text-slate-500">No discussion points recorded.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Decisions</h2>
          <div className="mt-3 grid gap-3">
            {(decisions || []).map((decision) => (
              <div key={decision.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p>{decision.decision_text}</p>
                {decision.made_by_name && <p className="mt-1 text-xs text-slate-500">By {decision.made_by_name}</p>}
              </div>
            ))}
            {decisions?.length === 0 && <p className="text-sm text-slate-500">No decisions recorded.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Assigned Tasks</h2>
        <div className="mt-3 grid gap-3">
          {(tasks || []).map((task) => (
            <div key={task.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold">{task.task_description}</p>
              <p className="mt-1 text-slate-500">Deadline: {formatDate(task.deadline)} · {task.status}</p>
            </div>
          ))}
          {tasks?.length === 0 && <p className="text-sm text-slate-500">No tasks assigned to you for this meeting.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Meeting Documents</h2>
        <div className="mt-3 grid gap-2">
          {(documents || []).map((document) => (
            <button
              key={document.id}
              type="button"
              className="text-left text-sm font-semibold text-blue-700 hover:text-blue-800"
              onClick={() => participantApi.downloadDocument(document.id, document.original_name)}
            >
              {document.original_name}
            </button>
          ))}
          {documents?.length === 0 && <p className="text-sm text-slate-500">No documents uploaded.</p>}
        </div>
      </section>
    </div>
  )
}

export default MeetingDetails
