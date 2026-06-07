import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { participantApi } from '../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function MyMeetings() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    participantApi.getMyMeetings()
      .then((res) => setMeetings(res.meetings || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading meetings...</div>
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h1 className="text-xl font-semibold text-slate-950">My Meetings</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Organizer</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-semibold text-blue-700">
                  <Link to={`/participant/meetings/${meeting.id}`}>{meeting.title}</Link>
                </td>
                <td className="px-5 py-3">{formatDate(meeting.meeting_date)}</td>
                <td className="px-5 py-3">{meeting.meeting_time || 'Not set'}</td>
                <td className="px-5 py-3">{meeting.location || 'No location'}</td>
                <td className="px-5 py-3">{meeting.organizer_name}</td>
                <td className="px-5 py-3 capitalize">{meeting.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {meetings.length === 0 && <p className="p-5 text-sm text-slate-500">No meetings found.</p>}
      </div>
    </section>
  )
}

export default MyMeetings
