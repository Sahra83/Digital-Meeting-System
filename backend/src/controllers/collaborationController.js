// src/controllers/collaborationController.js
const Comment = require('../models/Comment');

// GET /collaboration/:meetingId/comments?itemType=&itemId=
async function listComments(req, res, next) {
  try {
    const { meetingId } = req.params;
    const { itemType, itemId } = req.query;
    const comments = await Comment.list(meetingId, itemType, itemId);
    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
}

// GET /collaboration/comments/:id
async function getComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await Comment.getById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ data: comment });
  } catch (err) {
    next(err);
  }
}

// POST /collaboration/:meetingId/comments
async function createComment(req, res, next) {
  try {
    const { meetingId } = req.params;
    const { minutesId, itemType, itemId, commentText, parentId } = req.body;
    const authorId = req.user.id;
    const comment = await Comment.create({
      meetingId,
      minutesId: minutesId || null,
      itemType: itemType || null,
      itemId: itemId || null,
      authorId,
      commentText,
      parentId: parentId || null,
    });
    // Emit real‑time event to room
    const io = req.app.get('io');
    io.to(`meeting_${meetingId}`).emit('new_comment', comment);
    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
}

// PUT /collaboration/comments/:id
async function updateComment(req, res, next) {
  try {
    const { id } = req.params;
    const { commentText } = req.body;
    const comment = await Comment.getById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    // Only author or meeting organizer can edit
    if (comment.author_id !== req.user.id && req.user.role_name !== 'Admin' && req.user.role_name !== 'Meeting Organizer') {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }
    const updated = await Comment.update(id, commentText);
    const io = req.app.get('io');
    io.to(`meeting_${comment.meeting_id}`).emit('update_comment', updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /collaboration/comments/:id
async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await Comment.getById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    // Only author or admin/organizer can delete
    if (comment.author_id !== req.user.id && req.user.role_name !== 'Admin' && req.user.role_name !== 'Meeting Organizer') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    const deleted = await Comment.delete(id);
    const io = req.app.get('io');
    io.to(`meeting_${comment.meeting_id}`).emit('delete_comment', { id });
    res.json({ data: deleted });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
};
