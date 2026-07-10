// AUTH
function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}
function switchTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').style.background = tab === 'login' ? '#00d4ff' : 'none';
  document.getElementById('tab-login').style.color = tab === 'login' ? '#000' : '#00d4ff';
  document.getElementById('tab-signup').style.background = tab === 'signup' ? '#00d4ff' : 'none';
  document.getElementById('tab-signup').style.color = tab === 'signup' ? '#000' : '#00d4ff';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  const res = await fetch('https://event-hub-zv4f.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    closeAuthModal();
    updateNavForUser(data.user);
  } else {
    err.textContent = data.error;
    err.style.display = 'block';
  }
}

async function handleSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const err = document.getElementById('signup-error');
  const res = await fetch('https://event-hub-zv4f.onrender.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    closeAuthModal();
    updateNavForUser(data.user);
  } else {
    err.textContent = data.error;
    err.style.display = 'block';
  }
}

function updateNavForUser(user) {
  const btn = document.getElementById('nav-login-btn');
  if (btn && user) {
    btn.innerHTML = `<i class="fa-solid fa-user"></i> ${user.name}`;
    btn.onclick = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
    };
  }
}

// Check if already logged in on page load
const savedUser = localStorage.getItem('user');
if (savedUser) updateNavForUser(JSON.parse(savedUser));

// Wire login button
const loginBtn = document.getElementById('nav-login-btn');
if (loginBtn && !localStorage.getItem('token')) {
  loginBtn.onclick = openAuthModal;
}
// Fetch events from API
async function loadEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  
  try {
    const res = await fetch('https://event-hub-zv4f.onrender.com/api/events');
    const events = await res.json();
    
    grid.innerHTML = events.map(event => {
      const cat = event.category?.toLowerCase() || 'tech';
      const date = new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      // Only override the category's background image if the event actually has one —
      // otherwise an empty/missing image_url was blanking out the ${cat}-bg fallback.
      const imgStyle = event.image_url
        ? `style="background-image: url('${event.image_url}'); background-size: cover; background-position: center;"`
        : '';
      return `
        <div class="event-card" data-category="${cat}" data-name="${event.title}">
          <div class="event-image ${cat}-bg" ${imgStyle}>
            <span class="event-category">${event.category}</span>
            <button class="bookmark-btn" aria-label="Bookmark"><i class="fa-regular fa-bookmark"></i></button>
          </div>
          <div class="event-info">
            <span class="event-date"><i class="fa-solid fa-calendar"></i> ${date}</span>
            <h3>${event.title}</h3>
            <p><i class="fa-solid fa-location-dot"></i> ${event.location}</p>
            <a href="event-details.html?id=${event.id}" class="event-btn">View Details <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      `;
    }).join('');

    // Re-run filter after loading
    if (typeof filterEvents === 'function') filterEvents();
  } catch (err) {
    console.error('Failed to load events:', err);
  }
}

loadEvents();
/* =============================================
   EventHub – script.js  (complete)
   ============================================= */

/* ============================================
   AUTH STATE  (persisted in sessionStorage)
   ============================================ */
const AVATARS = ['🦊','🐼','🦁','🐸','🐙','🦋','🐬','🦄','🐯','🤖'];

const Auth = {
  get() {
    try { return JSON.parse(sessionStorage.getItem('eh_user')) || null; } catch { return null; }
  },
  save(data) { sessionStorage.setItem('eh_user', JSON.stringify(data)); },
  clear()    { sessionStorage.removeItem('eh_user'); }
};

/* derive initials from email or name */
function getInitials(emailOrName) {
  const str = (emailOrName || '').trim();
  // strip domain if email
  const local = str.includes('@') ? str.split('@')[0] : str;
  // split on dots, underscores, spaces, hyphens
  const parts = local.split(/[\s._\-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0] || '?')[0].toUpperCase();
}

/* ============================================
   MODAL BUILDER  (replaces static HTML)
   ============================================ */
function buildModal() {
  const overlay = document.getElementById('login-modal');
  if (!overlay) return;

  overlay.innerHTML = `
    <div class="modal-box" id="modal-box">
      <button class="modal-close" id="modal-close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <!-- ── SIGN-IN PANEL ── -->
      <div class="modal-panel" id="panel-signin">
        <div class="modal-logo"><i class="fa-solid fa-calendar-days"></i> EventHub</div>
        <h2 class="modal-title">Welcome back</h2>
        <p class="modal-sub">Sign in to manage your events</p>

        <div class="modal-input-group" id="signin-email-wrap">
          <i class="fa-solid fa-envelope"></i>
          <input type="email" id="signin-email" placeholder="Email address" autocomplete="email">
        </div>
        <span class="modal-field-error" id="signin-email-err"></span>

        <div class="modal-input-group" id="signin-pass-wrap">
          <i class="fa-solid fa-lock"></i>
          <input type="password" id="signin-password" placeholder="Password" autocomplete="current-password">
          <button class="modal-eye" id="signin-eye" type="button" aria-label="Show password">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <span class="modal-field-error" id="signin-pass-err"></span>

        <button class="modal-btn" id="signin-btn">Sign In</button>
        <p class="modal-switch">Don't have an account?
          <a href="#" id="go-signup">Sign up</a>
        </p>
      </div>

      <!-- ── SIGN-UP PANEL ── -->
      <div class="modal-panel hidden" id="panel-signup">
        <div class="modal-logo"><i class="fa-solid fa-calendar-days"></i> EventHub</div>
        <h2 class="modal-title">Create account</h2>
        <p class="modal-sub">Join EventHub and start discovering events</p>

        <div class="modal-input-group" id="signup-name-wrap">
          <i class="fa-solid fa-user"></i>
          <input type="text" id="signup-name" placeholder="Full name" autocomplete="name">
        </div>
        <span class="modal-field-error" id="signup-name-err"></span>

        <div class="modal-input-group" id="signup-email-wrap">
          <i class="fa-solid fa-envelope"></i>
          <input type="email" id="signup-email" placeholder="Email address" autocomplete="email">
        </div>
        <span class="modal-field-error" id="signup-email-err"></span>

        <div class="modal-input-group" id="signup-pass-wrap">
          <i class="fa-solid fa-lock"></i>
          <input type="password" id="signup-password" placeholder="Password (min 6 chars)" autocomplete="new-password">
          <button class="modal-eye" id="signup-eye" type="button" aria-label="Show password">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <span class="modal-field-error" id="signup-pass-err"></span>

        <!-- Avatar picker -->
        <p class="modal-avatar-label">Pick an avatar <span class="modal-avatar-optional">(optional)</span></p>
        <div class="modal-avatar-grid" id="avatar-grid">
          ${AVATARS.map((a,i) => `
            <button class="avatar-chip" data-avatar="${a}" type="button" aria-label="Avatar ${a}">${a}</button>
          `).join('')}
        </div>

        <button class="modal-btn" id="signup-btn">Create Account</button>
        <p class="modal-switch">Already have an account?
          <a href="#" id="go-signin">Sign in</a>
        </p>
      </div>

      <!-- ── AVATAR CONFIRM PANEL (after sign-in with no saved avatar) ── -->
      <div class="modal-panel hidden" id="panel-avatar">
        <div class="modal-logo"><i class="fa-solid fa-calendar-days"></i> EventHub</div>
        <h2 class="modal-title">Choose your avatar</h2>
        <p class="modal-sub">Pick one to personalise your profile</p>
        <div class="modal-avatar-grid modal-avatar-grid--large" id="avatar-grid-2">
          ${AVATARS.map(a => `
            <button class="avatar-chip" data-avatar="${a}" type="button" aria-label="Avatar ${a}">${a}</button>
          `).join('')}
        </div>
        <button class="modal-btn" id="avatar-skip-btn">Skip for now</button>
      </div>
    </div>
  `;

  /* wire up panels */
  wireModal();
}

/* ============================================
   WIRE MODAL INTERACTIONS
   ============================================ */
function wireModal() {
  const overlay = document.getElementById('login-modal');

  const show = id => {
    overlay.querySelectorAll('.modal-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
  };

  /* close */
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  /* panel switches */
  document.getElementById('go-signup')?.addEventListener('click', e => { e.preventDefault(); show('panel-signup'); });
  document.getElementById('go-signin')?.addEventListener('click', e => { e.preventDefault(); show('panel-signin'); });

  /* password toggles */
  makeEye('signin-eye',  'signin-password');
  makeEye('signup-eye',  'signup-password');

  /* avatar chips – signup panel */
  document.getElementById('avatar-grid')?.addEventListener('click', e => {
    const chip = e.target.closest('.avatar-chip');
    if (!chip) return;
    document.querySelectorAll('#avatar-grid .avatar-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });

  /* avatar chips – avatar panel */
  document.getElementById('avatar-grid-2')?.addEventListener('click', e => {
    const chip = e.target.closest('.avatar-chip');
    if (!chip) return;
    document.querySelectorAll('#avatar-grid-2 .avatar-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });

  /* SIGN IN */
  document.getElementById('signin-btn')?.addEventListener('click', () => {
    const email = document.getElementById('signin-email').value.trim();
    const pass  = document.getElementById('signin-password').value;
    let ok = true;

    clearErrors('signin-email-err', 'signin-email-wrap');
    clearErrors('signin-pass-err',  'signin-pass-wrap');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('signin-email-err', 'signin-email-wrap', 'Please enter a valid email.'); ok = false;
    }
    if (!pass) {
      showError('signin-pass-err', 'signin-pass-wrap', 'Please enter your password.'); ok = false;
    }
    if (!ok) return;

    // simulate auth — accept any valid email + non-empty password
    const initials = getInitials(email);
    Auth.save({ email, initials, avatar: null });

    // ask for avatar if signing in for first time
    const panel = document.getElementById('panel-avatar');
    panel.classList.remove('hidden');
    document.getElementById('panel-signin').classList.add('hidden');

    document.getElementById('avatar-skip-btn')?.addEventListener('click', () => {
      finishLogin();
    }, { once: true });

    document.getElementById('avatar-grid-2')?.addEventListener('click', e => {
      const chip = e.target.closest('.avatar-chip');
      if (!chip) return;
      const user = Auth.get();
      if (user) { user.avatar = chip.dataset.avatar; Auth.save(user); }
      finishLogin();
    }, { once: true });
  });

  /* enter key on sign-in */
  ['signin-email','signin-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('signin-btn')?.click();
    });
  });

  /* SIGN UP */
  document.getElementById('signup-btn')?.addEventListener('click', () => {
    const name  = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass  = document.getElementById('signup-password').value;
    const chip  = document.querySelector('#avatar-grid .avatar-chip.selected');
    let ok = true;

    ['signup-name-err','signup-email-err','signup-pass-err'].forEach(id => clearErrors(id));
    clearErrors('signup-name-err',  'signup-name-wrap');
    clearErrors('signup-email-err', 'signup-email-wrap');
    clearErrors('signup-pass-err',  'signup-pass-wrap');

    if (!name) {
      showError('signup-name-err', 'signup-name-wrap', 'Please enter your name.'); ok = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('signup-email-err', 'signup-email-wrap', 'Please enter a valid email.'); ok = false;
    }
    if (!pass || pass.length < 6) {
      showError('signup-pass-err', 'signup-pass-wrap', 'Password must be at least 6 characters.'); ok = false;
    }
    if (!ok) return;

    const initials = name ? getInitials(name) : getInitials(email);
    Auth.save({ email, name, initials, avatar: chip?.dataset.avatar || null });
    finishLogin();
  });
}

function makeEye(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const inp = document.getElementById(inputId);
    const icon = document.querySelector(`#${btnId} i`);
    if (!inp) return;
    if (inp.type === 'password') {
      inp.type = 'text';
      if (icon) icon.className = 'fa-solid fa-eye-slash';
    } else {
      inp.type = 'password';
      if (icon) icon.className = 'fa-solid fa-eye';
    }
  });
}

function showError(errId, wrapId, msg) {
  const el = document.getElementById(errId);
  const wrap = document.getElementById(wrapId);
  if (el)   { el.textContent = msg; el.style.display = 'block'; }
  if (wrap) wrap.classList.add('error');
}

function clearErrors(errId, wrapId) {
  const el = document.getElementById(errId);
  const wrap = document.getElementById(wrapId);
  if (el)   { el.textContent = ''; el.style.display = 'none'; }
  if (wrap) wrap.classList.remove('error');
}

/* ============================================
   LOGIN / LOGOUT UI
   ============================================ */
function finishLogin() {
  closeModal();
  renderNavUser();
}

function closeModal() {
  document.getElementById('login-modal')?.classList.remove('open');
}

function openModal() {
  buildModal();
  document.getElementById('login-modal')?.classList.add('open');
  document.getElementById('notif-dropdown')?.classList.remove('open');
  document.getElementById('user-menu')?.classList.remove('open');
}

/* render the avatar/initials button in the navbar */
function renderNavUser() {
  const user = Auth.get();
  const btn  = document.getElementById('nav-login-btn');
  if (!btn) return;

  if (user) {
    if (user.avatar) {
      btn.innerHTML = `<span class="nav-avatar nav-avatar--emoji">${user.avatar}</span>
                       <span class="nav-avatar-name">${user.initials}</span>
                       <i class="fa-solid fa-chevron-down nav-avatar-caret"></i>`;
    } else {
      btn.innerHTML = `<span class="nav-avatar nav-avatar--initials">${user.initials}</span>
                       <span class="nav-avatar-name">${user.initials}</span>
                       <i class="fa-solid fa-chevron-down nav-avatar-caret"></i>`;
    }
    btn.classList.add('logged-in');
    btn.removeEventListener('click', openModal);
    btn.onclick = toggleUserMenu;
    ensureUserMenu(user);
  } else {
    btn.innerHTML = `<i class="fa-solid fa-user"></i> Login`;
    btn.classList.remove('logged-in');
    btn.onclick = null;
    btn.addEventListener('click', openModal);
    removeUserMenu();
  }
}

/* user dropdown menu */
function ensureUserMenu(user) {
  let menu = document.getElementById('user-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'user-menu';
    menu.className = 'user-menu';
    document.body.appendChild(menu);
  }

  const display = user.name || user.email;
  const avatarHTML = user.avatar
    ? `<span class="um-avatar um-avatar--emoji">${user.avatar}</span>`
    : `<span class="um-avatar um-avatar--initials">${user.initials}</span>`;

  menu.innerHTML = `
    <div class="um-profile">
      ${avatarHTML}
      <div class="um-info">
        <span class="um-name">${display}</span>
        <span class="um-email">${user.email}</span>
      </div>
    </div>
    <div class="um-divider"></div>
    <a href="dashboard.html" class="um-item"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
    <a href="my-events.html" class="um-item"><i class="fa-solid fa-calendar-check"></i> My Events</a>
    <button class="um-item um-item--avatar" id="um-change-avatar">
      <i class="fa-solid fa-face-smile"></i> Change Avatar
    </button>
    <div class="um-divider"></div>
    <button class="um-item um-item--logout" id="um-logout">
      <i class="fa-solid fa-right-from-bracket"></i> Sign Out
    </button>
  `;

  document.getElementById('um-logout')?.addEventListener('click', () => {
    Auth.clear();
    menu.classList.remove('open');
    renderNavUser();
  });

  document.getElementById('um-change-avatar')?.addEventListener('click', () => {
    menu.classList.remove('open');
    openAvatarPicker();
  });
}

function removeUserMenu() {
  document.getElementById('user-menu')?.remove();
}

function toggleUserMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('user-menu');
  if (!menu) return;
  menu.classList.toggle('open');
  document.getElementById('notif-dropdown')?.classList.remove('open');

  // position below the login button
  const btn  = document.getElementById('nav-login-btn');
  if (btn && menu) {
    const rect = btn.getBoundingClientRect();
    menu.style.top   = (rect.bottom + 8) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
  }
}

/* avatar picker (standalone) */
function openAvatarPicker() {
  const overlay = document.getElementById('login-modal');
  if (!overlay) return;

  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" id="modal-close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="modal-logo"><i class="fa-solid fa-calendar-days"></i> EventHub</div>
      <h2 class="modal-title">Change Avatar</h2>
      <p class="modal-sub">Pick a new emoji to represent you</p>
      <div class="modal-avatar-grid modal-avatar-grid--large" id="avatar-picker-grid">
        ${AVATARS.map(a => {
          const user = Auth.get();
          const sel  = user?.avatar === a ? 'selected' : '';
          return `<button class="avatar-chip ${sel}" data-avatar="${a}" type="button">${a}</button>`;
        }).join('')}
      </div>
      <button class="modal-btn" id="save-avatar-btn">Save</button>
    </div>
  `;

  overlay.classList.add('open');

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.getElementById('avatar-picker-grid')?.addEventListener('click', e => {
    const chip = e.target.closest('.avatar-chip');
    if (!chip) return;
    document.querySelectorAll('#avatar-picker-grid .avatar-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });

  document.getElementById('save-avatar-btn')?.addEventListener('click', () => {
    const chip = document.querySelector('#avatar-picker-grid .avatar-chip.selected');
    const user = Auth.get();
    if (user && chip) { user.avatar = chip.dataset.avatar; Auth.save(user); }
    closeModal();
    renderNavUser();
    ensureUserMenu(Auth.get());
  });
}

/* ============================================
   LOADER
   ============================================ */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    const fill = document.querySelector('.loader-fill');
    if (fill) fill.style.width = '100%';
    setTimeout(() => loader.classList.add('hidden'), 1200);
  }
});

/* ============================================
   SCROLL: progress bar + navbar + back-to-top
   ============================================ */
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct       = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  const bar = document.getElementById('scroll-progress');
  if (bar) bar.style.width = pct + '%';

  document.getElementById('navbar')?.classList.toggle('scrolled', scrollTop > 50);

  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('show', scrollTop > 300);
});

document.getElementById('backToTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================
   THEME TOGGLE
   ============================================ */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
let isDark = true;
themeToggle?.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (themeIcon) themeIcon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
});

/* ============================================
   HAMBURGER / MOBILE MENU
   ============================================ */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
});
hamburger?.addEventListener('keydown', e => { if (e.key === 'Enter') hamburger.click(); });
document.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  });
});

/* ============================================
   NOTIFICATION DROPDOWN
   ============================================ */
const navBell       = document.getElementById('nav-bell');
const notifDropdown = document.getElementById('notif-dropdown');
const bellBadge     = document.querySelector('.bell-badge');

navBell?.addEventListener('click', e => {
  e.stopPropagation();
  notifDropdown?.classList.toggle('open');
  document.getElementById('login-modal')?.classList.remove('open');
  document.getElementById('user-menu')?.classList.remove('open');
});

document.querySelector('.notif-clear')?.addEventListener('click', () => {
  document.querySelectorAll('.notif-item.unread').forEach(i => i.classList.remove('unread'));
  if (bellBadge) bellBadge.style.display = 'none';
});

/* ============================================
   CLOSE DROPDOWNS ON OUTSIDE CLICK
   ============================================ */
document.addEventListener('click', () => {
  notifDropdown?.classList.remove('open');
  document.getElementById('user-menu')?.classList.remove('open');
});
notifDropdown?.addEventListener('click', e => e.stopPropagation());
document.getElementById('user-menu')?.addEventListener('click', e => e.stopPropagation());

/* ============================================
   INIT NAV LOGIN BUTTON
   ============================================ */
const navLoginBtnInit = document.getElementById('nav-login-btn');
if (navLoginBtnInit) {
  const existingUser = Auth.get();
  if (existingUser) {
    renderNavUser();
  } else {
    navLoginBtnInit.addEventListener('click', openModal);
  }
}

/* ============================================
   FADE-UP ANIMATION
   ============================================ */
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
    else entry.target.classList.remove('visible');
  });
}, { threshold: 0, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

/* ============================================
   HERO SEARCH REDIRECT
   ============================================ */
const heroSearchBtn   = document.getElementById('hero-search-btn');
const heroSearchInput = document.getElementById('hero-search-input');
if (heroSearchBtn) {
  heroSearchBtn.addEventListener('click', () => {
    const q = heroSearchInput?.value.trim() || '';
    window.location.href = `events.html?search=${encodeURIComponent(q)}`;
  });
  heroSearchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') heroSearchBtn.click();
  });
}

/* ============================================
   EVENTS PAGE: FILTER + SEARCH
   ============================================ */
const filterChips       = document.querySelectorAll('.filter-chip');
const eventsSearchInput = document.getElementById('search-input');
const noResults         = document.getElementById('no-results');
let activeCategory = 'all';

function filterEvents() {
  // Query fresh each call — cards are injected asynchronously by loadEvents(),
  // so a snapshot taken at script-load time would always be empty.
  const eventCards = document.querySelectorAll('#events-grid .event-card');
  if (!eventCards.length) return;
  const query = eventsSearchInput?.value.toLowerCase().trim() || '';
  let visible = 0;
  eventCards.forEach(card => {
    const cat    = card.getAttribute('data-category');
    const name   = (card.getAttribute('data-name') || '').toLowerCase();
    const match  = (activeCategory === 'all' || cat === activeCategory) && name.includes(query);
    card.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  noResults?.classList.toggle('show', visible === 0);
}

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.getAttribute('data-category');
    filterEvents();
  });
});

if (eventsSearchInput) {
  eventsSearchInput.addEventListener('input', filterEvents);
  const urlParams = new URLSearchParams(window.location.search);
  const sq = urlParams.get('search');
  if (sq) { eventsSearchInput.value = sq; filterEvents(); }
}

/* ============================================
   BOOKMARK BUTTONS
   ============================================ */
document.querySelectorAll('.bookmark-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const icon  = btn.querySelector('i');
    const saved = btn.classList.toggle('saved');
    if (icon) icon.className = saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
    btn.setAttribute('aria-label', saved ? 'Remove bookmark' : 'Bookmark');
  });
});

/* ============================================
   BOOKINGS  (persisted in sessionStorage)
   ============================================ */
const Bookings = {
  get()      { try { return JSON.parse(sessionStorage.getItem('eh_bookings')) || []; } catch { return []; } },
  save(list) { sessionStorage.setItem('eh_bookings', JSON.stringify(list)); },
  add(b)     {
    const list = Bookings.get();
    if (!list.find(x => x.eventName === b.eventName)) list.push(b);
    Bookings.save(list);
  },
  remove(name) { Bookings.save(Bookings.get().filter(b => b.eventName !== name)); }
};

/* ============================================
   BOOKING FORM
   ============================================ */
const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
  bookingForm.addEventListener('submit', e => {
    e.preventDefault();

    const name    = document.getElementById('booking-name')?.value.trim();
    const tickets = parseInt(document.getElementById('booking-tickets')?.value || 1);

    const eventName     = document.querySelector('.event-hero-content h1')?.textContent.trim() || 'Event';
    const eventDate     = document.querySelectorAll('.booking-detail-item span')[0]?.textContent.trim() || '';
    const eventTime     = document.querySelectorAll('.booking-detail-item span')[1]?.textContent.trim() || '';
    const eventLocation = document.querySelectorAll('.booking-detail-item span')[2]?.textContent.trim() || '';
    const eventCategory = document.querySelector('.event-category-large')?.textContent.trim() || 'Event';
    const heroCls       = document.getElementById('event-hero')?.className || '';
    const bgMatch       = heroCls.match(/tech|music|sports|workshop|art|food/);
    const eventBg       = bgMatch ? bgMatch[0] : 'tech';

    Bookings.add({ eventName, eventDate, eventTime, eventLocation, eventCategory, eventBg, tickets, bookedBy: name, bookedAt: new Date().toISOString() });

    document.getElementById('booking-success')?.classList.add('show');
    bookingForm.style.display = 'none';

    const seatsEl = document.getElementById('seats-left');
    if (seatsEl) {
      const cur = parseInt(seatsEl.textContent);
      if (!isNaN(cur)) seatsEl.textContent = `${Math.max(0, cur - tickets)} seats left`;
    }
  });
}

/* ============================================
   MY EVENTS PAGE – render booked events
   ============================================ */
const bookedGrid = document.getElementById('booked-events-grid');
const noBookings = document.getElementById('no-bookings');

if (bookedGrid !== null) {
  const bookings = Bookings.get();
  const badge    = document.getElementById('booked-badge');

  if (bookings.length === 0) {
    noBookings?.classList.add('show');
    document.getElementById('booked-events-section')?.classList.add('empty');
  } else {
    noBookings?.classList.remove('show');
    document.getElementById('booked-events-section')?.classList.remove('hidden');
    if (badge) badge.textContent = bookings.length + ' Booked';

    bookings.forEach(b => {
      const card = document.createElement('div');
      card.className = 'event-card booked-event';
      card.innerHTML = `
        <div class="event-image ${b.eventBg}-bg">
          <span class="event-category">${b.eventCategory}</span>
          <span class="host-badge booked-badge-chip">
            <i class="fa-solid fa-ticket"></i> ${b.tickets} Ticket${b.tickets > 1 ? 's' : ''}
          </span>
        </div>
        <div class="event-info">
          <span class="event-date"><i class="fa-solid fa-calendar"></i> ${b.eventDate}</span>
          <h3>${b.eventName}</h3>
          <p><i class="fa-solid fa-location-dot"></i> ${b.eventLocation}</p>
          <div class="hosted-stats">
            <span><i class="fa-solid fa-user"></i> ${b.bookedBy || 'You'}</span>
            <span><i class="fa-solid fa-ticket"></i> ${b.tickets} ticket${b.tickets > 1 ? 's' : ''}</span>
          </div>
          <button class="cancel-booking-btn" data-event="${b.eventName}">
            <i class="fa-solid fa-xmark"></i> Cancel Booking
          </button>
        </div>
      `;
      bookedGrid.appendChild(card);
    });

    bookedGrid.addEventListener('click', e => {
      const btn = e.target.closest('.cancel-booking-btn');
      if (!btn) return;
      if (!confirm('Cancel this booking?')) return;
      Bookings.remove(btn.dataset.event);
      btn.closest('.event-card')?.remove();
      const left = Bookings.get().length;
      if (badge) badge.textContent = left + ' Booked';
      if (left === 0) noBookings?.classList.add('show');
    });
  }
}

/* ============================================
   CONTACT FORM
   ============================================ */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const nameVal    = document.getElementById('contact-name')?.value.trim();
    const emailVal   = document.getElementById('contact-email')?.value.trim();
    const subjectVal = document.getElementById('contact-subject')?.value.trim();
    const messageVal = document.getElementById('contact-message')?.value.trim();
    const emailRe    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;
    const toggle = (id, show) => document.getElementById(id)?.classList.toggle('show', show);

    toggle('name-error',    !nameVal);    if (!nameVal)    valid = false;
    const badEmail = !emailVal || !emailRe.test(emailVal);
    toggle('email-error',   badEmail);   if (badEmail)    valid = false;
    toggle('subject-error', !subjectVal); if (!subjectVal) valid = false;
    toggle('message-error', !messageVal); if (!messageVal) valid = false;

    if (valid) {
      document.getElementById('contact-success')?.classList.add('show');
      contactForm.reset();
      setTimeout(() => document.getElementById('contact-success')?.classList.remove('show'), 4000);
    }
  });
}

/* ============================================
   FAQ ACCORDION
   ============================================ */
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item   = q.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ============================================
   ANIMATED COUNTERS (hero)
   ============================================ */
function animateCounters() {
  document.querySelectorAll('.hero-stat-num').forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const suffix = counter.getAttribute('data-suffix') || '';
    let cur = 0;
    const inc = target / 50;
    const run = () => {
      cur += inc;
      if (cur < target) { counter.textContent = Math.ceil(cur) + suffix; requestAnimationFrame(run); }
      else counter.textContent = target + suffix;
    };
    run();
  });
}

const heroSection = document.getElementById('hero');
if (heroSection) {
  let done = false;
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !done) { animateCounters(); done = true; }
  }, { threshold: 0.3 }).observe(heroSection);
}

/* ============================================
   HERO CAROUSEL
   ============================================ */
const slides = document.querySelectorAll('.carousel-slide');
if (slides.length) {
  let cur = 0;
  setInterval(() => {
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
  }, 3000);
}

/* ============================================
   DASHBOARD ANIMATIONS
   ============================================ */
const overviewSection = document.getElementById('overview');
if (overviewSection) {
  let done = false;
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !done) {
      done = true;
      document.querySelectorAll('.overview-value').forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        const isDec  = el.getAttribute('data-decimal') === 'true';
        let cur = 0; const inc = target / 50;
        const run = () => {
          cur += inc;
          if (cur < target) { el.textContent = isDec ? cur.toFixed(1) : Math.ceil(cur); requestAnimationFrame(run); }
          else el.textContent = isDec ? target.toFixed(1) : target;
        };
        run();
      });
      document.querySelectorAll('.bar-fill').forEach(bar => {
        const w = bar.getAttribute('data-width');
        setTimeout(() => { bar.style.width = w + '%'; }, 200);
      });
    }
  }, { threshold: 0.2 }).observe(overviewSection);
}
// EVENT DETAILS PAGE - Load event from API and wire RSVP
async function loadEventDetails() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  if (!eventId) return;

  try {
    const res = await fetch(`https://event-hub-zv4f.onrender.com/api/events/${eventId}`);
    const event = await res.json();

    // Update page with real event data
    const title = document.querySelector('.event-hero-content h1') || document.querySelector('.event-title');
    const date = document.querySelectorAll('.booking-detail-item')[0];
    const time = document.querySelectorAll('.booking-detail-item')[1];
    const location = document.querySelectorAll('.booking-detail-item')[2];
    const categoryBadge = document.querySelector('.event-category-large');
    const heroSection = document.getElementById('event-hero');

    if (title) title.textContent = event.title;
    if (date) date.innerHTML = `<i class="fa-solid fa-calendar"></i> ${new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    if (time) time.innerHTML = `<i class="fa-solid fa-clock"></i> ${event.time}`;
    if (location) location.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${event.location}`;

    // Update the category badge + hero background to match the real event
    // (previously these stayed hardcoded to "Tech" / tech-bg-large no matter
    // which event was opened, so every booking got saved as a Tech event)
    const validCats = ['tech', 'music', 'sports', 'workshop', 'art', 'food'];
    const cat = validCats.includes(event.category?.toLowerCase()) ? event.category.toLowerCase() : 'tech';
    if (categoryBadge) categoryBadge.textContent = event.category || 'Tech';
    if (heroSection) {
      heroSection.className = heroSection.className.replace(/\b(tech|music|sports|workshop|art|food)-bg-large\b/, '').trim();
      heroSection.classList.add(`${cat}-bg-large`);
    }

    // Wire RSVP button
    const rsvpBtn = document.getElementById('rsvp-btn');
    if (rsvpBtn) {
      rsvpBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login first to RSVP!');
          return;
        }
        const r = await fetch(`https://event-hub-zv4f.onrender.com/api/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await r.json();
        if (data.message) {
          document.getElementById('booking-success')?.classList.add('show');
          rsvpBtn.textContent = '✓ RSVPd!';
          rsvpBtn.disabled = true;
        } else {
          alert(data.error || 'Already RSVPd to this event!');
        }
      });
    }
  } catch (err) {
    console.error('Failed to load event details:', err);
  }
}

loadEventDetails();