/* ============================================================
   Nina's Crochet – JavaScript
   ============================================================ */

// ── Shared Navbar Loader ─────────────────────────────────────
async function loadNavbar() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  try {
    const res  = await fetch('navbar.html');
    const html = await res.text();
    placeholder.outerHTML = html;
  } catch (e) {
    console.error('Could not load navbar:', e);
    return;
  }

  initHamburger();
  setActiveLink();
}

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navCenter  = document.getElementById('navCenter');
  if (!hamburger || !navCenter) return;

  hamburger.addEventListener('click', () => {
    const isOpen = navCenter.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navCenter.contains(e.target)) {
      navCenter.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
    }
  });
}

function setActiveLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === page);
  });
}

document.addEventListener('DOMContentLoaded', loadNavbar);

// ── Newsletter Form ─────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  const btn   = e.target.querySelector('button[type="submit"]');
  const orig  = btn.textContent;
  btn.textContent = 'Subscribed! 🌸';
  btn.style.background = '#a8d5a2';
  btn.style.color = '#fff';
  input.value = '';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.color = '';
  }, 3500);
}

// ── Product Filter ──────────────────────────────────────────
function filterProducts(category, btn) {
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show / hide cards
  document.querySelectorAll('.product-card[data-category]').forEach(card => {
    const match = category === 'all' || card.dataset.category === category;
    card.style.display = match ? '' : 'none';
    if (match) {
      card.style.animation = 'none';
      // Trigger reflow to restart animation
      card.offsetHeight; // eslint-disable-line no-unused-expressions
      card.style.animation = 'fadeInUp 0.4s ease both';
    }
  });
}

// ── Scroll Fade-In Observer ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .product-card, .value-card, .process-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// ── Shared helper: escape HTML to prevent XSS ───────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Shared helper: build a product card element from a DB post ──
function buildProductCard(post) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.category = post.category || 'other';

  const imgSrc = post.image_url || 'Assets/CozyCrafts.png';
  const categoryLabel = post.category
    ? post.category.charAt(0).toUpperCase() + post.category.slice(1)
    : 'Handmade';

  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${escHtml(imgSrc)}" alt="${escHtml(post.title)}" loading="lazy" />
      <div class="product-overlay">
        ${post.etsy_link
          ? `<a href="${escHtml(post.etsy_link)}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Buy on Etsy</a>`
          : ''}
      </div>
    </div>
    <div class="product-info">
      <span class="product-category">${escHtml(categoryLabel)}</span>
      <h3 class="product-name">${escHtml(post.title)}</h3>
      <p class="product-price">See on Etsy</p>
    </div>
  `;
  return card;
}

// ── Products page: load all posts ───────────────────────────
async function loadProductsPage() {
  const grid    = document.getElementById('productsGrid');
  const loading = document.getElementById('productsLoading');
  const noMsg   = document.getElementById('noProductsMsg');
  const filterBar = document.getElementById('filterBar');
  if (!grid) return;

  try {
    const res   = await fetch('/api/posts');
    const posts = await res.json();

    if (loading) loading.style.display = 'none';

    if (!Array.isArray(posts) || posts.length === 0) {
      if (noMsg) noMsg.style.display = 'block';
      return;
    }

    if (filterBar) filterBar.style.display = '';
    posts.forEach(post => grid.appendChild(buildProductCard(post)));
  } catch (err) {
    if (loading) loading.textContent = 'Could not load products. Please try again later.';
    console.error('Products load error:', err);
  }
}

// ── Home page: load featured posts ──────────────────────────
async function loadFeaturedProducts() {
  const grid    = document.getElementById('featuredGrid');
  const loading = document.getElementById('featuredLoading');
  if (!grid) return;

  if (loading) loading.style.display = 'block';

  try {
    const res   = await fetch('/api/posts/featured');
    const posts = await res.json();

    if (loading) loading.style.display = 'none';

    if (Array.isArray(posts) && posts.length > 0) {
      posts.forEach(post => grid.appendChild(buildProductCard(post)));
    }
    // If no featured posts, the section simply stays empty / hidden gracefully
  } catch (err) {
    if (loading) loading.style.display = 'none';
    console.error('Featured products load error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProductsPage();
  loadFeaturedProducts();
});
