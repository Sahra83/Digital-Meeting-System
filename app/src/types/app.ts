export type User = {
  id: string;
  username: string;
  fullname?: string;
  email?: string;
  phone?: string;
  status?: string;
  role_id?: number;
  role_name?: string;
  role?: string;
  portal?: string;
  default_path?: string;
  created_at?: string;
  updated_at?: string;
};

export type Role = {
  id: number;
  role_name: string;
  created_at?: string;
};

export type UserLog = {
  type?: string;
  title?: string;
  actor_name?: string;
  actor_username?: string;
  actor_role?: string;
  entity_type?: string;
  entity_id?: string;
  target_user_id?: string;
  target_username?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  occurred_at?: string;
};

export type Meeting = {
  id: string;
  title: string;
  agenda?: string;
  meeting_date?: string;
  meeting_time?: string;
  location?: string;
  status?: string;
  organizer_name?: string;
  organizer_fullname?: string;
  participants?: User[];
};

export type Task = {
  id: string;
  task_description: string;
  deadline?: string;
  status?: string;
  assigned_to?: string;
  assigned_to_email?: string;
  meeting_title?: string;
  meeting_date?: string;
  assigned_to_name?: string;
  organizer_name?: string;
  participant_id?: string;
  participant_name?: string;
  priority?: string;
  completion_note?: string;
  rejection_reason?: string;
  is_overdue?: boolean;
  attachments?: {
    id: string;
    file_path?: string;
    original_name?: string;
    mime_type?: string;
    uploaded_at?: string;
  }[];
};

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  MeetingDetails: { meetingId: string; title?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Tasks: undefined;
  Dashboard: undefined;
  UserManagement: undefined;
  ManageMeetings: undefined;
  ActionItems: undefined;
  SubmittedTasks: undefined;
  Reports: undefined;
  Profile: undefined;
};
