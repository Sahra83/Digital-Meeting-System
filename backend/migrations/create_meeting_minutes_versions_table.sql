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

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_versions_meeting_id
  ON meeting_minutes_versions(meeting_id);
