const Task = require('../models/Task');
const ApiError = require('../utils/apiError');
const { sendTaskReminderEmail } = require('../services/emailService');

class TaskController {
  static async getMeetings(req, res, next) {
    try {
      const meetings = await Task.getAllMeetingsForDropdown();
      res.json({ meetings });
    } catch (err) {
      next(err);
    }
  }

  static async getTasksByMeeting(req, res, next) {
    try {
      const { meetingId } = req.params;
      let tasks = await Task.getTasksByMeetingId(meetingId);
      
      const now = new Date();
      tasks = tasks.map(task => {
        let is_overdue = false;
        if (task.deadline && task.status !== 'completed') {
          const deadlineDate = new Date(task.deadline);
          // Set to end of day to be fair
          deadlineDate.setHours(23, 59, 59, 999);
          if (now > deadlineDate) {
            is_overdue = true;
          }
        }
        return {
          ...task,
          is_overdue
        };
      });

      res.json({ tasks });
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { task_description, assigned_to, deadline, status } = req.body;

      const updatedTask = await Task.updateTask(taskId, {
        task_description,
        assigned_to: assigned_to || null,
        deadline: deadline || null,
        status: status || 'pending'
      });

      if (!updatedTask) {
        throw new ApiError(404, 'Task not found');
      }

      res.json({ message: 'Task updated successfully', task: updatedTask });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const deletedTask = await Task.deleteTask(taskId);

      if (!deletedTask) {
        throw new ApiError(404, 'Task not found');
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async resendEmail(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await Task.getTaskById(taskId);

      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      if (!task.assigned_to_email) {
        throw new ApiError(400, 'Assigned user does not have an email address');
      }

      // Non-blocking background send
      sendTaskReminderEmail(
        task.assigned_to_email,
        task.assigned_to_name,
        task.task_description,
        task.deadline,
        task.status
      ).catch(err => {
        console.error('Failed to send task reminder email:', err);
      });

      res.json({ message: 'Reminder email sent successfully!' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TaskController;
