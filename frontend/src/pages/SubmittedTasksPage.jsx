import { useEffect, useState } from 'react';
import { organizerApi, taskApi } from '../services/api';

export default function SubmittedTasksPage() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingTitle, setSelectedMeetingTitle] = useState('');
  const [submittedTasks, setSubmittedTasks] = useState([]);
  const [rejectingTask, setRejectingTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { meetings } = await taskApi.getMeetings();
        setMeetings(meetings);
        const { tasks: reviewTasks } = await organizerApi.getSubmittedTasks();
        setSubmittedTasks(reviewTasks || []);
      } catch (err) {
        setError('Failed to load tasks and meetings: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fetchSubmittedTasks = async () => {
    try {
      const { tasks: reviewTasks } = await organizerApi.getSubmittedTasks();
      setSubmittedTasks(reviewTasks || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const approveTask = async (taskId) => {
    setMessage('');
    setError('');
    try {
      await organizerApi.approveTask(taskId);
      setMessage('Task approved.');
      fetchSubmittedTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const rejectTask = async (event) => {
    event.preventDefault();
    if (!rejectingTask) return;
    setMessage('');
    setError('');
    try {
      await organizerApi.rejectTask(rejectingTask.id, { rejection_reason: rejectionReason });
      setMessage('Task rejected.');
      setRejectingTask(null);
      setRejectionReason('');
      fetchSubmittedTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadAttachment = async (attachment) => {
    setError('');
    try {
      await organizerApi.downloadAttachment(attachment.id, attachment.original_name);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTasks = selectedMeetingTitle
    ? submittedTasks.filter((task) => task.meeting_title === selectedMeetingTitle)
    : [];

  return (
    <div className="grid gap-8 p-6">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Admin Submitted Tasks</h1>
        <p className="text-sm text-slate-500 mb-6">Select a meeting to view tasks submitted by participants for review.</p>
        
        {(message || error) && (
          <div className={`mb-4 rounded border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        <div className="mb-6">
          <label className="mr-2 font-medium" htmlFor="meetingSelect">Select Meeting:</label>
          <select
            id="meetingSelect"
            value={selectedMeetingTitle}
            onChange={e => setSelectedMeetingTitle(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Choose a meeting --</option>
            {meetings.map(m => (
              <option key={m.id} value={m.title}>{m.title} ({new Date(m.meeting_date).toLocaleDateString()})</option>
            ))}
          </select>
        </div>
      </section>

      {selectedMeetingTitle && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Submitted Tasks for {selectedMeetingTitle}</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-sm text-slate-500">No submitted tasks awaiting review for this meeting.</p>
          ) : (
            <div className="grid gap-3">
              {filteredTasks.map((task) => (
                <article key={task.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{task.task_description}</p>
                      <p className="mt-1 text-sm text-slate-500">Submitted by: {task.participant_name}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{task.completion_note}</p>
                      {task.attachments?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.attachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-700 hover:bg-blue-50"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              {attachment.original_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveTask(task.id)} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Approve</button>
                      <button onClick={() => setRejectingTask(task)} className="h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50">Reject</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {rejectingTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <form onSubmit={rejectTask} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Reject Task</h2>
            <p className="mt-1 text-sm text-slate-500">{rejectingTask.task_description}</p>
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Rejection reason</span>
              <textarea className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} required />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingTask(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">Reject</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
