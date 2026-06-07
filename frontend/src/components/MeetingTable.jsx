import Icon from './Icon'

function MeetingTable({ meetings, onEdit, onDelete, onView }) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <Icon name="calendar" className="h-10 w-10" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">No meetings scheduled</h3>
        <p className="mt-1 text-sm text-slate-500">Scheduled meetings will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Meeting Title</th>
            <th className="px-6 py-4">Date & Time</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Organizer</th>
            <th className="px-6 py-4">Participants</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {meetings.map((meeting) => (
            <tr key={meeting.id} className="group transition hover:bg-slate-50/50">
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-900">{meeting.title}</p>
                <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500">{meeting.agenda}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Icon name="calendar" className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {new Date(meeting.meeting_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Icon name="clock" className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-500">{meeting.meeting_time}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Icon name="location" className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{meeting.location}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {meeting.organizer_name}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex -space-x-2">
                  {meeting.participants?.slice(0, 3).map((p, idx) => (
                    <div 
                      key={p.id} 
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600"
                      title={p.fullname}
                    >
                      {p.fullname.charAt(0)}
                    </div>
                  ))}
                  {meeting.participants?.length > 3 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500">
                      +{meeting.participants.length - 3}
                    </div>
                  )}
                  {(!meeting.participants || meeting.participants.length === 0) && (
                    <span className="text-xs text-slate-400">None</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onView(meeting)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-900 hover:text-white"
                    title="View Details"
                  >
                    <Icon name="eye" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(meeting)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-blue-100 hover:text-blue-600"
                    title="Edit"
                  >
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(meeting)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                    title="Delete"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MeetingTable
