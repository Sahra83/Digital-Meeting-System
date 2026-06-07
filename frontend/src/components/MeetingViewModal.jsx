import React, { useEffect, useState } from 'react'
import Icon from './Icon'
import { meetingApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const EMPTY_MINUTES_FORM = {
  discussion_points: [],
  decisions: [],
  assigned_tasks: [],
}

const newDiscussionPoint = () => ({ topic: '', who_talked: [] })
const newDecision = () => ({ decision_text: '', made_by: '' })
const newTask = () => ({ task_description: '', assigned_to: '', deadline: '', status: 'pending' })

function MeetingViewModal({ isOpen, onClose, meeting }) {
  const { user } = useAuth()
  const [participants, setParticipants] = useState([])
  const [minutes, setMinutes] = useState(null)
  const [minutesForm, setMinutesForm] = useState(EMPTY_MINUTES_FORM)
  const [canEditMinutes, setCanEditMinutes] = useState(false)
  const [minutesMode, setMinutesMode] = useState('view')
  const [loadingMinutes, setLoadingMinutes] = useState(false)
  const [savingMinutes, setSavingMinutes] = useState(false)
  const [minutesError, setMinutesError] = useState('')
  const [minutesMessage, setMinutesMessage] = useState('')
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [selectedParticipantsForNotify, setSelectedParticipantsForNotify] = useState([])
  const [notifying, setNotifying] = useState(false)
  const [activeTab, setActiveTab] = useState('info') // 'info', 'minutes', 'tasks'
  const [versions, setVersions] = useState([])
  const [restoringVersion, setRestoringVersion] = useState('')

  useEffect(() => {
    let active = true

    async function loadMinutesData() {
      if (!isOpen || !meeting?.id) return

      setLoadingMinutes(true)
      setMinutesError('')
      setMinutesMessage('')
      setMinutesMode('view')

      try {
        const [participantsResult, minutesResult] = await Promise.all([
          meetingApi.getParticipants(meeting.id),
          meetingApi.getMinutes(meeting.id),
        ])

        if (!active) return

        const loadedMinutes = minutesResult.minutes || null
        setParticipants(participantsResult.participants || [])
        setMinutes(loadedMinutes)
        setCanEditMinutes(Boolean(minutesResult.canEdit))
        setMinutesForm(minutesToForm(loadedMinutes))
        if (loadedMinutes) {
          const versionsResult = await meetingApi.getMinutesVersions(meeting.id)
          if (active) setVersions(versionsResult.versions || [])
        } else {
          setVersions([])
        }
      } catch (err) {
        if (!active) return
        setParticipants([])
        setMinutes(null)
        setCanEditMinutes(false)
        setVersions([])
        setMinutesError(err.message || 'Failed to load meeting minutes.')
      } finally {
        if (active) setLoadingMinutes(false)
      }
    }

    loadMinutesData()

    return () => {
      active = false
    }
  }, [isOpen, meeting?.id])

  if (!isOpen || !meeting) return null

  const isOrganizer = user?.id === meeting.organizer_id
  const isParticipant = meeting.participants?.some((participant) => participant.id === user?.id)
  const showMinutesActions = canEditMinutes && (isOrganizer || isParticipant)

  function minutesToForm(sourceMinutes) {
    if (!sourceMinutes) {
      return {
        discussion_points: [newDiscussionPoint()],
        decisions: [newDecision()],
        assigned_tasks: [newTask()],
      }
    }

    return {
      discussion_points: sourceMinutes.discussion_points?.length
        ? sourceMinutes.discussion_points.map((point) => ({
            topic: point.topic || '',
            who_talked: point.who_talked || [],
          }))
        : [newDiscussionPoint()],
      decisions: sourceMinutes.decisions?.length
        ? sourceMinutes.decisions.map((decision) => ({
            decision_text: decision.decision_text || '',
            made_by: decision.made_by || '',
          }))
        : [newDecision()],
      assigned_tasks: sourceMinutes.assigned_tasks?.length
        ? sourceMinutes.assigned_tasks.map((task) => ({
            task_description: task.task_description || '',
            assigned_to: task.assigned_to || '',
            deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
            status: task.status || 'pending',
          }))
        : [newTask()],
    }
  }

  const updateListItem = (section, index, field, value) => {
    setMinutesError('')
    setMinutesMessage('')
    setMinutesForm((prev) => ({
      ...prev,
      [section]: prev[section].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }))
  }

  const addListItem = (section) => {
    const factory = {
      discussion_points: newDiscussionPoint,
      decisions: newDecision,
      assigned_tasks: newTask,
    }[section]

    setMinutesForm((prev) => ({
      ...prev,
      [section]: [...prev[section], factory()],
    }))
  }

  const removeListItem = (section, index) => {
    setMinutesForm((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const openCreateMinutes = () => {
    setMinutesForm(minutesToForm(null))
    setMinutesMode('create')
    setMinutesError('')
    setMinutesMessage('')
  }

  const openEditMinutes = () => {
    setMinutesForm(minutesToForm(minutes))
    setMinutesMode('edit')
    setMinutesError('')
    setMinutesMessage('')
  }

  const cancelMinutesEdit = () => {
    setMinutesMode('view')
    setMinutesError('')
    setMinutesForm(minutesToForm(minutes))
  }

  const saveMinutes = async () => {
    setSavingMinutes(true)
    setMinutesError('')
    setMinutesMessage('')
    setShowNotificationPanel(false)

    try {
      const payload = {
        discussion_points: minutesForm.discussion_points
          .filter((point) => point.topic.trim())
          .map((point) => ({ topic: point.topic, who_talked: point.who_talked })),
        decisions: minutesForm.decisions
          .filter((decision) => decision.decision_text.trim())
          .map((decision) => ({ decision_text: decision.decision_text, made_by: decision.made_by || null })),
        assigned_tasks: minutesForm.assigned_tasks
          .filter((task) => task.task_description.trim())
          .map((task) => ({
            task_description: task.task_description,
            assigned_to: task.assigned_to || null,
            deadline: task.deadline || null,
            status: task.status || 'pending',
          })),
      }

      const result = minutes
        ? await meetingApi.updateMinutes(meeting.id, payload)
        : await meetingApi.createMinutes(meeting.id, payload)

      setMinutes(result.minutes)
      setMinutesForm(minutesToForm(result.minutes))
      const versionsResult = await meetingApi.getMinutesVersions(meeting.id)
      setVersions(versionsResult.versions || [])
      setMinutesMode('view')
      setMinutesMessage('Minutes saved successfully!')
      setShowNotificationPanel(true)
    } catch (err) {
      setMinutesError(err.message || 'Failed to save meeting minutes.')
    } finally {
      setSavingMinutes(false)
    }
  }

  const getParticipantName = (id) => participants.find((participant) => participant.id === id)?.fullname || 'Not specified'

  const restoreVersion = async (versionId) => {
    setRestoringVersion(versionId)
    setMinutesError('')
    setMinutesMessage('')

    try {
      const result = await meetingApi.restoreMinutesVersion(meeting.id, versionId)
      setMinutes(result.minutes)
      setMinutesForm(minutesToForm(result.minutes))
      const versionsResult = await meetingApi.getMinutesVersions(meeting.id)
      setVersions(versionsResult.versions || [])
      setMinutesMessage('Previous minutes version restored successfully!')
    } catch (err) {
      setMinutesError(err.message || 'Failed to restore minutes version.')
    } finally {
      setRestoringVersion('')
    }
  }

  const downloadReport = async (format) => {
    setMinutesError('')
    try {
      const filename = meeting.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'meeting-report'
      await meetingApi.exportReport(meeting.id, format, filename)
    } catch (err) {
      setMinutesError(err.message || 'Failed to export meeting report.')
    }
  }

  const handleNotifySpecific = async () => {
    if (selectedParticipantsForNotify.length === 0) return;
    setNotifying(true)
    setMinutesError('')
    setMinutesMessage('')
    try {
      await meetingApi.notifyMinutes(meeting.id, {
        sendToAll: false,
        participantIds: selectedParticipantsForNotify
      })
      setMinutesMessage('Emails sent successfully!')
      setShowNotificationPanel(false)
      setSelectedParticipantsForNotify([])
    } catch (err) {
      setMinutesError(err.message || 'Failed to send notifications.')
    } finally {
      setNotifying(false)
    }
  }

  const handleNotifyAll = async () => {
    setNotifying(true)
    setMinutesError('')
    setMinutesMessage('')
    try {
      await meetingApi.notifyMinutes(meeting.id, {
        sendToAll: true,
      })
      setMinutesMessage('Emails sent successfully!')
      setShowNotificationPanel(false)
    } catch (err) {
      setMinutesError(err.message || 'Failed to send notifications.')
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl scale-100 transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Meeting Details</h3>
            <p className="text-sm text-slate-500">Comprehensive overview of the scheduled meeting.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>

          <div className="flex gap-8 border-b border-slate-100 px-8">
            <button 
              onClick={() => setActiveTab('info')} 
              className={`border-b-2 py-4 text-sm font-bold transition ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Meeting Info
            </button>
            <button 
              onClick={() => setActiveTab('minutes')} 
              className={`border-b-2 py-4 text-sm font-bold transition ${activeTab === 'minutes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Minutes
            </button>
            <button 
              onClick={() => setActiveTab('tasks')} 
              className={`border-b-2 py-4 text-sm font-bold transition ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Assigned Tasks
            </button>
          </div>

        <div className="max-h-[70vh] overflow-y-auto px-8 py-8">
          <div className="space-y-8">
            {activeTab === 'info' && (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                  Scheduled
                </span>
                <h2 className="text-2xl font-black text-slate-900">{meeting.title}</h2>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                <div className="mb-2 flex items-center gap-3 text-slate-500">
                  <Icon name="calendar" className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Date & Time</span>
                </div>
                <p className="font-semibold text-slate-900">
                  {new Date(meeting.meeting_date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                </p>
                <p className="text-sm text-slate-600">{meeting.meeting_time}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                <div className="mb-2 flex items-center gap-3 text-slate-500">
                  <Icon name="location" className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                </div>
                <p className="font-semibold text-slate-900">{meeting.location || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3 text-slate-500">
                <Icon name="document" className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Agenda</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 leading-relaxed text-slate-700">
                {meeting.agenda || 'No agenda provided for this meeting.'}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3 text-slate-500">
                <Icon name="users" className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Participants</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {meeting.participants && meeting.participants.length > 0 ? (
                  meeting.participants.map((participant) => (
                    <div key={participant.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {participant.fullname.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-slate-700">{participant.fullname}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic text-slate-400">No participants invited yet.</p>
                )}
              </div>
            </div>

                <div className="mt-4 border-t border-slate-100 pt-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <div className="text-[11px] uppercase tracking-widest text-slate-400">
                      Organized by <span className="font-bold text-slate-600">{meeting.organizer_name}</span>
                    </div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-400">
                      Created on <span className="font-bold text-slate-600">{new Date(meeting.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(activeTab === 'minutes' || activeTab === 'tasks') && (
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Icon name="document" className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {activeTab === 'tasks' ? 'Assigned Tasks' : 'Meeting Minutes'}
                    </span>
                  </div>

                  {!loadingMinutes && showMinutesActions && minutesMode === 'view' && (
                    <div className="flex flex-wrap gap-2">
                      {minutes && activeTab === 'minutes' && (
                        <>
                          <button type="button" onClick={() => downloadReport('pdf')} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                            Export PDF
                          </button>
                          <button type="button" onClick={() => downloadReport('word')} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                            Export Word
                          </button>
                        </>
                      )}
                      {minutes ? (
                        <button type="button" onClick={openEditMinutes} className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800">
                          Edit
                        </button>
                      ) : (
                        <button type="button" onClick={openCreateMinutes} className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800">
                          Create Minutes
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {minutesMessage && (
                  <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {minutesMessage}
                  </div>
                )}

                {minutesError && (
                  <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {minutesError}
                  </div>
                )}

                {showNotificationPanel && activeTab === 'minutes' && (
                  <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
                    <h4 className="mb-2 text-sm font-black uppercase tracking-wider text-blue-900">Email Notifications</h4>
                    <p className="mb-4 text-sm text-blue-800/80">Would you like to notify participants about the updated meeting minutes?</p>
                    
                    <div className="flex flex-col gap-4">
                      <div className="rounded-xl border border-blue-100 bg-white p-4">
                        <label className="mb-2 block text-xs font-bold text-slate-500 uppercase">Send to Specific Participants</label>
                        <select
                          multiple
                          value={selectedParticipantsForNotify}
                          onChange={(e) => setSelectedParticipantsForNotify(Array.from(e.target.selectedOptions, option => option.value))}
                          className="mb-3 min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
                        >
                          {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>{participant.fullname}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          onClick={handleNotifySpecific} 
                          disabled={notifying || selectedParticipantsForNotify.length === 0}
                          className="w-full rounded-xl bg-blue-100 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-200 disabled:opacity-50"
                        >
                          {notifying ? 'Sending...' : 'Send to Selected'}
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-blue-200"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">OR</span>
                        <div className="h-px flex-1 bg-blue-200"></div>
                      </div>

                      <button 
                        type="button" 
                        onClick={handleNotifyAll} 
                        disabled={notifying}
                        className="w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-50"
                      >
                        {notifying ? 'Sending...' : 'Send to All Participants'}
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={() => setShowNotificationPanel(false)} 
                        disabled={notifying}
                        className="mt-1 w-full rounded-xl py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      >
                        Skip Notification
                      </button>
                    </div>
                  </div>
                )}

                {loadingMinutes ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                    Loading minutes...
                  </div>
                ) : minutesMode === 'create' || minutesMode === 'edit' ? (
                  <MinutesForm
                    form={minutesForm}
                    participants={participants}
                    saving={savingMinutes}
                    onAdd={addListItem}
                    onCancel={cancelMinutesEdit}
                    onChange={updateListItem}
                    onRemove={removeListItem}
                    onSave={saveMinutes}
                    mode={minutesMode}
                    sections={activeTab === 'tasks' ? ['assigned_tasks'] : ['discussion_points', 'decisions', 'assigned_tasks']}
                  />
                ) : minutes ? (
                  <>
                    <MinutesDisplay
                      minutes={minutes}
                      getParticipantName={getParticipantName}
                      sections={activeTab === 'tasks' ? ['assigned_tasks'] : ['discussion_points', 'decisions', 'assigned_tasks']}
                    />
                    {activeTab === 'minutes' && (
                      <div className="mt-8">
                        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Version History</h4>
                        <div className="space-y-3">
                          {versions.length ? versions.map((version) => (
                            <div key={version.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-800">Version {version.version_number}</p>
                                <p className="text-xs text-slate-500">
                                  {version.change_note || 'Minutes edited'} by {version.edited_by_name || 'Unknown'} on {new Date(version.created_at).toLocaleString()}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={Boolean(restoringVersion)}
                                onClick={() => restoreVersion(version.id)}
                                className="rounded-xl border border-blue-100 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                              >
                                {restoringVersion === version.id ? 'Restoring...' : 'Restore'}
                              </button>
                            </div>
                          )) : (
                            <p className="text-sm text-slate-400">No previous versions yet.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                    No minutes have been created for this meeting yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}

function PersonSelect({ value, participants, onChange, placeholder = 'Select person' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
    >
      <option value="">{placeholder}</option>
      {participants.map((participant) => (
        <option key={participant.id} value={participant.id}>{participant.fullname}</option>
      ))}
    </select>
  )
}

function MinutesForm({ form, participants, saving, onAdd, onCancel, onChange, onRemove, onSave, mode, sections = ['discussion_points', 'decisions', 'assigned_tasks'] }) {
  return (
    <div className="space-y-6">
      {sections.includes('discussion_points') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">Discussion Points</h4>
            <button type="button" onClick={() => onAdd('discussion_points')} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">
              + Add Discussion Point
            </button>
          </div>
        {form.discussion_points.map((point, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => onRemove('discussion_points', index)} className="text-xs font-bold text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
            <label className="text-xs font-bold text-slate-500">Topic</label>
            <textarea
              value={point.topic}
              onChange={(e) => onChange('discussion_points', index, 'topic', e.target.value)}
              rows="3"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
            />
            <label className="mt-4 block text-xs font-bold text-slate-500">Who Talked</label>
            <select
              multiple
              value={point.who_talked}
              onChange={(e) => onChange('discussion_points', index, 'who_talked', Array.from(e.target.selectedOptions, (option) => option.value))}
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
            >
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>{participant.fullname}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      )}

      {sections.includes('decisions') && (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">Decisions</h4>
          <button type="button" onClick={() => onAdd('decisions')} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">
            + Add Decision
          </button>
        </div>
        {form.decisions.map((decision, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => onRemove('decisions', index)} className="text-xs font-bold text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
            <label className="text-xs font-bold text-slate-500">Decision</label>
            <textarea
              value={decision.decision_text}
              onChange={(e) => onChange('decisions', index, 'decision_text', e.target.value)}
              rows="3"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
            />
            <label className="mt-4 block text-xs font-bold text-slate-500">Made By</label>
            <PersonSelect value={decision.made_by} participants={participants} onChange={(value) => onChange('decisions', index, 'made_by', value)} />
          </div>
        ))}
      </div>
      )}

      {sections.includes('assigned_tasks') && (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">Assigned Tasks</h4>
          <button type="button" onClick={() => onAdd('assigned_tasks')} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">
            + Add Task
          </button>
        </div>
        {form.assigned_tasks.map((task, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => onRemove('assigned_tasks', index)} className="text-xs font-bold text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
            <label className="text-xs font-bold text-slate-500">Task Description</label>
            <textarea
              value={task.task_description}
              onChange={(e) => onChange('assigned_tasks', index, 'task_description', e.target.value)}
              rows="3"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mt-4 block text-xs font-bold text-slate-500">Assigned To</label>
                <PersonSelect value={task.assigned_to} participants={participants} onChange={(value) => onChange('assigned_tasks', index, 'assigned_to', value)} />
              </div>
              <div>
                <label className="mt-4 block text-xs font-bold text-slate-500">Deadline</label>
                <input
                  type="date"
                  value={task.deadline}
                  onChange={(e) => onChange('assigned_tasks', index, 'deadline', e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onSave} disabled={saving} className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Minutes'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">
          Cancel
        </button>
      </div>
    </div>
  )
}

function MinutesDisplay({ minutes, getParticipantName, sections = ['discussion_points', 'decisions', 'assigned_tasks'] }) {
  return (
    <div className="space-y-6">
      {sections.includes('discussion_points') && (
      <div>
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Discussion Points</h4>
        <div className="space-y-3">
          {minutes.discussion_points?.length ? minutes.discussion_points.map((point) => (
            <div key={point.id} className="rounded-2xl border border-slate-100 bg-white p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{point.topic}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Who Talked: {(point.who_talked_people || []).map((person) => person.fullname).join(', ') || 'Not specified'}
              </p>
            </div>
          )) : <p className="text-sm text-slate-400">No discussion points recorded.</p>}
        </div>
      </div>
      )}

      {sections.includes('decisions') && (
      <div>
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Decisions</h4>
        <div className="space-y-3">
          {minutes.decisions?.length ? minutes.decisions.map((decision) => (
            <div key={decision.id} className="rounded-2xl border border-slate-100 bg-white p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{decision.decision_text}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Made By: {decision.made_by_name || getParticipantName(decision.made_by)}
              </p>
            </div>
          )) : <p className="text-sm text-slate-400">No decisions recorded.</p>}
        </div>
      </div>
      )}

      {sections.includes('assigned_tasks') && (
      <div>
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Assigned Tasks</h4>
        <div className="space-y-3">
          {minutes.assigned_tasks?.length ? minutes.assigned_tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-100 bg-white p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{task.task_description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Assigned To: {task.assigned_to_name || getParticipantName(task.assigned_to)}</span>
                <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not specified'}</span>
                <span>Status: {task.status || 'pending'}</span>
              </div>
            </div>
          )) : <p className="text-sm text-slate-400">No assigned tasks recorded.</p>}
        </div>
      </div>
      )}
    </div>
  )
}

export default MeetingViewModal
