const express  = require('express');
const supabase  = require('./supabaseClient');

const router = express.Router();

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  console.log('[requireAdmin] sessionID:', req.sessionID);
  console.log('[requireAdmin] session.user:', req.session?.user);
  if (!req.session.user || !req.session.user.admin) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// ── GET /api/posts  – all posts, public ──────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('post_id', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/posts/featured  – featured posts, public ────────────────────────
// NOTE: must be defined before /:id to avoid route conflict
router.get('/featured', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('featured', true)
    .order('post_id', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/posts/:id  – single post, public ────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID.' });

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('post_id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Post not found.' });
  res.json(data);
});

// ── POST /api/posts  – create post, admin only ───────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  const { category, title, etsy_link, image_url, description, featured } = req.body;

  if (!category || !title) {
    return res.status(400).json({ error: 'Category and title are required.' });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([{
      category,
      title,
      etsy_link:   etsy_link   || null,
      image_url:   image_url   || null,
      description: description || null,
      featured:    !!featured,
      user_id:     req.session.user.user_id
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ── PUT /api/posts/:id  – update post, admin only ────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID.' });

  const allowed = ['category', 'title', 'etsy_link', 'image_url', 'description', 'featured'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === 'featured' ? !!req.body[key] : req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('post_id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── DELETE /api/posts/:id  – delete post, admin only ─────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID.' });

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('post_id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
