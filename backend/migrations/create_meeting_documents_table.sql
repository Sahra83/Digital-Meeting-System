-- Migration: create_meeting_documents_table.sql
CREATE TABLE meeting_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);
