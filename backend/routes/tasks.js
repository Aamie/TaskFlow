const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

// Helper: check project access
function hasProjectAccess(projectId, userId, role) {
  if (role === 'admin') return true;
  const member = db.prepare(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, userId);
  return !!member;
}

// GET /api/tasks?project_id=&assigned_to=&status=
router.get('/', authenticate, (req, res) => {
  const { project_id, assigned_to, status } = req.query;
  try {
    let query = `
      SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ` AND (t.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      ) OR t.assigned_to = ?)`;
      params.push(req.user.id, req.user.id);
    }

    if (project_id) { query += ' AND t.project_id = ?'; params.push(project_id); }
    if (assigned_to) { query += ' AND t.assigned_to = ?'; params.push(assigned_to); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }

    query += ' ORDER BY t.created_at DESC';

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', authenticate, (req, res) => {
  const { title, description, project_id, assigned_to, priority, due_date, status } = req.body;

  if (!title || !project_id) {
    return res.status(400).json({ error: 'Title and project_id are required' });
  }

  if (!hasProjectAccess(project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Access denied to this project' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      project_id,
      assigned_to || null,
      req.user.id,
      priority || 'medium',
      due_date || null,
      status || 'todo'
    );

    const task = db.prepare(`
      SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, (req, res) => {
  const { title, description, status, priority, assigned_to, due_date } = req.body;
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!hasProjectAccess(task.project_id, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = CASE WHEN ? IS NOT NULL THEN ? ELSE assigned_to END,
        due_date = COALESCE(?, due_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, status, priority, assigned_to, assigned_to, due_date, req.params.id);

    const updated = db.prepare(`
      SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'admin' && task.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only admins or task creators can delete tasks' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
