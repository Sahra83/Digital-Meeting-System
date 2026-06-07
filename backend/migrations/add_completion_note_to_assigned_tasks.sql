-- Migration: add_completion_note_to_assigned_tasks.sql
ALTER TABLE assigned_tasks
ADD COLUMN IF NOT EXISTS completion_note TEXT;
