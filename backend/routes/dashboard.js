const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let stats = {};

    if (isAdmin) {
      stats.total_projects = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
      stats.total_tasks = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
      stats.total_users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
      stats.tasks_done = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'done'").get().c;
      stats.tasks_in_progress = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'in_progress'").get().c;
      stats.tasks_todo = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'todo'").get().c;
      stats.overdue_tasks = db.prepare(
        "SELECT COUNT(*) as c FROM tasks WHERE due_date < date('now') AND status != 'done'"
      ).get().c;

      stats.recent_tasks = db.prepare(`
        SELECT t.*, u.name as assignee_name, p.name as project_name FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC LIMIT 5
      `).all();

      stats.project_summary = db.prepare(`
        SELECT p.id, p.name, p.status,
          COUNT(t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id ORDER BY p.created_at DESC LIMIT 5
      `).all();
    } else {
      stats.my_projects = db.prepare(`
        SELECT COUNT(DISTINCT p.id) as c FROM projects p
        WHERE p.created_by = ? OR EXISTS (
          SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?
        )
      `).get(userId, userId).c;

      stats.my_tasks = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ?").get(userId).c;
      stats.tasks_done = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status = 'done'").get(userId).c;
      stats.tasks_in_progress = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status = 'in_progress'").get(userId).c;
      stats.tasks_todo = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status = 'todo'").get(userId).c;
      stats.overdue_tasks = db.prepare(
        "SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND due_date < date('now') AND status != 'done'"
      ).get(userId).c;

      stats.recent_tasks = db.prepare(`
        SELECT t.*, u.name as assignee_name, p.name as project_name FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        JOIN projects p ON t.project_id = p.id
        WHERE t.assigned_to = ? OR t.created_by = ?
        ORDER BY t.created_at DESC LIMIT 5
      `).all(userId, userId);
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
