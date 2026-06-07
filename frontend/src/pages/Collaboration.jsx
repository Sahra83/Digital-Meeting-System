// src/pages/Collaboration.jsx
import React, { useEffect, useState } from 'react';
import { meetingApi } from '../services/api';
import { apiRequest } from '../services/apiRequest';
import { io } from 'socket.io-client';

// Helper component for a single comment
function CommentItem({ comment, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.comment_text);

  const handleSave = () => {
    onEdit(comment.id, text);
    setEditing(false);
  };

  return (
    <div className="border rounded p-2 mb-2 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{comment.author_id}</p>
          {editing ? (
            <textarea
              className="w-full border rounded p-1"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          ) : (
            <p className="text-gray-800">{comment.comment_text}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(comment.created_at).toLocaleString()}
          </p>
        </div>
        <div className="space-x-2">
          {editing ? (
            <button
              className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
              onClick={handleSave}
            >
              Save
            </button>
          ) : (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
          <button
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
            onClick={() => onDelete(comment.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}


  export default function Collaboration() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [comments, setComments] = useState([]);
  const [newText, setNewText] = useState('');
  const [socket, setSocket] = useState(null);

  // Load meetings on mount
  useEffect(() => {
    meetingApi.list().then((data) => setMeetings(data.data || []));
  }, []);

  // Initialize Socket.IO when a meeting is selected
  useEffect(() => {
    if (!selectedMeeting) return;
    const s = io(); // default to same origin
    s.emit('join_meeting', selectedMeeting);
    s.on('new_comment', (comment) => {
      setComments((prev) => [...prev, comment]);
    });
    s.on('update_comment', (updated) => {
      setComments((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    });
    s.on('delete_comment', ({ id }) => {
      setComments((prev) => prev.filter((c) => c.id !== id));
    });
    setSocket(s);
    return () => {
      s.emit('leave_meeting', selectedMeeting);
      s.disconnect();
    };
  }, [selectedMeeting]);

  // Fetch comments when meeting changes
  useEffect(() => {
    if (!selectedMeeting) {
      setComments([]);
      return;
    }
    // Load all comments for the meeting (no item filter for now)
    apiRequest(`/collaboration/${selectedMeeting}/comments`)
      .then((data) => setComments(data.data || []))
      .catch((err) => console.error(err));
  }, [selectedMeeting]);

  const handlePost = async () => {
    if (!newText.trim()) return;
    try {
      await apiRequest(`/collaboration/${selectedMeeting}/comments`, {
        method: 'POST',
        body: { commentText: newText },
      });
      setNewText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (id, text) => {
    try {
      await apiRequest(`/collaboration/comments/${id}`, {
        method: 'PUT',
        body: { commentText: text },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/collaboration/comments/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Collaboration</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Meeting
        </label>
        <select
          className="border rounded p-2 w-full max-w-xs"
          value={selectedMeeting}
          onChange={(e) => setSelectedMeeting(e.target.value)}
        >
          <option value="">-- Choose a meeting --</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({new Date(m.meeting_date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedMeeting && (
        <>
          <div className="mb-4">
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Write a comment..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <button
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              onClick={handlePost}
            >
              Post Comment
            </button>
          </div>

          <div>
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
