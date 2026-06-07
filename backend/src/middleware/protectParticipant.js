// src/middleware/protectParticipant.js

const ApiError = require('../utils/apiError');
const { authenticate } = require('./authMiddleware');
const { isParticipantInMeeting } = require('./permissionHelpers');

/**
 * Middleware that ensures the user is authenticated and has the "participant" role.
 * It also can be used to protect resource‑specific routes by checking the
 * meeting participants table (or other participant‑related checks).
 */
function protectParticipant(req, res, next) {
  const verifyParticipant = async (err) => {
    if (err) return next(err);
    try {
      if (!req.user || req.user.role_name?.toLowerCase() !== 'participant') {
        return next(new ApiError(403, 'Access denied: participant role required'));
      }
      const meetingId = req.params.meetingId || req.params.id;
      if (meetingId) {
        const isParticipant = await isParticipantInMeeting(meetingId, req.user.id);
        if (!isParticipant) {
          return next(new ApiError(403, 'Access denied: not a participant of this meeting'));
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };

  if (req.user) {
    verifyParticipant();
    return;
  }

  authenticate(req, res, verifyParticipant);
}

module.exports = protectParticipant;
