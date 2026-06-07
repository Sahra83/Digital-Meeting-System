import { useEffect, useState } from 'react';
import { organizerApi, taskApi } from '../services/api';

function rowStyle(task) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  if (task.status.toLowerCase() === 'completed') return 'bg-green-50';
  if (now > deadline) return 'bg-red-50';
  const diff = (deadline - now) / (1000 * 60 * 60 * 24);
  if (diff <= 3) return 'bg-orange-50';
  return '';
}

export default function AssignedTasksPage() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [tasks, setTasks] = useState([]);
  const [submittedTasks, setSubmittedTasks] = useState([]);
  const [rejectingTask, setRejectingTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');



  useEffect(() => {
    async function fetchMeetings() {
      try {
        const { meetings } = await taskApi.getMeetings();
        setMeetings(meetings);
      } catch (err) {
        console.error('Failed to load meetings', err);
      }
    }
    fetchMeetings();
    fetchSubmittedTasks();
  }, []);

  async function fetchSubmittedTasks() {
    try {
      const { tasks: reviewTasks } = await organizerApi.getSubmittedTasks();
      setSubmittedTasks(reviewTasks || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!selectedMeeting) return;
    async function fetchTasks() {
      setLoading(true);
      try {
        const { tasks } = await taskApi.getTasksByMeeting(selectedMeeting);
        setTasks(tasks);
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [selectedMeeting]);

  const handleResend = async (taskId) => {
    try {
      await taskApi.resendEmail(taskId);
      alert('Reminder email sent successfully!');
    } catch (err) {
      if (err.status === 400 && err.message.includes('email')) {
        alert('Cannot send reminder: assigned user does not have an email address.');
      } else {
        console.error('Failed to send reminder', err);
        alert('Failed to send reminder. Please try again later.');
      }
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

  return (
    <div className="grid gap-8 p-6">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Assigned Tasks</h1>
        {(message || error) && (
          <div className={`mb-4 rounded border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Submitted Tasks For Review</h2>
        {submittedTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No submitted tasks awaiting review.</p>
        ) : (
          <div className="grid gap-3">
            {submittedTasks.map((task) => (
              <article key={task.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{task.task_description}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.meeting_title} - {task.participant_name}</p>
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

      <section>
      <div className="mb-4">
        <label className="mr-2 font-medium" htmlFor="meetingSelect">Select Meeting:</label>
        <select
          id="meetingSelect"
          value={selectedMeeting}
          onChange={e => setSelectedMeeting(e.target.value)}
          className="rounded border px-2 py-1"
        >
          <option value="">-- Choose a meeting --</option>
          {meetings.map(m => (
            <option key={m.id} value={m.id}>{m.title} ({new Date(m.meeting_date).toLocaleDateString()})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Assignee</th>
              <th className="px-4 py-2">Deadline</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className={rowStyle(task)}>
                <td className="border px-4 py-2">{task.task_description}</td>
                <td className="border px-4 py-2">{task.assigned_to_name || 'Unassigned'}</td>
                <td className="border px-4 py-2">{new Date(task.deadline).toLocaleDateString()}</td>
                <td className="border px-4 py-2">
                  <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ">
                    {task.status}
                  </span>
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleResend(task.id)}
                    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                  >
                    Send Reminder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>

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
