const express = require('express');
const bcrypt  = require('bcryptjs');
const supabase = require('./supabaseClient');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, username, password_hash, admin')
    .eq('username', username)
    .limit(1);

  // Use the same generic error for wrong username or wrong password (no user enumeration)
  if (error || !users || users.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const user = users[0];

  if (!user.admin) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // Set session directly and explicitly save before responding
  req.session.user = { user_id: user.user_id, username: user.username, admin: true };
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error.' });
    res.json({ success: true });
  });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out.' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/admin/session  – lets the client check login status
router.get('/session', (req, res) => {
  if (req.session.user && req.session.user.admin) {
    return res.json({ loggedIn: true, username: req.session.user.username });
  }
  res.json({ loggedIn: false });
});

module.exports = router;
