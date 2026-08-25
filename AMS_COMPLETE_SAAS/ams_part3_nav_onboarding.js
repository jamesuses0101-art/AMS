
// ==================================================
// 10. NAVIGATION COMPONENTS
// ==================================================

function renderSidebar() {
  const menuItems = [
    { route: 'dashboard', icon: '📊', label: 'Dashboard' },
    { route: 'students', icon: '👨‍🎓', label: 'Students' },
    { route: 'classes', icon: '📚', label: 'Classes' },
    { route: 'fees', icon: '💰', label: 'Fees' },
    { route: 'payments', icon: '💳', label: 'Payments' },
    { route: 'attendance', icon: '📋', label: 'Attendance' },
    { route: 'teachers', icon: '👨‍🏫', label: 'Teachers' },
    { route: 'expenses', icon: '📉', label: 'Expenses' },
    { route: 'reports', icon: '📈', label: 'Reports' },
    { route: 'import', icon: '📥', label: 'Import' },
    { route: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  const academyName = State.currentAcademy?.name || 'My Academy';
  const planName = CONFIG.PLANS[State.getPlan()]?.name || 'Free';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon-small">📚</div>
          <div>
            <div class="sidebar-title">AMS</div>
            <div class="sidebar-subtitle">${escapeHtml(academyName)}</div>
          </div>
        </div>
        <button class="sidebar-close" onclick="toggleSidebar()">✕</button>
      </div>

      <nav class="sidebar-nav">
        ${menuItems.map(item => `
          <a class="sidebar-link ${Router.currentRoute === item.route ? 'active' : ''}" 
             onclick="Router.navigate('${item.route}')">
            <span class="sidebar-icon">${item.icon}</span>
            <span class="sidebar-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="plan-badge">${planName} Plan</div>
        <button class="btn btn-ghost btn-sm btn-block" onclick="handleLogout()">
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>

    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
  `;
}

function renderTopBar() {
  const unreadCount = Notifications.getUnread().length;
  const userName = State.currentUser?.fullName || 'User';

  return `
    <header class="topbar">
      <button class="menu-toggle" onclick="toggleSidebar()">
        <span></span><span></span><span></span>
      </button>

      <div class="topbar-title">
        ${getPageTitle()}
      </div>

      <div class="topbar-actions">
        <button class="topbar-btn" onclick="toggleNotifications()">
          🔔
          <span class="notif-badge" id="notif-badge" style="display:${unreadCount > 0 ? 'flex' : 'none'}">${unreadCount}</span>
        </button>
        <div class="user-menu">
          <button class="user-btn" onclick="toggleUserMenu()">
            <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
            <span class="user-name">${escapeHtml(userName)}</span>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <a onclick="Router.navigate('settings')">⚙️ Settings</a>
            <a onclick="handleLogout()">🚪 Logout</a>
          </div>
        </div>
      </div>
    </header>

    <div class="notifications-panel" id="notifications-panel">
      <div class="notif-header">
        <h4>Notifications</h4>
        <button class="btn btn-ghost btn-sm" onclick="Notifications.markAllRead();toggleNotifications()">Mark all read</button>
      </div>
      <div class="notif-list">
        ${renderNotificationsList()}
      </div>
    </div>
  `;
}

function getPageTitle() {
  const titles = {
    dashboard: 'Dashboard',
    students: 'Students',
    classes: 'Classes',
    fees: 'Fee Management',
    payments: 'Payments',
    attendance: 'Attendance',
    teachers: 'Teachers',
    expenses: 'Expenses',
    reports: 'Reports',
    import: 'Import Students',
    settings: 'Settings',
    onboarding: 'Welcome'
  };
  return titles[Router.currentRoute] || 'AMS';
}

function renderNotificationsList() {
  const notifs = Storage.getAll('notifications').slice(0, 10);
  if (notifs.length === 0) {
    return '<div class="empty-state-small">No notifications yet</div>';
  }
  return notifs.map(n => `
    <div class="notif-item ${n.read ? 'read' : 'unread'}" onclick="Notifications.markRead('${n.id}')">
      <div class="notif-icon ${n.type}">${getNotifIcon(n.type)}</div>
      <div class="notif-content">
        <div class="notif-title">${escapeHtml(n.title)}</div>
        <div class="notif-message">${escapeHtml(n.message)}</div>
        <div class="notif-time">${formatDateTime(n.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

function getNotifIcon(type) {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  return icons[type] || '•';
}

// ==================================================
// 11. UI TOGGLE FUNCTIONS
// ==================================================

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

function toggleNotifications() {
  const panel = document.getElementById('notifications-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    Notifications.updateBadge();
  }
}

function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('open');
  }
  if (!e.target.closest('.topbar-actions')) {
    const panel = document.getElementById('notifications-panel');
    if (panel) panel.classList.remove('open');
  }
});

// ==================================================
// 12. ONBOARDING SYSTEM
// ==================================================

function renderOnboarding() {
  return `
    <div class="onboarding-page">
      <div class="onboarding-card">
        <div class="onboarding-header">
          <div class="logo-icon">🎉</div>
          <h1>Welcome to AMS!</h1>
          <p>Let's set up your academy in a few simple steps</p>
        </div>

        <div class="onboarding-steps">
          <div class="step active" data-step="1">
            <div class="step-number">1</div>
            <div class="step-label">Classes</div>
          </div>
          <div class="step-line"></div>
          <div class="step" data-step="2">
            <div class="step-number">2</div>
            <div class="step-label">Students</div>
          </div>
          <div class="step-line"></div>
          <div class="step" data-step="3">
            <div class="step-number">3</div>
            <div class="step-label">Complete</div>
          </div>
        </div>

        <div class="onboarding-content" id="onboarding-content">
          ${renderOnboardingStep1()}
        </div>
      </div>
    </div>
  `;
}

let onboardingStep = 1;

function renderOnboardingStep1() {
  const classes = Storage.getAll('classes');
  return `
    <div class="onboarding-step-content">
      <h3>Add Your Classes</h3>
      <p style="color:var(--gray-500);margin-bottom:20px">Add the classes/courses you offer</p>

      <form onsubmit="handleOnboardingAddClass(event)">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Class Name *</label>
            <input type="text" class="form-input" name="name" placeholder="e.g. 10th" required>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Fee (Rs)</label>
            <input type="number" class="form-input" name="monthlyFee" value="3000">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <input type="text" class="form-input" name="subject" placeholder="e.g. Physics">
        </div>
        <button type="submit" class="btn btn-secondary">+ Add Class</button>
      </form>

      <div class="onboarding-list" style="margin-top:20px">
        ${classes.length === 0 ? '<p style="color:var(--gray-400);font-size:13px">No classes added yet</p>' : 
          classes.map(c => `
            <div class="onboarding-item">
              <div>
                <strong>${escapeHtml(c.name)}</strong>
                <span style="color:var(--gray-500);font-size:13px"> — ${formatCurrency(c.monthlyFee)}</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="deleteOnboardingClass('${c.id}')">🗑</button>
            </div>
          `).join('')}
      </div>

      <div class="onboarding-actions">
        <button class="btn btn-ghost" onclick="skipOnboarding()">Skip for now</button>
        <button class="btn btn-primary" onclick="nextOnboardingStep()" ${classes.length === 0 ? 'disabled' : ''}>Continue →</button>
      </div>
    </div>
  `;
}

function renderOnboardingStep2() {
  return `
    <div class="onboarding-step-content">
      <h3>Add Students</h3>
      <p style="color:var(--gray-500);margin-bottom:20px">Add your first students or skip to dashboard</p>

      <div style="display:grid;gap:12px;margin-bottom:20px">
        <button class="btn btn-secondary" onclick="openModal('addStudent'); onboardingStep=2;">
          <span>👤</span> Add Student Manually
        </button>
        <button class="btn btn-secondary" onclick="Router.navigate('import'); completeOnboarding();">
          <span>📥</span> Import from Excel/CSV
        </button>
      </div>

      <div class="onboarding-actions">
        <button class="btn btn-ghost" onclick="prevOnboardingStep()">← Back</button>
        <button class="btn btn-primary" onclick="completeOnboarding()">Go to Dashboard</button>
      </div>
    </div>
  `;
}

function renderOnboardingStep3() {
  return `
    <div class="onboarding-step-content" style="text-align:center">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--green-50);color:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px">
        ✓
      </div>
      <h3>You're All Set!</h3>
      <p style="color:var(--gray-500);margin-bottom:24px">Your academy is ready to use</p>
      <button class="btn btn-primary btn-block" onclick="Router.navigate('dashboard')">Go to Dashboard</button>
    </div>
  `;
}

function handleOnboardingAddClass(e) {
  e.preventDefault();
  const form = e.target;
  Storage.save('classes', {
    id: generateId(),
    academyId: State.getAcademyId(),
    name: form.name.value.trim(),
    subject: form.subject.value.trim() || '',
    monthlyFee: Number(form.monthlyFee.value) || 3000,
    teacherName: '',
    schedule: '',
    status: 'active'
  });
  form.reset();
  document.getElementById('onboarding-content').innerHTML = renderOnboardingStep1();
  Toast.show('Class added', 'success');
}

function deleteOnboardingClass(id) {
  Storage.delete('classes', id);
  document.getElementById('onboarding-content').innerHTML = renderOnboardingStep1();
}

function nextOnboardingStep() {
  onboardingStep = 2;
  document.querySelector('.step[data-step="2"]').classList.add('active');
  document.getElementById('onboarding-content').innerHTML = renderOnboardingStep2();
}

function prevOnboardingStep() {
  onboardingStep = 1;
  document.querySelector('.step[data-step="2"]').classList.remove('active');
  document.getElementById('onboarding-content').innerHTML = renderOnboardingStep1();
}

function skipOnboarding() {
  completeOnboarding();
}

function completeOnboarding() {
  const academy = State.currentAcademy;
  if (academy) {
    academy.onboardingComplete = true;
    const academies = Storage.getAll('academies');
    const idx = academies.findIndex(a => a.id === academy.id);
    if (idx >= 0) academies[idx] = academy;
    Storage.setGlobal('academies', academies);
    State.currentAcademy = academy;
  }
  Toast.show('Setup complete!', 'success');
  Router.navigate('dashboard');
}

function initOnboarding() {
  onboardingStep = 1;
}
