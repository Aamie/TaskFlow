const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/projects — list projects for current user
router.get('/', authenticate, (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = db.prepare(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
          (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
        FROM projects p
        JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `).all();
    } else {
      projects = db.prepare(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
          (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
        FROM projects p
        JOIN users u ON p.created_by = u.id
        WHERE p.created_by = ? OR EXISTS (
          SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?
        )
        ORDER BY p.created_at DESC
      `).all(req.user.id, req.user.id);
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — create project (admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, description, memberIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  try {
    const result = db.prepare(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name, description || null, req.user.id);

    const projectId = result.lastInsertRowid;

    // Add creator as member
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(projectId, req.user.id);

    // Add other members
    if (memberIds && Array.isArray(memberIds)) {
      const insertMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)');
      memberIds.forEach(uid => insertMember.run(projectId, uid));
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*, u.name as creator_name FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check access
    if (req.user.role !== 'admin') {
      const member = db.prepare(
        'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(req.params.id, req.user.id);
      if (!member && project.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role FROM users u
      JOIN project_members pm ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    const tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name, c.name as creator_name FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `).all(req.params.id);

    res.json({ ...project, members, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, description, status } = req.body;
  try {
    db.prepare(`
      UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description),
      status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, description, status, req.params.id);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', authenticate, requireAdmin, (req, res) => {
  const { userId } = req.body;
  try {
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(req.params.id, userId);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
