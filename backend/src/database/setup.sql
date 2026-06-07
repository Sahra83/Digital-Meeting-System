BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  role_name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fullname VARCHAR(120) NOT NULL,
  phone VARCHAR(40),
  email VARCHAR(255),
  username VARCHAR(80) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- 3. Seed default roles
INSERT INTO roles (role_name)
VALUES
  ('Admin'),
  ('Meeting Organizer'),
  ('Participant'),
  ('User')
ON CONFLICT (role_name) DO NOTHING;

-- 4. Seed default admin user
-- Password: admin1234
-- Hashed using bcrypt (salt rounds: 12)
INSERT INTO users (fullname, username, email, password, role_id)
SELECT
  'System Administrator',
  'admin',
  'admin@digitalmeeting.local',
  '$2b$12$0zm08v/4bJ0DOtzbjCL8mehrFqMW5CeU0D1uMjAfhoO/MD7J.gf7q', -- admin1234
  r.id
FROM roles r
WHERE r.role_name = 'Admin'
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  fullname = EXCLUDED.fullname,
  email = EXCLUDED.email;

-- 5. Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  agenda TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  location VARCHAR(255),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Meeting Participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meetings_organizer_id ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);

-- 7. Meeting Minutes table
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_id ON meeting_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_by ON meeting_minutes(created_by);

CREATE TABLE IF NOT EXISTS meeting_minutes_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  edited_by UUID REFERENCES users(id),
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (minutes_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_versions_meeting_id ON meeting_minutes_versions(meeting_id);

-- 8. Discussion Points table
CREATE TABLE IF NOT EXISTS discussion_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  who_talked UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_points_minutes_id ON discussion_points(minutes_id);

-- 9. Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  made_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_minutes_id ON decisions(minutes_id);
CREATE INDEX IF NOT EXISTS idx_decisions_made_by ON decisions(made_by);

-- 10. Assigned Tasks table
CREATE TABLE IF NOT EXISTS assigned_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  deadline DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completion_note TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assigned_tasks_minutes_id ON assigned_tasks(minutes_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_assigned_to ON assigned_tasks(assigned_to);

CREATE TABLE IF NOT EXISTS meeting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_documents_meeting_id ON meeting_documents(meeting_id);

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES assigned_tasks(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);


CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id    UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  minutes_id    UUID REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  item_type     VARCHAR(50) CHECK (item_type IN ('discussion_point','decision','assigned_task') OR item_type IS NULL),
  item_id       UUID,
  author_id     UUID NOT NULL REFERENCES users(id),
  comment_text  TEXT NOT NULL,
  parent_id     UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast look‑ups
CREATE INDEX idx_comments_meeting   ON comments(meeting_id);
CREATE INDEX idx_comments_item      ON comments(item_type, item_id);
CREATE INDEX idx_comments_parent    ON comments(parent_id);

COMMIT;
