// ==================================================
// AMS - Academy Management System
// Core Infrastructure + Auth + Router + Pages
// Architecture: Frontend + localStorage (replaceable with Supabase later)
// ==================================================

// ==================================================
// 1. CONFIGURATION
// ==================================================
const CONFIG = {
  APP_NAME: 'AMS',
  VERSION: '1.0.0',
  MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  EXPENSE_CATEGORIES: ['Rent','Salary','Utilities','Supplies','Marketing','Maintenance','Other'],
  PLANS: {
    free: { name: 'Free', price: 0, limit: 50 },
    basic: { name: 'Basic', price: 1500, limit: 200 },
    premium: { name: 'Premium', price: 3500, limit: 1000 }
  },
  DEMO_ACCOUNT: {
    email: 'demo@ams.com',
    password: 'demo123',
    academy: {
      name: 'Demo Academy',
      plan: 'premium',
      students: [
        { name: 'Ahmad Khan', guardian: 'Khalid Khan', phone: '+92 300 1111111', class: '10th', monthlyFee: 3500, address: 'Lahore' },
        { name: 'Fatima Ali', guardian: 'Ali Ahmed', phone: '+92 301 2222222', class: '9th', monthlyFee: 3000, address: 'Lahore' },
        { name: 'Hassan Raza', guardian: 'Raza Ahmed', phone: '+92 302 3333333', class: '10th', monthlyFee: 3500, address: 'Lahore' },
        { name: 'Ayesha Noor', guardian: 'Noor Hassan', phone: '+92 303 4444444', class: '11th', monthlyFee: 4000, address: 'Karachi' },
        { name: 'Bilal Ahmed', guardian: 'Ahmed Khan', phone: '+92 304 5555555', class: '9th', monthlyFee: 3000, address: 'Karachi' }
      ],
      classes: [
        { name: '9th', subject: 'General', teacherName: 'Sir Ali', monthlyFee: 3000, schedule: 'Mon-Fri, 4PM-6PM' },
        { name: '10th', subject: 'General', teacherName: 'Sir Bilal', monthlyFee: 3500, schedule: 'Mon-Fri, 6PM-8PM' },
        { name: '11th', subject: 'Pre-Medical', teacherName: 'Mam Sara', monthlyFee: 4000, schedule: 'Sat-Sun, 10AM-2PM' }
      ],
      teachers: [
        { name: 'Sir Ali', phone: '+92 300 9999999', subject: 'Mathematics', salary: 35000, classes: ['9th','10th'] },
        { name: 'Sir Bilal', phone: '+92 301 8888888', subject: 'Physics', salary: 40000, classes: ['10th','11th'] },
        { name: 'Mam Sara', phone: '+92 302 7777777', subject: 'Chemistry', salary: 38000, classes: ['11th'] }
      ]
    }
  }
};

// ==================================================
// 2. UTILITY FUNCTIONS
// ==================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(amount) {
  return 'Rs ' + Number(amount || 0).toLocaleString('en-PK');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ==================================================
// 3. STORAGE SYSTEM (localStorage wrapper)
// ==================================================
const Storage = {
  prefix: 'ams_',

  key(collection) {
    return this.prefix + collection;
  },

  getAll(collection) {
    try {
      const data = localStorage.getItem(this.key(collection));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Storage getAll error:', e);
      return [];
    }
  },

  getById(collection, id) {
    return this.getAll(collection).find(item => item.id === id);
  },

  save(collection, item) {
    const items = this.getAll(collection);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item, updatedAt: new Date().toISOString() };
    } else {
      items.push({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(this.key(collection), JSON.stringify(items));
    return item;
  },

  delete(collection, id) {
    const items = this.getAll(collection).filter(i => i.id !== id);
    localStorage.setItem(this.key(collection), JSON.stringify(items));
  },

  getGlobal(key) {
    try {
      const data = localStorage.getItem(this.prefix + 'global_' + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setGlobal(key, value) {
    localStorage.setItem(this.prefix + 'global_' + key, JSON.stringify(value));
  },

  clear() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) localStorage.removeItem(key);
    });
  }
};

// ==================================================
// 4. STATE MANAGEMENT
// ==================================================
const State = {
  currentUser: null,
  currentAcademy: null,

  init() {
    const session = Storage.getGlobal('session');
    if (session && session.userId) {
      const users = Storage.getAll('users');
      this.currentUser = users.find(u => u.id === session.userId);
      if (this.currentUser) {
        const academies = Storage.getAll('academies');
        this.currentAcademy = academies.find(a => a.id === this.currentUser.academyId);
      }
    }
  },

  login(user) {
    this.currentUser = user;
    const academies = Storage.getAll('academies');
    this.currentAcademy = academies.find(a => a.id === user.academyId);
    Storage.setGlobal('session', { userId: user.id, loginAt: new Date().toISOString() });
  },

  logout() {
    this.currentUser = null;
    this.currentAcademy = null;
    Storage.setGlobal('session', null);
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  getPlan() {
    return this.currentAcademy?.plan || 'free';
  },

  getStudentLimit() {
    return CONFIG.PLANS[this.getPlan()]?.limit || 50;
  },

  canAddStudent(count = 1) {
    const current = Storage.getAll('students').length;
    return current + count <= this.getStudentLimit();
  },

  getAcademyId() {
    return this.currentAcademy?.id;
  }
};

// ==================================================
// 5. TOAST NOTIFICATIONS
// ==================================================
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3000) {
    this.init();
    const colors = {
      success: 'background:#10b981;color:#fff;',
      error: 'background:#ef4444;color:#fff;',
      warning: 'background:#f59e0b;color:#fff;',
      info: 'background:#3b82f6;color:#fff;'
    };

    const el = document.createElement('div');
    el.style.cssText = colors[type] + 'padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);transform:translateX(100%);transition:transform 0.3s ease;pointer-events:auto;min-width:200px;';
    el.textContent = message;

    this.container.appendChild(el);
    requestAnimationFrame(() => el.style.transform = 'translateX(0)');

    setTimeout(() => {
      el.style.transform = 'translateX(100%)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }
};

// ==================================================
// 6. NOTIFICATIONS SYSTEM
// ==================================================
const Notifications = {
  add(type, title, message) {
    const notifs = Storage.getAll('notifications');
    notifs.unshift({
      id: generateId(),
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    });
    // Keep only last 50
    if (notifs.length > 50) notifs.length = 50;
    localStorage.setItem(Storage.key('notifications'), JSON.stringify(notifs));
    this.updateBadge();
  },

  getUnread() {
    return Storage.getAll('notifications').filter(n => !n.read);
  },

  markRead(id) {
    const notifs = Storage.getAll('notifications');
    const n = notifs.find(x => x.id === id);
    if (n) { n.read = true; localStorage.setItem(Storage.key('notifications'), JSON.stringify(notifs)); }
    this.updateBadge();
  },

  markAllRead() {
    const notifs = Storage.getAll('notifications').map(n => ({ ...n, read: true }));
    localStorage.setItem(Storage.key('notifications'), JSON.stringify(notifs));
    this.updateBadge();
  },

  updateBadge() {
    const count = this.getUnread().length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

// ==================================================
// 7. ROUTER SYSTEM
// ==================================================
const Router = {
  currentRoute: 'login',

  routes: {
    public: ['login','signup','forgot'],
    protected: ['dashboard','students','classes','fees','payments','attendance','teachers','expenses','import','settings','reports']
  },

  navigate(route, params = null) {
    this.currentRoute = route;
    if (params) this.params = params;
    window.history.pushState({}, '', '#' + route);
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    if (!app) return;

    // Check auth
    const isPublic = this.routes.public.includes(this.currentRoute);
    const isProtected = this.routes.protected.includes(this.currentRoute);

    if (isProtected && !State.isLoggedIn()) {
      this.currentRoute = 'login';
    }
    if (isPublic && State.isLoggedIn() && this.currentRoute !== 'settings') {
      // Check if onboarding complete
      if (!State.currentAcademy?.onboardingComplete) {
        this.currentRoute = 'onboarding';
      } else {
        this.currentRoute = 'dashboard';
      }
    }

    // Check onboarding
    if (State.isLoggedIn() && !State.currentAcademy?.onboardingComplete && this.currentRoute !== 'onboarding') {
      this.currentRoute = 'onboarding';
    }

    // Render page
    let html = '';

    if (this.routes.public.includes(this.currentRoute)) {
      html = this.renderAuthPage();
    } else {
      html = this.renderAppShell();
    }

    app.innerHTML = html;

    // Init page-specific JS
    if (this.currentRoute === 'dashboard') initDashboard();
    if (this.currentRoute === 'students') initStudentsPage();
    if (this.currentRoute === 'classes') initClassesPage();
    if (this.currentRoute === 'fees') initFeesPage();
    if (this.currentRoute === 'payments') initPaymentsPage();
    if (this.currentRoute === 'attendance') initAttendancePage();
    if (this.currentRoute === 'teachers') initTeachersPage();
    if (this.currentRoute === 'expenses') initExpensesPage();
    if (this.currentRoute === 'reports') initReportsPage();
    if (this.currentRoute === 'settings') initSettingsPage();
    if (this.currentRoute === 'import') initImportPage();
    if (this.currentRoute === 'onboarding') initOnboarding();

    Notifications.updateBadge();
  },

  renderAuthPage() {
    if (this.currentRoute === 'login') return renderLogin();
    if (this.currentRoute === 'signup') return renderSignup();
    if (this.currentRoute === 'forgot') return renderForgot();
    return renderLogin();
  },

  renderAppShell() {
    const pageContent = this.renderPageContent();
    return `
      <div class="app-layout">
        ${renderSidebar()}
        <div class="main-content">
          ${renderTopBar()}
          <div class="page-content">
            ${pageContent}
          </div>
        </div>
      </div>
    `;
  },

  renderPageContent() {
    switch(this.currentRoute) {
      case 'dashboard': return renderDashboard();
      case 'students': return renderStudents();
      case 'classes': return renderClasses();
      case 'fees': return renderFees();
      case 'payments': return renderPayments();
      case 'attendance': return renderAttendance();
      case 'teachers': return renderTeachers();
      case 'expenses': return renderExpenses();
      case 'reports': return renderReports();
      case 'settings': return renderSettings();
      case 'import': return renderImport();
      case 'onboarding': return renderOnboarding();
      default: return renderDashboard();
    }
  }
};

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '') || 'login';
  Router.currentRoute = hash;
  Router.render();
});
