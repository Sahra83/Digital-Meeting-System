// src/middleware/permissionHelpers.js

const { pool } = require('../config/db');

/**
 * Check if a user is a participant in a meeting (includes organizer).
 */
async function isParticipantInMeeting(meetingId, userId) {
  const query = `
    SELECT 1 FROM meeting_participants mp
    WHERE mp.meeting_id = $1 AND mp.user_id = $2
    UNION ALL
    SELECT 1 FROM meetings m WHERE m.id = $1 AND m.organizer_id = $2
  `;
  const { rowCount } = await pool.query(query, [meetingId, userId]);
  return rowCount > 0;
}

/**
 * Check if a user is the organizer of a meeting.
 */
async function isOrganizerOfMeeting(meetingId, userId) {
  const query = `SELECT 1 FROM meetings WHERE id = $1 AND organizer_id = $2`;
  const { rowCount } = await pool.query(query, [meetingId, userId]);
  return rowCount > 0;
}

/**
 * Check if a task belongs to a user (assigned_to).
 */
async function isTaskOwner(taskId, userId) {
  const query = `SELECT 1 FROM assigned_tasks WHERE id = $1 AND assigned_to = $2`;
  const { rowCount } = await pool.query(query, [taskId, userId]);
  return rowCount > 0;
}

module.exports = {
  isParticipantInMeeting,
  isOrganizerOfMeeting,
  isTaskOwner,
};
