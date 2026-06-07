const MeetingMinutes = require('../models/MeetingMinutes');
const ApiError = require('../utils/apiError');
const db = require('../config/db');
const { sendMinutesNotification } = require('../services/emailService');

const getMinutesPermission = async (meetingId, user) => {
  const access = await MeetingMinutes.getMeetingAccess(meetingId, user.id);

  if (!access) {
    throw new ApiError(404, 'Meeting not found');
  }

  return {
    canEdit: user.role_name === 'Admin' || access.isOrganizer || access.isParticipant,
  };
};

class MeetingMinutesController {
  static async getParticipants(req, res, next) {
    try {
      const { meetingId } = req.params;
      const access = await MeetingMinutes.getMeetingAccess(meetingId, req.user.id);

      if (!access) {
        throw new ApiError(404, 'Meeting not found');
      }

      const participants = await MeetingMinutes.findParticipantsByMeetingId(meetingId);

      res.json({
        success: true,
        participants,
      });
    } catch (err) {
      next(err);
    }
  }

  static async get(req, res, next) {
    try {
      const { meetingId } = req.params;
      const permission = await getMinutesPermission(meetingId, req.user);
      const minutes = await MeetingMinutes.findByMeetingId(meetingId);

      res.json({
        success: true,
        minutes,
        canEdit: permission.canEdit,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { meetingId } = req.params;
      const permission = await getMinutesPermission(meetingId, req.user);

      if (!permission.canEdit) {
        throw new ApiError(403, 'Only the meeting organizer or invited participants can create minutes');
      }

      const existingMinutes = await MeetingMinutes.findByMeetingId(meetingId);
      if (existingMinutes) {
        throw new ApiError(409, 'Minutes already exist for this meeting');
      }

      const minutes = await MeetingMinutes.create(meetingId, req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Minutes saved successfully!',
        minutes,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { meetingId } = req.params;
      const permission = await getMinutesPermission(meetingId, req.user);

      if (!permission.canEdit) {
        throw new ApiError(403, 'Only the meeting organizer or invited participants can update minutes');
      }

      const minutes = await MeetingMinutes.update(meetingId, req.body, req.user.id);
      if (!minutes) {
        throw new ApiError(404, 'Minutes have not been created for this meeting yet');
      }

      res.json({
        success: true,
        message: 'Minutes saved successfully!',
        minutes,
      });
    } catch (err) {
      next(err);
    }
  }

  static async versions(req, res, next) {
    try {
      const { meetingId } = req.params;
      await getMinutesPermission(meetingId, req.user);
      const versions = await MeetingMinutes.listVersions(meetingId);

      res.json({
        success: true,
        versions,
      });
    } catch (err) {
      next(err);
    }
  }

  static async restoreVersion(req, res, next) {
    try {
      const { meetingId, versionId } = req.params;
      const permission = await getMinutesPermission(meetingId, req.user);

      if (!permission.canEdit) {
        throw new ApiError(403, 'Only the meeting organizer or invited participants can restore minutes');
      }

      const minutes = await MeetingMinutes.restoreVersion(meetingId, versionId, req.user.id);
      if (!minutes) {
        throw new ApiError(404, 'Minutes version not found');
      }

      res.json({
        success: true,
        message: 'Minutes version restored successfully!',
        minutes,
      });
    } catch (err) {
      next(err);
    }
  }

  static async exportReport(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { format = 'word' } = req.query;
      await getMinutesPermission(meetingId, req.user);

      const meetingResult = await db.query(
        `
          SELECT m.*, u.fullname AS organizer_name
          FROM meetings m
          JOIN users u ON u.id = m.organizer_id
          WHERE m.id = $1
        `,
        [meetingId]
      );

      const meeting = meetingResult.rows[0];
      if (!meeting) {
        throw new ApiError(404, 'Meeting not found');
      }

      const minutes = await MeetingMinutes.findByMeetingId(meetingId);
      const filenameBase = meeting.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'meeting-report';

      if (format === 'pdf') {
        const buffer = buildSimplePdf(buildReportLines(meeting, minutes));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
        res.send(buffer);
        return;
      }

      const html = buildWordReport(meeting, minutes);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.doc"`);
      res.send(html);
    } catch (err) {
      next(err);
    }
  }
  static async notify(req, res, next) {
    try {
      const { meetingId } = req.params;
      const { sendToAll, participantIds } = req.body;
      const permission = await getMinutesPermission(meetingId, req.user);

      if (!permission.canEdit) {
        throw new ApiError(403, 'Only the meeting organizer or invited participants can send notifications');
      }

      const meetingResult = await db.query('SELECT title FROM meetings WHERE id = $1', [meetingId]);
      if (meetingResult.rows.length === 0) {
        throw new ApiError(404, 'Meeting not found');
      }
      const meetingTitle = meetingResult.rows[0].title;

      const participants = await MeetingMinutes.findParticipantsByMeetingId(meetingId);
      let targetParticipants = [];

      if (sendToAll) {
        targetParticipants = participants;
      } else if (Array.isArray(participantIds)) {
        targetParticipants = participants.filter(p => participantIds.includes(p.id));
      }

      if (targetParticipants.length === 0) {
        throw new ApiError(400, 'No valid participants selected');
      }

      const minutes = await MeetingMinutes.findByMeetingId(meetingId);
      if (!minutes) {
        throw new ApiError(404, 'Minutes have not been created for this meeting yet');
      }

      let minutesSummary = '';
      if (minutes.discussion_points && minutes.discussion_points.length > 0) {
        minutesSummary += 'Discussion Points:\n';
        minutes.discussion_points.forEach(dp => {
          minutesSummary += `- ${dp.topic}\n`;
        });
        minutesSummary += '\n';
      }

      if (minutes.decisions && minutes.decisions.length > 0) {
        minutesSummary += 'Decisions:\n';
        minutes.decisions.forEach(d => {
          minutesSummary += `- ${d.decision_text} (Made by: ${d.made_by_name || 'Not specified'})\n`;
        });
        minutesSummary += '\n';
      }

      if (minutes.assigned_tasks && minutes.assigned_tasks.length > 0) {
        minutesSummary += 'Assigned Tasks:\n';
        minutes.assigned_tasks.forEach(t => {
          const deadlineStr = t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline';
          minutesSummary += `- ${t.task_description} (Assigned to: ${t.assigned_to_name || 'Not specified'}, Deadline: ${deadlineStr})\n`;
        });
      }

      if (!minutesSummary) {
        minutesSummary = 'No detailed minutes recorded.';
      }

      Promise.allSettled(
        targetParticipants.map(participant => {
          if (!participant.email) return Promise.resolve();
          return sendMinutesNotification(
            participant.email,
            participant.fullname,
            meetingTitle,
            minutesSummary
          );
        })
      ).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to send minutes email to ${targetParticipants[index].email}:`, result.reason);
          }
        });
      });

      res.json({
        success: true,
        message: 'Emails sent successfully!',
      });
    } catch (err) {
      next(err);
    }
  }
}

function buildReportLines(meeting, minutes) {
  const lines = [
    `Meeting Report: ${meeting.title}`,
    `Organizer: ${meeting.organizer_name}`,
    `Date: ${meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'Not set'}`,
    `Time: ${meeting.meeting_time || 'Not set'}`,
    `Location: ${meeting.location || 'Not set'}`,
    '',
    'Agenda',
    meeting.agenda || 'No agenda recorded.',
    '',
    'Discussion Points',
    ...(minutes?.discussion_points?.length ? minutes.discussion_points.map((point) => `- ${point.topic}`) : ['No discussion points recorded.']),
    '',
    'Decisions',
    ...(minutes?.decisions?.length ? minutes.decisions.map((decision) => `- ${decision.decision_text}`) : ['No decisions recorded.']),
    '',
    'Action Items',
    ...(minutes?.assigned_tasks?.length ? minutes.assigned_tasks.map((task) => `- ${task.task_description} (${task.status || 'pending'})`) : ['No action items recorded.']),
  ];

  return lines;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWordReport(meeting, minutes) {
  const section = (title, rows) => `
    <h2>${escapeHtml(title)}</h2>
    ${rows.length ? `<ul>${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join('')}</ul>` : '<p>No records.</p>'}
  `;

  return `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>${escapeHtml(meeting.title)} Report</title></head>
      <body>
        <h1>${escapeHtml(meeting.title)}</h1>
        <p><strong>Organizer:</strong> ${escapeHtml(meeting.organizer_name)}</p>
        <p><strong>Date:</strong> ${meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'Not set'}</p>
        <p><strong>Time:</strong> ${escapeHtml(meeting.meeting_time || 'Not set')}</p>
        <p><strong>Location:</strong> ${escapeHtml(meeting.location || 'Not set')}</p>
        <h2>Agenda</h2>
        <p>${escapeHtml(meeting.agenda || 'No agenda recorded.')}</p>
        ${section('Discussion Points', (minutes?.discussion_points || []).map((point) => point.topic))}
        ${section('Decisions', (minutes?.decisions || []).map((decision) => decision.decision_text))}
        ${section('Action Items', (minutes?.assigned_tasks || []).map((task) => `${task.task_description} (${task.status || 'pending'})`))}
      </body>
    </html>
  `;
}

function buildSimplePdf(lines) {
  const content = lines
    .flatMap((line) => {
      const text = String(line || ' ');
      return text.length > 92 ? text.match(/.{1,92}(\s|$)/g) || [text] : [text];
    })
    .slice(0, 42)
    .map((line, index) => `BT /F1 10 Tf 50 ${760 - index * 16} Td (${escapePdf(line.trim())}) Tj ET`)
    .join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

function escapePdf(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

module.exports = MeetingMinutesController;
