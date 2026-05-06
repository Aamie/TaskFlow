const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users — list all users (admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/members — list all users for assignment (any authenticated)
router.get('/members', authenticate, (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY name').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role — change role (admin only)
router.put('/:id/role', authenticate, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or member' });
  }
  try {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  if (req.params.id == req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
