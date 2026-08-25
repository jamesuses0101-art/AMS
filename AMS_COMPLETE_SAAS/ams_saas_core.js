// ==================================================
// AMS MULTI-TENANT SAAS - COMPLETE SYSTEM
// Super Admin + Academy Owner + Staff + Public Payment
// ==================================================

// ==================================================
// 1. DATABASE SCHEMA (Supabase Tables)
// ==================================================
/*
-- Table: academies
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free', -- free, basic, premium
  status TEXT DEFAULT 'active', -- active, suspended
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: academy_staff
CREATE TABLE academy_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'teacher', -- owner, admin, teacher
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  name TEXT NOT NULL,
  guardian TEXT,
  phone TEXT,
  email TEXT,
  class TEXT,
  monthly_fee INTEGER DEFAULT 0,
  admission_date DATE,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  name TEXT NOT NULL,
  subject TEXT,
  teacher_name TEXT,
  monthly_fee INTEGER DEFAULT 0,
  schedule TEXT,
  status TEXT DEFAULT 'active'
);

-- Table: fees
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  student_id UUID REFERENCES students(id),
  student_name TEXT,
  class TEXT,
  month TEXT,
  year INTEGER,
  amount INTEGER,
  paid_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, partial, paid
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  student_id UUID REFERENCES students(id),
  student_name TEXT,
  class TEXT,
  amount INTEGER,
  month TEXT,
  year INTEGER,
  payment_date TIMESTAMP,
  method TEXT, -- bank, jazzcash, easypaisa
  transaction_id TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  student_id UUID REFERENCES students(id),
  student_name TEXT,
  class TEXT,
  date DATE,
  status TEXT, -- present, absent, leave
  notes TEXT
);

-- Table: expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  title TEXT,
  category TEXT,
  amount INTEGER,
  expense_date DATE,
  notes TEXT
);

-- Table: notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  user_id UUID REFERENCES auth.users(id),
  type TEXT, -- info, success, warning, error
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
*/

// ==================================================
// 2. SUPABASE CLIENT SETUP
// ==================================================
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

let supabase = null;

function initSupabase() {
  if (typeof supabaseJs !== 'undefined') {
    supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
}

// ==================================================
// 3. AUTH SYSTEM (Real with Supabase)
// ==================================================
const Auth = {
  user: null,
  session: null,
  role: null, // super_admin, owner, staff
  academyId: null,

  async init() {
    if (!supabase) initSupabase();

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.session = session;
      this.user = session.user;
      await this.loadUserRole();
    }
  },

  async loadUserRole() {
    if (!this.user) return;

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', this.user.id)
      .single();

    if (superAdmin) {
      this.role = 'super_admin';
      return;
    }

    // Check academy ownership
    const { data: academy } = await supabase
      .from('academies')
      .select('*')
      .eq('owner_id', this.user.id)
      .single();

    if (academy) {
      this.role = 'owner';
      this.academyId = academy.id;
      return;
    }

    // Check staff role
    const { data: staff } = await supabase
      .from('academy_staff')
      .select('*, academies(*)')
      .eq('user_id', this.user.id)
      .single();

    if (staff) {
      this.role = staff.role;
      this.academyId = staff.academy_id;
    }
  },

  async signUp(email, password, fullName, type = 'owner') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, type }
      }
    });

    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    this.session = data.session;
    this.user = data.user;
    await this.loadUserRole();
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
    this.user = null;
    this.session = null;
    this.role = null;
    this.academyId = null;
  },

  async resendOTP(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    return !error;
  },

  isSuperAdmin() { return this.role === 'super_admin'; },
  isOwner() { return this.role === 'owner'; },
  isStaff() { return this.role === 'teacher' || this.role === 'admin'; },
  isLoggedIn() { return !!this.user; }
};

// ==================================================
// 4. SUPER ADMIN SYSTEM
// ==================================================
const SuperAdmin = {
  async getAllAcademies() {
    const { data, error } = await supabase
      .from('academies')
      .select('*, owner:owner_id(email, raw_user_meta_data)')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async getStats() {
    const { count: totalAcademies } = await supabase
      .from('academies').select('*', { count: 'exact', head: true });

    const { count: totalStudents } = await supabase
      .from('students').select('*', { count: 'exact', head: true });

    const { count: totalOwners } = await supabase
      .from('academy_staff').select('*', { count: 'exact', head: true })
      .eq('role', 'owner');

    const { data: revenue } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'approved');

    const totalRevenue = revenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return { totalAcademies, totalStudents, totalOwners, totalRevenue };
  },

  async suspendAcademy(academyId) {
    return await supabase
      .from('academies')
      .update({ status: 'suspended' })
      .eq('id', academyId);
  },

  async activateAcademy(academyId) {
    return await supabase
      .from('academies')
      .update({ status: 'active' })
      .eq('id', academyId);
  }
};

// ==================================================
// 5. ACADEMY OWNER SYSTEM
// ==================================================
const AcademyOwner = {
  async createAcademy(name, address, phone) {
    const { data, error } = await supabase
      .from('academies')
      .insert({
        name,
        owner_id: Auth.user.id,
        address,
        phone,
        plan: 'free'
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as staff
    await supabase.from('academy_staff').insert({
      academy_id: data.id,
      user_id: Auth.user.id,
      role: 'owner',
      permissions: { all: true }
    });

    return data;
  },

  async getMyAcademy() {
    const { data, error } = await supabase
      .from('academies')
      .select('*')
      .eq('owner_id', Auth.user.id)
      .single();

    return { data, error };
  },

  async addStaff(email, fullName, role = 'teacher') {
    // Create user if not exists
    const tempPassword = Math.random().toString(36).slice(-8);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (userError) {
      // User might exist, try to get them
      const { data: existing } = await supabase
        .from('academy_staff')
        .select('*, user:user_id(*)')
        .eq('user.email', email)
        .single();

      if (existing) {
        await supabase.from('academy_staff').insert({
          academy_id: Auth.academyId,
          user_id: existing.user_id,
          role,
          permissions: this.getDefaultPermissions(role)
        });
        return existing;
      }
    }

    await supabase.from('academy_staff').insert({
      academy_id: Auth.academyId,
      user_id: userData.user.id,
      role,
      permissions: this.getDefaultPermissions(role)
    });

    // Send email with temp password
    await EmailService.sendStaffInvite(email, fullName, tempPassword);

    return userData;
  },

  getDefaultPermissions(role) {
    const perms = {
      owner: { all: true },
      admin: { students: true, fees: true, payments: true, attendance: true, reports: true, settings: false },
      teacher: { students: true, attendance: true, fees: false, payments: false, reports: false, settings: false }
    };
    return perms[role] || perms.teacher;
  },

  async getStaff() {
    return await supabase
      .from('academy_staff')
      .select('*, user:user_id(email, raw_user_meta_data)')
      .eq('academy_id', Auth.academyId);
  }
};

// ==================================================
// 6. EMAIL SERVICE (SendGrid)
// ==================================================
const EmailService = {
  async sendOTP(email, otp) {
    // In production, call Vercel API function
    return await fetch('/api/email/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  },

  async sendWelcome(email, name, academyName) {
    return await fetch('/api/email/welcome', {
      method: 'POST',
      body: JSON.stringify({ email, name, academyName })
    });
  },

  async sendPaymentReceipt(email, studentName, amount, month) {
    return await fetch('/api/email/receipt', {
      method: 'POST',
      body: JSON.stringify({ email, studentName, amount, month })
    });
  },

  async sendFeeReminder(email, studentName, amount, month) {
    return await fetch('/api/email/reminder', {
      method: 'POST',
      body: JSON.stringify({ email, studentName, amount, month })
    });
  },

  async sendStaffInvite(email, name, tempPassword) {
    return await fetch('/api/email/staff-invite', {
      method: 'POST',
      body: JSON.stringify({ email, name, tempPassword })
    });
  }
};

// ==================================================
// 7. PUBLIC PAYMENT SYSTEM (No Login Required)
// ==================================================
const PublicPayment = {
  async findStudent(academyId, name, phone) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('academy_id', academyId)
      .ilike('name', `%${name}%`)
      .maybeSingle();

    return { data, error };
  },

  async getPendingFees(studentId) {
    return await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['pending', 'partial'])
      .order('year', { ascending: false })
      .order('month', { ascending: false });
  },

  async submitPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        academy_id: paymentData.academyId,
        student_id: paymentData.studentId,
        student_name: paymentData.studentName,
        class: paymentData.class,
        amount: paymentData.amount,
        month: paymentData.month,
        year: paymentData.year,
        method: paymentData.method,
        transaction_id: paymentData.transactionId,
        screenshot_url: paymentData.screenshotUrl,
        notes: paymentData.notes,
        status: 'pending'
      })
      .select()
      .single();

    if (!error) {
      // Send notification to academy
      await supabase.from('notifications').insert({
        academy_id: paymentData.academyId,
        type: 'info',
        title: 'New Payment Request',
        message: `${paymentData.studentName} submitted ${formatCurrency(paymentData.amount)} via ${paymentData.method}`
      });
    }

    return { data, error };
  }
};

// ==================================================
// 8. NOTIFICATION SYSTEM (Realtime)
// ==================================================
const NotificationSystem = {
  subscription: null,

  async getUnread() {
    if (!Auth.academyId) return [];

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('academy_id', Auth.academyId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    return data || [];
  },

  subscribe(callback) {
    if (!Auth.academyId) return;

    this.subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `academy_id=eq.${Auth.academyId}`
      }, payload => {
        callback(payload.new);
      })
      .subscribe();
  },

  unsubscribe() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
  }
};

// ==================================================
// 9. SUPER ADMIN PAGES
// ==================================================

function renderSuperAdminLogin() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon">👑</div>
          <h1>Super Admin</h1>
          <p>AMS Management Portal</p>
        </div>
        <form onsubmit="handleSuperAdminLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Login as Super Admin</button>
        </form>
        <div class="auth-links">
          <a onclick="Router.navigate('login')">← Back to Academy Login</a>
        </div>
      </div>
    </div>
  `;
}

function renderSuperAdminDashboard() {
  return `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon-small">👑</div>
            <div>
              <div class="sidebar-title">Super Admin</div>
              <div class="sidebar-subtitle">AMS Control</div>
            </div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a class="sidebar-link active" onclick="showSuperAdminTab('dashboard')">
            <span class="sidebar-icon">📊</span> Dashboard
          </a>
          <a class="sidebar-link" onclick="showSuperAdminTab('academies')">
            <span class="sidebar-icon">🏫</span> Academies
          </a>
          <a class="sidebar-link" onclick="showSuperAdminTab('owners')">
            <span class="sidebar-icon">👤</span> Owners
          </a>
          <a class="sidebar-link" onclick="showSuperAdminTab('plans')">
            <span class="sidebar-icon">💎</span> Plans
          </a>
          <a class="sidebar-link" onclick="showSuperAdminTab('settings')">
            <span class="sidebar-icon">⚙️</span> Settings
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-sm btn-block" onclick="handleLogout()">🚪 Logout</button>
        </div>
      </aside>
      <div class="main-content">
        <header class="topbar">
          <div class="topbar-title">Super Admin Dashboard</div>
          <div class="topbar-actions">
            <div class="user-menu">
              <button class="user-btn">
                <div class="user-avatar">👑</div>
                <span class="user-name">Super Admin</span>
              </button>
            </div>
          </div>
        </header>
        <div class="page-content" id="super-admin-content">
          ${renderSuperAdminStats()}
        </div>
      </div>
    </div>
  `;
}

function renderSuperAdminStats() {
  return `
    <div class="dashboard-page">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--blue-50);color:var(--blue)">🏫</div>
          <div class="stat-info">
            <div class="stat-value" id="sa-total-academies">...</div>
            <div class="stat-label">Total Academies</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--green-50);color:var(--green)">👨‍🎓</div>
          <div class="stat-info">
            <div class="stat-value" id="sa-total-students">...</div>
            <div class="stat-label">Total Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--purple-50);color:var(--purple)">👤</div>
          <div class="stat-info">
            <div class="stat-value" id="sa-total-owners">...</div>
            <div class="stat-label">Academy Owners</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--amber-50);color:var(--amber)">💰</div>
          <div class="stat-info">
            <div class="stat-value" id="sa-total-revenue">...</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Recent Academies</h3>
            <a style="color:var(--blue);font-size:13px;cursor:pointer" onclick="showSuperAdminTab('academies')">View All →</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>Academy</th><th>Owner</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody id="sa-recent-academies">
                <tr><td colspan="5" class="empty-state-cell"><div class="empty-state-small">Loading...</div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="card-header"><h3>Plan Distribution</h3></div>
          <div style="padding:20px" id="sa-plan-chart">
            <div class="empty-state-small">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadSuperAdminData() {
  const stats = await SuperAdmin.getStats();
  document.getElementById('sa-total-academies').textContent = stats.totalAcademies || 0;
  document.getElementById('sa-total-students').textContent = stats.totalStudents || 0;
  document.getElementById('sa-total-owners').textContent = stats.totalOwners || 0;
  document.getElementById('sa-total-revenue').textContent = formatCurrency(stats.totalRevenue);

  const { data: academies } = await SuperAdmin.getAllAcademies();
  if (academies) {
    const tbody = document.getElementById('sa-recent-academies');
    tbody.innerHTML = academies.slice(0, 5).map(a => `
      <tr>
        <td><strong>${escapeHtml(a.name)}</strong></td>
        <td>${escapeHtml(a.owner?.email || 'N/A')}</td>
        <td><span class="badge badge-${a.plan === 'premium' ? 'purple' : a.plan === 'basic' ? 'blue' : 'gray'}">${a.plan}</span></td>
        <td><span class="badge badge-${a.status === 'active' ? 'green' : 'red'}">${a.status}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="viewAcademy('${a.id}')">👁</button>
          ${a.status === 'active' 
            ? `<button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="suspendAcademy('${a.id}')">🚫</button>`
            : `<button class="btn btn-ghost btn-sm" style="color:var(--green)" onclick="activateAcademy('${a.id}')">✓</button>`
          }
        </td>
      </tr>
    `).join('');

    // Plan distribution
    const plans = { free: 0, basic: 0, premium: 0 };
    academies.forEach(a => { plans[a.plan] = (plans[a.plan] || 0) + 1; });
    document.getElementById('sa-plan-chart').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${Object.entries(plans).map(([plan, count]) => `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="text-transform:capitalize;font-weight:500">${plan}</span>
              <span style="font-weight:600">${count}</span>
            </div>
            <div style="height:8px;background:var(--gray-100);border-radius:4px;overflow:hidden">
              <div style="width:${(count / academies.length) * 100}%;height:100%;background:var(--${plan === 'premium' ? 'purple' : plan === 'basic' ? 'blue' : 'gray'}-500);border-radius:4px"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

async function handleSuperAdminLogin(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await Auth.signIn(form.email.value, form.password.value);
    if (!Auth.isSuperAdmin()) {
      Toast.show('Access denied. Not a super admin.', 'error');
      await Auth.signOut();
      return;
    }
    Toast.show('Welcome Super Admin!', 'success');
    Router.navigate('super-admin');
  } catch (err) {
    Toast.show(err.message, 'error');
  }
}

async function suspendAcademy(id) {
  if (!confirm('Suspend this academy?')) return;
  await SuperAdmin.suspendAcademy(id);
  Toast.show('Academy suspended', 'success');
  loadSuperAdminData();
}

async function activateAcademy(id) {
  await SuperAdmin.activateAcademy(id);
  Toast.show('Academy activated', 'success');
  loadSuperAdminData();
}
