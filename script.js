// ===== Mobile menu =====
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');

menuBtn?.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});

mobileNav?.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('click', () => mobileNav.classList.remove('open'));
});

// ===== Smooth scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== Fade-in on scroll =====
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.feature-card, .step, .testimonial, .m-feature, .trade-card, .cta-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  fadeObserver.observe(el);
});

// ===== Live price flicker =====
function flickerPrice() {
  const priceEl = document.querySelector('.trade-price .price');
  if (!priceEl) return;
  const base = 43256.78;
  const delta = (Math.random() - 0.5) * 40;
  const newPrice = (base + delta).toFixed(2);
  priceEl.textContent = '$' + Number(newPrice).toLocaleString('en-US', { minimumFractionDigits: 2 });
}
setInterval(flickerPrice, 3000);

// ===== Header shadow =====
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 20 ? '0 4px 30px rgba(0,0,0,0.4)' : 'none';
});

// ===== Modal system =====
const overlays = document.querySelectorAll('.modal-overlay');

function openModal(id) {
  closeAllModals();
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.classList.add('modal-open');

  const form = modal.querySelector('form');
  const success = modal.querySelector('.form-success');
  if (form) {
    form.hidden = false;
    form.reset();
    modal.querySelectorAll('.form-error').forEach(e => e.remove());
  }
  if (success) success.hidden = true;
}

function closeModal(overlay) {
  overlay.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.classList.remove('modal-open');
  }
}

function closeAllModals() {
  overlays.forEach(o => o.classList.remove('open'));
  document.body.classList.remove('modal-open');
}

// Open triggers
document.querySelectorAll('[data-open]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const id = btn.getAttribute('data-open');
    openModal(id);

    if (id === 'trade-modal') {
      const dir = btn.getAttribute('data-direction') || 'up';
      const dirInput = document.getElementById('trade-direction');
      const summaryDir = document.getElementById('summary-dir');
      const tradeTitle = document.getElementById('trade-title');
      if (dirInput) dirInput.value = dir;
      if (summaryDir) {
        summaryDir.textContent = dir === 'up' ? 'UP ↗' : 'DOWN ↙';
        summaryDir.className = dir;
      }
      if (tradeTitle) {
        tradeTitle.textContent = dir === 'up' ? 'Buy UP — BTC/USD' : 'Buy DOWN — BTC/USD';
      }
      updateTradeProfit();
    }
  });
});

// Close triggers
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (!btn.hasAttribute('data-open') || btn.classList.contains('modal-close')) {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) closeModal(overlay);
    }
  });
});

// Click outside to close
overlays.forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});

// ===== Password toggle =====
document.querySelectorAll('[data-toggle-pw]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = 'Hide';
    } else {
      input.type = 'password';
      btn.textContent = 'Show';
    }
  });
});

// ===== Trade amount → profit calculator =====
function updateTradeProfit() {
  const amount = parseFloat(document.getElementById('trade-amount')?.value) || 0;
  const profitEl = document.getElementById('summary-profit');
  if (profitEl) {
    const profit = (amount * 0.95).toFixed(2);
    profitEl.textContent = '+$' + profit;
  }
}
document.getElementById('trade-amount')?.addEventListener('input', updateTradeProfit);

// ===== Toast helper =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  toast.hidden = false;
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 3200);
}

// ===== Form helpers =====
function setLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function showFormSuccess(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (form) form.hidden = true;
  if (success) success.hidden = false;
}

function showFormError(form, message) {
  form.querySelectorAll('.form-error').forEach(e => e.remove());
  const err = document.createElement('div');
  err.className = 'form-error';
  err.textContent = message;
  form.insertBefore(err, form.querySelector('button[type="submit"]'));
}

function delay(ms = 900) {
  return new Promise(r => setTimeout(r, ms));
}

// ===== Simple localStorage "auth" =====
const STORAGE_KEY = 'betabinary_users';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUser(email, data) {
  const users = getUsers();
  users[email.toLowerCase()] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function findUser(email) {
  return getUsers()[email.toLowerCase()] || null;
}

// ===== Login form =====
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const email = form.email.value.trim();
  const password = form.password.value;

  setLoading(btn, true);
  await delay();

  const user = findUser(email);
  if (!user) {
    setLoading(btn, false);
    showFormError(form, 'No account found with this email. Please sign up first.');
    return;
  }
  if (user.password !== password) {
    setLoading(btn, false);
    showFormError(form, 'Incorrect password. Please try again.');
    return;
  }

  localStorage.setItem('betabinary_session', JSON.stringify({ email, name: user.name }));
  setLoading(btn, false);
  showFormSuccess('login-form', 'login-success');
  showToast('Logged in as ' + (user.name || email));
  updateAuthUI();
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
});

// ===== Signup form =====
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirm = form.confirm.value;

  if (password !== confirm) {
    showFormError(form, 'Passwords do not match.');
    return;
  }
  if (password.length < 6) {
    showFormError(form, 'Password must be at least 6 characters.');
    return;
  }
  if (findUser(email)) {
    showFormError(form, 'An account with this email already exists. Please log in.');
    return;
  }

  setLoading(btn, true);
  await delay();

  saveUser(email, { name, password, created: Date.now() });
  localStorage.setItem('betabinary_session', JSON.stringify({ email, name }));
  // New accounts start with $0 balance
  if (!localStorage.getItem('betabinary_balance')) {
    localStorage.setItem('betabinary_balance', '0');
  }

  setLoading(btn, false);
  showFormSuccess('signup-form', 'signup-success');
  showToast('Account created successfully!');
  updateAuthUI();
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
});

// ===== Demo form =====
document.getElementById('demo-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const name = form.name.value.trim() || 'Demo Trader';

  setLoading(btn, true);
  await delay(700);

  localStorage.setItem('betabinary_demo', JSON.stringify({
    name,
    balance: 10000,
    started: Date.now()
  }));

  setLoading(btn, false);
  showFormSuccess('demo-form', 'demo-success');
  showToast('Demo account ready — $10,000 virtual funds');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
});

// ===== Trade form =====
document.getElementById('trade-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const amount = parseFloat(form.amount.value);
  const direction = form.direction.value;

  const session = localStorage.getItem('betabinary_session');
  const demo = localStorage.getItem('betabinary_demo');

  if (!session && !demo) {
    showFormError(form, 'Please log in, sign up, or start a demo first.');
    return;
  }

  setLoading(btn, true);
  await delay(800);

  const dirLabel = direction === 'up' ? 'UP' : 'DOWN';
  const expiryLabel = form.expiry.options[form.expiry.selectedIndex].text;
  const msg = `You placed a $${amount.toFixed(2)} ${dirLabel} trade on BTC/USD (${expiryLabel}).`;

  document.getElementById('trade-success-msg').textContent = msg;
  setLoading(btn, false);
  showFormSuccess('trade-form', 'trade-success');
  showToast('Trade submitted successfully!');
});

// ===== Forgot password =====
document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');

  setLoading(btn, true);
  await delay(1000);
  setLoading(btn, false);
  showFormSuccess('forgot-form', 'forgot-success');
  showToast('Reset link sent (if account exists)');
});

// ===== Auth UI update (header buttons) =====
function updateAuthUI() {
  const session = localStorage.getItem('betabinary_session');
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  if (session) {
    const { name, email } = JSON.parse(session);
    const display = name || email.split('@')[0];

    headerActions.querySelectorAll('[data-open], .user-menu').forEach(b => b.remove());

    const userBtn = document.createElement('button');
    userBtn.className = 'btn-outline user-menu';
    userBtn.textContent = display;
    userBtn.title = email + ' (click to log out)';
    userBtn.addEventListener('click', () => {
      if (confirm('Log out of COBRA FX?')) {
        localStorage.removeItem('betabinary_session');
        location.reload();
      }
    });
    headerActions.appendChild(userBtn);
  }
}

updateAuthUI();

// Success / Enter Hub buttons → dashboard
document.querySelectorAll('[data-go-dashboard], #login-success .btn-primary, #signup-success .btn-primary, #demo-success .btn-primary').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'dashboard.html';
  });
});
