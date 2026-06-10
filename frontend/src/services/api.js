import { apiDownload, apiRequest } from "./apiRequest.js";

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}
// Participant related API
export const participantApi = {
  list: () => apiRequest('/users'),
  roles: () => apiRequest('/users/roles'),
  create: (payload) => apiRequest('/users', { method: 'POST', body: payload }),
  update: (id, payload) => apiRequest(`/users/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  getMyMeetings: () => apiRequest('/participant/meetings'),
  getMyTasks: () => apiRequest('/participant/tasks'),
  getDashboardStats: () => apiRequest('/participant/dashboard'),
  getMeetingDetails: (id) => apiRequest(`/participant/meetings/${id}`),
  startTask: (taskId) => apiRequest(`/participant/tasks/${taskId}/start`, { method: 'PATCH' }),
  submitTask: (taskId, formData) => apiRequest(`/participant/tasks/${taskId}/submit`, { method: 'POST', body: formData }),
  getProfile: () => apiRequest('/participant/profile'),
  updateProfile: (payload) => apiRequest('/participant/profile', { method: 'PUT', body: payload }),
  changePassword: (payload) => apiRequest('/participant/profile/password', { method: 'PUT', body: payload }),
  downloadDocument: (documentId, filename) => apiDownload(`/participant/documents/${documentId}/download`, filename),
  downloadAttachment: (attachmentId, filename) => apiDownload(`/participant/task-attachments/${attachmentId}/download`, filename)
};

export const userApi = {
  getProfile: () => apiRequest('/users/me'),
  updateProfile: (payload) => apiRequest('/users/me', { method: 'PUT', body: payload }),
  getLogs: (params = {}) => apiRequest(`/users/logs${toQuery(params)}`)
};

export const organizerApi = {
  getSubmittedTasks: () => apiRequest('/organizer/tasks/submitted'),
  approveTask: (taskId) => apiRequest(`/organizer/tasks/${taskId}/approve`, { method: 'PATCH' }),
  rejectTask: (taskId, payload) => apiRequest(`/organizer/tasks/${taskId}/reject`, { method: 'PATCH', body: payload }),
  downloadAttachment: (attachmentId, filename) => apiDownload(`/organizer/task-attachments/${attachmentId}/download`, filename)
};

export const meetingApi = {
  list: (filters = '') => {
    const query = typeof filters === 'string' ? toQuery({ search: filters }) : toQuery(filters);
    return apiRequest(`/meetings${query}`);
  },
  create: (payload) => apiRequest('/meetings', { method: 'POST', body: payload }),
  get: (id) => apiRequest(`/meetings/${id}`),
  update: (id, payload) => apiRequest(`/meetings/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => apiRequest(`/meetings/${id}`, { method: 'DELETE' }),
  dashboard: (filters = {}) => apiRequest(`/meetings/dashboard${toQuery(filters)}`),
  exportReport: (meetingId, format = 'word', title = 'meeting-report') => apiDownload(`/meetings/${meetingId}/report${toQuery({ format })}`, `${title}.${format === 'pdf' ? 'pdf' : 'doc'}`),
  getParticipants: (meetingId) => apiRequest(`/meetings/${meetingId}/participants`),
  getMinutes: (meetingId) => apiRequest(`/meetings/${meetingId}/minutes`),
  getMinutesVersions: (meetingId) => apiRequest(`/meetings/${meetingId}/minutes/versions`),
  restoreMinutesVersion: (meetingId, versionId) => apiRequest(`/meetings/${meetingId}/minutes/versions/${versionId}/restore`, { method: 'POST' }),
  createMinutes: (meetingId, payload) => apiRequest(`/meetings/${meetingId}/minutes`, { method: 'POST', body: payload }),
  updateMinutes: (meetingId, payload) => apiRequest(`/meetings/${meetingId}/minutes`, { method: 'PUT', body: payload }),
  notifyMinutes: (meetingId, payload) => apiRequest(`/meetings/${meetingId}/minutes/notify`, { method: 'POST', body: payload })
};

export const taskApi = {
  getMeetings: () => apiRequest('/tasks/meetings'),
  getTasksByMeeting: (meetingId) => apiRequest(`/tasks/meetings/${meetingId}`),
  resendEmail: (taskId) => apiRequest(`/tasks/${taskId}/resend-email`, { method: 'POST' })
};
export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  session: () => apiRequest('/auth/session')
};
