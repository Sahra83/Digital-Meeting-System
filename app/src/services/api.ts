import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, isAxiosError } from 'axios';

import type { Meeting, Role, Task, User, UserLog } from '@/types/app';

export const TOKEN_KEY = 'auth-token';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.digitalmeeting24.com/api/v1';

const client = create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrapError(error: unknown) {
  if (isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed';
    const nextError = new Error(message);
    (nextError as Error & { status?: number }).status = error.response?.status;
    return nextError;
  }
  return error instanceof Error ? error : new Error('Request failed');
}

async function request<T>(promise: Promise<{ data: T }>) {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw unwrapError(error);
  }
}

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: User }>(client.post('/auth/login', credentials)),
  logout: () => request<{ message: string }>(client.post('/auth/logout')),
  session: () => request<{ user: User }>(client.get('/auth/session')),
};

export const participantApi = {
  getDashboardStats: () =>
    request<{
      meetingCount: number;
      taskCount: number;
      taskStats?: Record<string, number>;
      meetings?: Meeting[];
      tasks?: Task[];
    }>(client.get('/participant/dashboard')),
  getMyMeetings: () => request<{ meetings: Meeting[] }>(client.get('/participant/meetings')),
  getMeetingDetails: (id: string) =>
    request<{
      meeting: Meeting;
      minutes: unknown | null;
      discussionPoints?: unknown[];
      decisions?: unknown[];
      documents?: unknown[];
      tasks?: Task[];
    }>(client.get(`/participant/meetings/${id}`)),
  getMyTasks: () => request<{ tasks: Task[] }>(client.get('/participant/tasks')),
  startTask: (taskId: string) => request<{ message: string; task: Task }>(client.patch(`/participant/tasks/${taskId}/start`)),
  submitTask: (taskId: string, completion_note: string) =>
    request<{ message: string; task: Task }>(client.post(`/participant/tasks/${taskId}/submit`, { completion_note })),
  getProfile: () => request<{ profile: User }>(client.get('/participant/profile')),
  updateProfile: (payload: { username: string }) => request<{ profile: User }>(client.put('/participant/profile', payload)),
};

export const systemApi = {
  getOverview: () => request<{ features: unknown[]; workflow: unknown[]; statistics: unknown[] }>(client.get('/system/overview')),
};

export type UserPayload = {
  fullname: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  roleId: number;
};

export const userApi = {
  getProfile: () => request<{ user: User }>(client.get('/users/me')),
  updateProfile: (payload: Partial<User>) => request<{ user: User }>(client.put('/users/me', payload)),
  // Admin endpoints
  getUsers: () => request<{ users: User[] }>(client.get('/users')),
  createUser: (payload: UserPayload) => request<{ user: User }>(client.post('/users', payload)),
  updateUser: (id: string, payload: UserPayload) => request<{ user: User }>(client.put(`/users/${id}`, payload)),
  deleteUser: (id: string) => request<{ message: string }>(client.delete(`/users/${id}`)),
  getParticipation: (id: string) => request<{ meetings: string[] }>(client.get(`/users/${id}/participation`)),
  listRoles: () => request<{ roles: Role[] }>(client.get('/users/roles')),
  listUserLogs: (limit = 20) => request<{ logs: UserLog[] }>(client.get('/users/logs', { params: { limit } })),
};


export const meetingApi = {
  list: () => request<{ success: boolean; meetings: Meeting[] }>(client.get('/meetings')),
  get: (id: string) => request<{ success: boolean; meeting: Meeting }>(client.get(`/meetings/${id}`)),
  create: (payload: {
    title: string;
    agenda?: string;
    meeting_date: string;
    meeting_time: string;
    location?: string;
    participants?: string[];
  }) => request<{ success: boolean; message: string; meeting: Meeting }>(client.post('/meetings', payload)),
  update: (id: string, payload: {
    title: string;
    agenda?: string;
    meeting_date: string;
    meeting_time: string;
    location?: string;
    status?: string;
    participants?: string[];
  }) => request<{ success: boolean; message: string; meeting: Meeting }>(client.put(`/meetings/${id}`, payload)),
  delete: (id: string) => request<{ success: boolean; message: string }>(client.delete(`/meetings/${id}`)),
  dashboard: () => request<{ success: boolean; dashboard: Record<string, unknown> }>(client.get('/meetings/dashboard')),
  getMinutes: (meetingId: string) => request<{ minutes?: unknown }>(client.get(`/meetings/${meetingId}/minutes`)),
};

export const collaborationApi = {
  list: () => request(client.get('/collaboration')),
  create: (payload: any) => request(client.post('/collaboration', payload)),
  update: (id: string, payload: any) => request(client.put(`/collaboration/${id}`, payload)),
  delete: (id: string) => request(client.delete(`/collaboration/${id}`)),
};

export const meetingDocumentApi = {
  list: () => request(client.get('/meeting-documents')),
  create: (payload: any) => request(client.post('/meeting-documents', payload)),
  update: (id: string, payload: any) => request(client.put(`/meeting-documents/${id}`, payload)),
  delete: (id: string) => request(client.delete(`/meeting-documents/${id}`)),
};

export const organizerTaskApi = {
  getSubmittedTasks: () => request<{ tasks: Task[] }>(client.get('/organizer/tasks/submitted')),
  approveTask: (taskId: string) => request<{ message: string; task: Task }>(client.patch(`/organizer/tasks/${taskId}/approve`)),
  rejectTask: (taskId: string, rejection_reason: string) =>
    request<{ message: string; task: Task }>(client.patch(`/organizer/tasks/${taskId}/reject`, { rejection_reason })),
  downloadTaskAttachment: (attachmentId: string) =>
    request<Blob>(client.get(`/organizer/task-attachments/${attachmentId}/download`, { responseType: 'blob' })),
};

export const taskApi = {
  getMeetings: () => request<{ meetings: Meeting[] }>(client.get('/tasks/meetings')),
  getTasksByMeeting: (meetingId: string) => request<{ tasks: Task[] }>(client.get(`/tasks/meetings/${meetingId}`)),
  updateTask: (taskId: string, payload: Partial<Task>) => request<{ message: string; task: Task }>(client.put(`/tasks/${taskId}`, payload)),
  deleteTask: (taskId: string) => request<{ message: string }>(client.delete(`/tasks/${taskId}`)),
  resendEmail: (taskId: string) => request<{ message: string }>(client.post(`/tasks/${taskId}/resend-email`)),
};
