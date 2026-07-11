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
