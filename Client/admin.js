/* ============================================================
   Admin Panel – JavaScript
   ============================================================ */

const loginPanel    = document.getElementById('loginPanel');
const dashboardPanel = document.getElementById('dashboardPanel');

// ── Boot: check if already logged in ────────────────────────
async function boot() {
  try {
    const res  = await fetch('/api/admin/session', { credentials: 'same-origin' });
    const data = await res.json();
    if (data.loggedIn) {
      showDashboard(data.username);
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginPanel.style.display    = 'flex';
  dashboardPanel.style.display = 'none';
}

function showDashboard(username) {
  loginPanel.style.display    = 'none';
  dashboardPanel.style.display = 'block';
  document.getElementById('welcomeUser').textContent = `Hi, ${username}`;
  loadPosts();
}

// ── Login form ───────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn      = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const res  = await fetch('/api/admin/login', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showDashboard(username);
    } else {
      errEl.textContent   = data.error || 'Login failed. Please try again.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent   = 'Network error. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Sign In';
  }
});

// ── Logout ───────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  showLogin();
});

// ── Build a product card DOM node ────────────────────────────
function buildAdminCard(post) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.postId = post.post_id;

  const imgSrc = post.image_url || 'Assets/CozyCrafts.png';
  const etsyHref = post.etsy_link || '#';
  const categoryLabel = post.category
    ? post.category.charAt(0).toUpperCase() + post.category.slice(1)
    : 'Uncategorised';
  const featuredClass = post.featured ? 'active' : '';
  const featuredLabel = post.featured ? '★ Featured' : '☆ Feature';

  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${escHtml(imgSrc)}" alt="${escHtml(post.title)}" />
      <div class="product-overlay">
        ${post.etsy_link
          ? `<a href="${escHtml(etsyHref)}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Buy on Etsy</a>`
          : '<span class="btn btn-primary btn-sm" style="pointer-events:none;opacity:.6;">No Etsy link</span>'}
      </div>
    </div>
    <div class="product-info">
      <span class="product-category">${escHtml(categoryLabel)}</span>
      <h3 class="product-name">${escHtml(post.title)}</h3>
      <p class="product-price">See on Etsy</p>
    </div>
    <div class="admin-card-controls">
      <button class="admin-feat-btn ${featuredClass}" data-id="${post.post_id}">
        ${escHtml(featuredLabel)}
      </button>
      <button class="admin-edit-btn" data-id="${post.post_id}">
        ✏️ Edit
      </button>
      <button class="admin-del-btn" data-id="${post.post_id}">
        🗑 Delete
      </button>
    </div>
  `;

  // Featured toggle
  card.querySelector('.admin-feat-btn').addEventListener('click', () =>
    toggleFeatured(post.post_id, !post.featured, card)
  );

  // Edit
  card.querySelector('.admin-edit-btn').addEventListener('click', () =>
    openEditModal(post, card)
  );

  // Delete
  card.querySelector('.admin-del-btn').addEventListener('click', () =>
    deletePost(post.post_id, card)
  );

  return card;
}

// ── Sanitise text before putting in HTML ────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Load all posts ───────────────────────────────────────────
async function loadPosts() {
  const grid    = document.getElementById('postsGrid');
  const loading = document.getElementById('postsLoading');
  const noMsg   = document.getElementById('noPostsMsg');

  loading.style.display = 'block';
  grid.innerHTML = '';
  noMsg.style.display = 'none';

  try {
    const res   = await fetch('/api/posts', { credentials: 'same-origin' });
    const posts = await res.json();

    loading.style.display = 'none';

    if (!Array.isArray(posts) || posts.length === 0) {
      noMsg.style.display = 'block';
      return;
    }

    posts.forEach(post => grid.appendChild(buildAdminCard(post)));
  } catch {
    loading.textContent = 'Failed to load products.';
  }
}

// ── Add new post ─────────────────────────────────────────────
document.getElementById('addPostForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn     = document.getElementById('addPostBtn');
  const errEl   = document.getElementById('addPostError');
  const succEl  = document.getElementById('addPostSuccess');

  errEl.style.display  = 'none';
  succEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Adding…';

  const body = {
    title:       document.getElementById('postTitle').value.trim(),
    category:    document.getElementById('postCategory').value,
    image_url:   document.getElementById('postImageUrl').value.trim(),
    etsy_link:   document.getElementById('postEtsyLink').value.trim(),
    description: document.getElementById('postDescription').value.trim(),
    featured:    document.getElementById('postFeatured').checked
  };

  try {
    const res  = await fetch('/api/posts', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok) {
      succEl.textContent   = `"${data.title}" added successfully!`;
      succEl.style.display = 'block';
      e.target.reset();
      // Prepend new card
      const grid = document.getElementById('postsGrid');
      const noMsg = document.getElementById('noPostsMsg');
      noMsg.style.display = 'none';
      grid.prepend(buildAdminCard(data));
    } else {
      errEl.textContent   = data.error || 'Failed to add product.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent   = 'Network error. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Add Product';
  }
});

// ── Toggle featured ──────────────────────────────────────────
async function toggleFeatured(id, newValue, cardEl) {
  const btn = cardEl.querySelector('.admin-feat-btn');
  btn.disabled = true;

  try {
    const res  = await fetch(`/api/posts/${id}`, {
      method:      'PUT',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ featured: newValue })
    });
    const data = await res.json();

    if (res.ok) {
      btn.classList.toggle('active', data.featured);
      btn.textContent = data.featured ? '★ Featured' : '☆ Feature';
      // Update stored value for next toggle
      cardEl._featuredState = data.featured;
      // Re-bind click with updated value
      btn.onclick = null;
      btn.addEventListener('click', () => toggleFeatured(id, !data.featured, cardEl));
    }
  } finally {
    btn.disabled = false;
  }
}

// ── Delete post ──────────────────────────────────────────────
async function deletePost(id, cardEl) {
  if (!confirm('Delete this product? This cannot be undone.')) return;

  const btn = cardEl.querySelector('.admin-del-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) {
      cardEl.remove();
      const grid = document.getElementById('postsGrid');
      if (grid.children.length === 0) {
        document.getElementById('noPostsMsg').style.display = 'block';
      }
    } else {
      btn.disabled    = false;
      btn.textContent = '🗑 Delete';
      alert('Failed to delete product. Please try again.');
    }
  } catch {
    btn.disabled    = false;
    btn.textContent = '🗑 Delete';
    alert('Network error. Please try again.');
  }
}

// ── Edit modal ───────────────────────────────────────────────
const editModal   = document.getElementById('editModal');
let   _editCard   = null;   // reference to the card being edited

function openEditModal(post, card) {
  _editCard = card;
  document.getElementById('editPostId').value        = post.post_id;
  document.getElementById('editTitle').value         = post.title         || '';
  document.getElementById('editCategory').value      = post.category      || '';
  document.getElementById('editImageUrl').value      = post.image_url     || '';
  document.getElementById('editEtsyLink').value      = post.etsy_link     || '';
  document.getElementById('editDescription').value   = post.description   || '';
  document.getElementById('editFeatured').checked    = !!post.featured;
  document.getElementById('editPostError').style.display = 'none';
  editModal.style.display = 'flex';
  document.getElementById('editTitle').focus();
}

function closeEditModal() {
  editModal.style.display = 'none';
  _editCard = null;
}

document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);

// Close on backdrop click
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editModal.style.display !== 'none') closeEditModal();
});

document.getElementById('editPostForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id    = document.getElementById('editPostId').value;
  const btn   = document.getElementById('editSaveBtn');
  const errEl = document.getElementById('editPostError');

  errEl.style.display = 'none';
  btn.disabled    = true;
  btn.textContent = 'Saving…';

  const body = {
    title:       document.getElementById('editTitle').value.trim(),
    category:    document.getElementById('editCategory').value,
    image_url:   document.getElementById('editImageUrl').value.trim(),
    etsy_link:   document.getElementById('editEtsyLink').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    featured:    document.getElementById('editFeatured').checked
  };

  try {
    const res  = await fetch(`/api/posts/${id}`, {
      method:      'PUT',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok) {
      // Rebuild the card in-place with updated data
      if (_editCard) {
        const newCard = buildAdminCard(data);
        _editCard.replaceWith(newCard);
      }
      closeEditModal();
    } else {
      errEl.textContent   = data.error || 'Failed to save changes.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent   = 'Network error. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save Changes';
  }
});

// ── Start ────────────────────────────────────────────────────
boot();
