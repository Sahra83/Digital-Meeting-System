const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatDate = (value) => {
  if (!value) return 'Not specified';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

async function sendMeetingInvitation(participantEmail, participantFullname, meetingDetails, options = {}) {
  const {
    title,
    meeting_date,
    meeting_time,
    location,
    agenda,
    organizerFullname,
  } = meetingDetails;

  const safeParticipantName = escapeHtml(participantFullname || 'Participant');
  const safeTitle = escapeHtml(title);
  const formattedDate = formatDate(meeting_date);
  const isUpdate = options.type === 'update';
  const emailTitle = isUpdate ? 'Meeting Updated' : 'Meeting Invitation';
  const introText = isUpdate
    ? 'A meeting you are invited to has been updated.'
    : 'You have been invited to a scheduled meeting.';
  const detailText = isUpdate
    ? 'Please review the latest meeting details below.'
    : 'Please find the meeting details below.';

  const text = [
    `Hello ${participantFullname || 'Participant'},`,
    '',
    introText,
    '',
    `Title: ${title || 'Not specified'}`,
    `Date: ${formattedDate}`,
    `Time: ${meeting_time || 'Not specified'}`,
    `Location: ${location || 'Not specified'}`,
    `Organizer: ${organizerFullname || 'Not specified'}`,
    '',
    'Agenda:',
    agenda || 'Not specified',
    '',
    'Thank you,',
    'Digital Meeting Minutes Management System',
  ].join('\n');

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dce4ef;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background:#0f4c81;padding:24px 28px;color:#ffffff;">
                    <h1 style="margin:0;font-size:24px;line-height:1.3;">${emailTitle}</h1>
                    <p style="margin:8px 0 0;font-size:15px;line-height:1.5;">${introText}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello ${safeParticipantName},</p>
                    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">
                      ${detailText}
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:15px;">
                      <tr>
                        <td style="width:150px;padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Title</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${safeTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Date</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${escapeHtml(formattedDate)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Time</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${escapeHtml(meeting_time)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Location</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${escapeHtml(location)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Organizer</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${escapeHtml(organizerFullname)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;border-bottom:1px solid #e7edf5;font-weight:bold;color:#34445c;vertical-align:top;">Agenda</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;border-bottom:1px solid #e7edf5;white-space:pre-line;">${escapeHtml(agenda)}</td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#5b6b82;">
                      Thank you,<br />
                      Digital Meeting Minutes Management System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Digital Meeting Minutes" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: participantEmail,
    subject: isUpdate ? `Meeting updated: ${title}` : `Meeting scheduled: ${title}`,
    text,
    html,
    headers: {
      'X-Auto-Response-Suppress': 'All',
    },
  });
}

async function sendMinutesNotification(participantEmail, participantFullname, meetingTitle, minutesSummary) {
  const safeParticipantName = escapeHtml(participantFullname || 'Participant');
  const safeTitle = escapeHtml(meetingTitle);

  const text = [
    `Hello ${participantFullname || 'Participant'},`,
    '',
    'Meeting minutes have been updated.',
    `Meeting: ${meetingTitle || 'Not specified'}`,
    '',
    'Summary:',
    minutesSummary,
    '',
    'Thank you,',
    'Digital Meeting Minutes Management System',
  ].join('\n');

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dce4ef;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background:#0f4c81;padding:24px 28px;color:#ffffff;">
                    <h1 style="margin:0;font-size:24px;line-height:1.3;">Meeting Minutes Updated</h1>
                    <p style="margin:8px 0 0;font-size:15px;line-height:1.5;">${safeTitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello ${safeParticipantName},</p>
                    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">
                      Meeting minutes have been updated.
                    </p>
                    <div style="background:#f8fafc;padding:16px;border-radius:6px;font-size:14px;white-space:pre-line;">
                      ${escapeHtml(minutesSummary)}
                    </div>
                    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#5b6b82;">
                      Thank you,<br />
                      Digital Meeting Minutes Management System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Digital Meeting Minutes" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: participantEmail,
    subject: `Meeting Minutes Updated: ${meetingTitle}`,
    text,
    html,
    headers: {
      'X-Auto-Response-Suppress': 'All',
    },
  });
}

async function sendTaskReminderEmail(recipientEmail, recipientName, taskDescription, deadline, status) {
  const safeName = escapeHtml(recipientName || 'User');
  const safeTask = escapeHtml(taskDescription);
  const formattedDeadline = formatDate(deadline);
  const safeStatus = escapeHtml(status);

  const text = [
    `Hello ${recipientName || 'User'},`,
    '',
    'You have a pending task assignment.',
    `Task: ${taskDescription || 'Not specified'}`,
    `Deadline: ${formattedDeadline}`,
    `Status: ${status || 'Pending'}`,
    '',
    'Please take necessary actions.',
    '',
    'Thank you,',
    'Digital Meeting Minutes Management System',
  ].join('\n');

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dce4ef;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background:#0f4c81;padding:24px 28px;color:#ffffff;">
                    <h1 style="margin:0;font-size:24px;line-height:1.3;">Task Reminder</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello ${safeName},</p>
                    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">You have a pending task assignment.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:15px;">
                      <tr>
                        <td style="width:150px;padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Task</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${safeTask}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Deadline</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${escapeHtml(formattedDeadline)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px;border-top:1px solid #e7edf5;font-weight:bold;color:#34445c;">Status</td>
                        <td style="padding:12px;border-top:1px solid #e7edf5;">${safeStatus}</td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#5b6b82;">Thank you,<br/>Digital Meeting Minutes Management System</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Digital Meeting Minutes" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Task Reminder: ${taskDescription}`,
    text,
    html,
    headers: { 'X-Auto-Response-Suppress': 'All' },
  });
}

module.exports = {
  sendMeetingInvitation,
  sendMinutesNotification,
  sendTaskReminderEmail,
};
