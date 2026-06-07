-- Migration: create_task_attachments_table.sql
CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES assigned_tasks(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);
