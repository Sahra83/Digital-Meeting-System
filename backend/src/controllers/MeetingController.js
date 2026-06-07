const crypto = require('crypto');
const Meeting = require('../models/Meeting');
const db = require('../config/db');
const { sendMeetingInvitation } = require('../services/emailService');
const userService = require('../services/userService');
const ApiError = require('../utils/apiError');

const sendMeetingNotificationsInBackground = async (meetingId, type = 'invitation') => {
  const label = type === 'update' ? 'update' : 'invitation';
  console.log(`[meeting email] Starting ${label} notifications for meeting ${meetingId}`);

  const meetingResult = await db.query(
    `SELECT m.title, m.agenda, m.meeting_date, m.meeting_time, m.location, u.fullname AS organizer_fullname
     FROM meetings m
     JOIN users u ON u.id = m.organizer_id
     WHERE m.id = $1`,
    [meetingId]
  );

  const meeting = meetingResult.rows[0];
  if (!meeting) {
    console.error(`[meeting email] Meeting not found for ${label} notifications: ${meetingId}`);
    return;
  }

  const participantsResult = await db.query(
    `SELECT u.fullname, u.email
     FROM meeting_participants mp
     JOIN users u ON u.id = mp.user_id
     WHERE mp.meeting_id = $1
       AND u.email IS NOT NULL
       AND trim(u.email) <> ''`,
    [meetingId]
  );

  if (participantsResult.rows.length === 0) {
    console.log(`[meeting email] No participant emails found for meeting ${meetingId}`);
    return;
  }

  console.log(
    `[meeting email] Found ${participantsResult.rows.length} participant email(s) for meeting ${meetingId}`
  );

  const meetingDetails = {
    title: meeting.title,
    meeting_date: meeting.meeting_date,
    meeting_time: meeting.meeting_time,
    location: meeting.location,
    agenda: meeting.agenda,
    organizerFullname: meeting.organizer_fullname,
  };

  for (const participant of participantsResult.rows) {
    try {
      console.log(
        `[meeting email] Sending ${label} email to ${participant.fullname} <${participant.email}> for meeting ${meetingId}`
      );

      const info = await sendMeetingInvitation(participant.email, participant.fullname, meetingDetails, { type });

      console.log(
        `[meeting email] ${label} email sent successfully to ${participant.email} for meeting ${meetingId}. Message ID: ${info.messageId || 'N/A'}`
      );
    } catch (err) {
      console.error(
        `[meeting email] Email failed for ${participant.email} on meeting ${meetingId}:`,
        {
          message: err.message,
          code: err.code,
          command: err.command,
          response: err.response,
          responseCode: err.responseCode,
        }
      );
    }
  }

  console.log(`[meeting email] Finished ${label} notifications for meeting ${meetingId}`);
};

const getDefaultParticipantRoleId = async () => {
  console.log('[meeting participant] Loading default Participant role');
  const roleResult = await db.query(
    `SELECT id FROM roles WHERE role_name = 'Participant' LIMIT 1`
  );

  if (!roleResult.rows[0]) {
    console.error('[meeting participant] Failed: Participant role not found');
    throw new ApiError(400, 'Participant role not found in roles table');
  }

  console.log(`[meeting participant] Default Participant role loaded: ${roleResult.rows[0].id}`);
  return roleResult.rows[0].id;
};

const getInlineParticipantRoleId = async (roleId) => {
  if (!roleId) {
    return getDefaultParticipantRoleId();
  }

  console.log(`[meeting participant] Loading selected role ${roleId}`);
  const roleResult = await db.query('SELECT id FROM roles WHERE id = $1 LIMIT 1', [roleId]);
  if (!roleResult.rows[0]) {
    console.error(`[meeting participant] Failed: selected role not found: ${roleId}`);
    throw new ApiError(400, 'Selected participant role was not found');
  }

  console.log(`[meeting participant] Selected role loaded: ${roleResult.rows[0].id}`);
  return roleResult.rows[0].id;
};

const createOrReuseInlineParticipant = async (newParticipant) => {
  const email = newParticipant.email ? newParticipant.email.toLowerCase().trim() : null;

  const createLogin = Boolean(newParticipant.createLogin);
  console.log(
    `[meeting participant] Creating inline participant "${newParticipant.fullname}" with email ${email || 'no email'} and login ${createLogin ? 'enabled' : 'disabled'}`
  );

  const roleId = await getInlineParticipantRoleId(newParticipant.roleId);

  const participantPayload = {
    fullname: newParticipant.fullname,
    username: createLogin
      ? newParticipant.username
      : `invite-${crypto.randomUUID()}`,
    email,
    phone: newParticipant.phone || null,
    password: createLogin
      ? newParticipant.password
      : crypto.randomBytes(24).toString('hex'),
    roleId,
  };

  const createdUser = await userService.createUser(participantPayload);
  console.log(
    `[meeting participant] Created inline participant ${createdUser.id} (${createdUser.fullname}) for email ${email || 'no email'}`
  );
  return createdUser;
};

class MeetingController {
  static async create(req, res) {
    try {
      console.log(`[meeting create] Request received from organizer ${req.user?.id || 'unknown'}`);
      const { newParticipant, participants = [], ...meetingFields } = req.body;
      let finalParticipants = [...participants];
      console.log(`[meeting create] Initial selected participants: ${finalParticipants.length}`);

      // If admin is registering a new participant inline, create them first
      if (newParticipant && newParticipant.fullname) {
        const createdUser = await createOrReuseInlineParticipant(newParticipant);

        finalParticipants.push(createdUser.id);
      }
      finalParticipants = [...new Set(finalParticipants)];
      console.log(`[meeting create] Final unique participants: ${finalParticipants.length}`);

      const meetingData = {
        ...meetingFields,
        organizer_id: req.user.id,
        participants: finalParticipants,
      };

      console.log(`[meeting create] Saving meeting "${meetingData.title}"`);
      const meeting = await Meeting.create(meetingData);
      console.log(`[meeting create] Meeting saved successfully: ${meeting.id}`);

      res.status(201).json({
        success: true,
        message: 'Meeting scheduled and invitations sent to all participants!',
        meeting,
        newParticipantRegistered: !!(newParticipant && newParticipant.fullname),
      });
      console.log(`[meeting create] API success response sent for meeting ${meeting.id}`);

      setImmediate(() => {
        console.log(`[meeting create] Queued invitation emails for meeting ${meeting.id}`);
        sendMeetingNotificationsInBackground(meeting.id, 'invitation').catch((err) => {
          console.error(`[meeting email] Failed to process invitations for meeting ${meeting.id}:`, err);
        });
      });
    } catch (err) {
      const status = err.statusCode || 500;
      console.error('[meeting create] Failed:', {
        status,
        message: err.message,
        stack: err.stack,
      });
      res.status(status).json({ success: false, message: err.message });
    }
  }

  static async getAll(req, res) {
    try {
      const meetings = await Meeting.findAll(req.query);
      res.json({ success: true, meetings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async dashboard(req, res) {
    try {
      const dashboard = await Meeting.getDashboardSummary(req.query);
      res.json({ success: true, dashboard });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getOne(req, res) {
    try {
      const meeting = await Meeting.findById(req.params.id);
      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }
      res.json({ success: true, meeting });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      console.log(`[meeting update] Request received for meeting ${req.params.id} from organizer ${req.user?.id || 'unknown'}`);
      const { newParticipant, participants = [], ...meetingFields } = req.body;
      let finalParticipants = [...participants];
      console.log(`[meeting update] Initial selected participants: ${finalParticipants.length}`);

      if (newParticipant && newParticipant.fullname) {
        const createdUser = await createOrReuseInlineParticipant(newParticipant);

        finalParticipants.push(createdUser.id);
      }
      finalParticipants = [...new Set(finalParticipants)];
      console.log(`[meeting update] Final unique participants: ${finalParticipants.length}`);

      console.log(`[meeting update] Saving changes for meeting ${req.params.id}`);
      const meeting = await Meeting.update(req.params.id, {
        ...meetingFields,
        participants: finalParticipants,
      });

      if (!meeting) {
        console.error(`[meeting update] Failed: meeting not found ${req.params.id}`);
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }
      console.log(`[meeting update] Meeting updated successfully: ${meeting.id}`);

      res.json({
        success: true,
        message: 'Meeting updated successfully. Update emails are being sent to participants.',
        meeting,
        newParticipantRegistered: !!(newParticipant && newParticipant.fullname),
      });
      console.log(`[meeting update] API success response sent for meeting ${meeting.id}`);

      setImmediate(() => {
        console.log(`[meeting update] Queued update emails for meeting ${meeting.id}`);
        sendMeetingNotificationsInBackground(meeting.id, 'update').catch((err) => {
          console.error(`[meeting email] Failed to process update emails for meeting ${meeting.id}:`, err);
        });
      });
    } catch (err) {
      const status = err.statusCode || 500;
      console.error('[meeting update] Failed:', {
        status,
        message: err.message,
        stack: err.stack,
      });
      res.status(status).json({ success: false, message: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const meeting = await Meeting.delete(req.params.id);
      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }
      res.json({ success: true, message: 'Meeting deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = MeetingController;
