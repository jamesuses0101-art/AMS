
// ==================================================
// 10. PUBLIC PAYMENT PAGE (No Login Required)
// ==================================================

function renderPublicPayment(academyId = null) {
  return `
    <div class="public-page">
      <div class="public-header">
        <div class="public-logo">📚</div>
        <h1>Fee Payment</h1>
        <p>Pay your academy fees securely</p>
      </div>

      <div class="public-card">
        <div class="card-header"><h3>Find Your Fee</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Academy Code *</label>
            <input type="text" class="form-input" id="public-academy-code" placeholder="Enter academy code (e.g., AMS001)">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Student Name *</label>
              <input type="text" class="form-input" id="public-student-name" placeholder="Your full name">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" class="form-input" id="public-student-phone" placeholder="03XX-XXXXXXX">
            </div>
          </div>
          <button class="btn btn-primary btn-block" onclick="findPublicStudent()">Find My Fee</button>
        </div>
      </div>

      <div id="public-fee-result" style="display:none">
        <!-- Fee details will load here -->
      </div>

      <div class="public-footer">
        <p>Powered by <strong>AMS</strong> - Academy Management System</p>
        <p style="font-size:12px;color:var(--gray-400)">Secure & Reliable</p>
      </div>
    </div>
  `;
}

async function findPublicStudent() {
  const academyCode = document.getElementById('public-academy-code').value.trim();
  const studentName = document.getElementById('public-student-name').value.trim();
  const studentPhone = document.getElementById('public-student-phone').value.trim();

  if (!academyCode || !studentName || !studentPhone) {
    Toast.show('Please fill all fields', 'warning');
    return;
  }

  // Find academy by code
  const { data: academy } = await supabase
    .from('academies')
    .select('id, name, status')
    .eq('id', academyCode)
    .single();

  if (!academy || academy.status !== 'active') {
    Toast.show('Academy not found or inactive', 'error');
    return;
  }

  // Find student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('academy_id', academy.id)
    .ilike('name', `%${studentName}%`)
    .eq('phone', studentPhone)
    .maybeSingle();

  if (!student) {
    Toast.show('Student not found. Please check your details.', 'error');
    return;
  }

  // Get pending fees
  const { data: fees } = await PublicPayment.getPendingFees(student.id);

  const resultDiv = document.getElementById('public-fee-result');
  resultDiv.style.display = 'block';

  if (!fees || fees.length === 0) {
    resultDiv.innerHTML = `
      <div class="public-card" style="margin-top:16px">
        <div class="card-body" style="text-align:center">
          <div style="font-size:48px;margin-bottom:12px">🎉</div>
          <h3>All Fees Paid!</h3>
          <p style="color:var(--gray-500)">You have no pending fees.</p>
        </div>
      </div>
    `;
    return;
  }

  const totalDue = fees.reduce((sum, f) => sum + ((f.amount || 0) - (f.paid_amount || 0)), 0);

  resultDiv.innerHTML = `
    <div class="public-card" style="margin-top:16px">
      <div class="card-header">
        <h3>Fee Details - ${escapeHtml(student.name)}</h3>
        <span class="badge badge-blue">${escapeHtml(student.class)}</span>
      </div>
      <div class="card-body">
        <div style="margin-bottom:20px">
          ${fees.map(f => {
            const balance = (f.amount || 0) - (f.paid_amount || 0);
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--gray-100)">
                <div>
                  <div style="font-weight:600">${f.month} ${f.year}</div>
                  <div style="font-size:12px;color:var(--gray-500)">Status: <span class="badge badge-${f.status === 'pending' ? 'red' : 'amber'}">${f.status}</span></div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700;color:var(--navy)">${formatCurrency(balance)}</div>
                  <div style="font-size:12px;color:var(--gray-400)">of ${formatCurrency(f.amount)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--blue-50);border-radius:var(--radius);margin-bottom:20px">
          <span style="font-weight:600">Total Due:</span>
          <span style="font-size:24px;font-weight:700;color:var(--navy)">${formatCurrency(totalDue)}</span>
        </div>

        <button class="btn btn-primary btn-block" onclick="showPaymentMethods('${academy.id}', '${student.id}', '${student.name}', '${student.class}', ${totalDue})">
          💳 Proceed to Payment
        </button>
      </div>
    </div>
  `;
}

function showPaymentMethods(academyId, studentId, studentName, studentClass, amount) {
  const resultDiv = document.getElementById('public-fee-result');

  resultDiv.innerHTML = `
    <div class="public-card" style="margin-top:16px">
      <div class="card-header">
        <h3>Choose Payment Method</h3>
        <span class="badge badge-blue">${formatCurrency(amount)}</span>
      </div>
      <div class="card-body">
        <div class="payment-methods">
          <div class="payment-method-card" onclick="showBankDetails('${academyId}', '${studentId}', '${studentName}', '${studentClass}', ${amount}, 'bank')">
            <div class="payment-method-header">
              <div class="payment-icon">🏦</div>
              <div><h4>Bank Transfer</h4><p style="font-size:13px;color:var(--gray-500)">Dubai Islamic Bank</p></div>
              <div class="payment-radio">→</div>
            </div>
          </div>

          <div class="payment-method-card" onclick="showBankDetails('${academyId}', '${studentId}', '${studentName}', '${studentClass}', ${amount}, 'jazzcash')">
            <div class="payment-method-header">
              <div class="payment-icon" style="background:var(--red-50);color:var(--red)">📱</div>
              <div><h4>JazzCash</h4><p style="font-size:13px;color:var(--gray-500)">Mobile Wallet</p></div>
              <div class="payment-radio">→</div>
            </div>
          </div>

          <div class="payment-method-card" onclick="showBankDetails('${academyId}', '${studentId}', '${studentName}', '${studentClass}', ${amount}, 'easypaisa')">
            <div class="payment-method-header">
              <div class="payment-icon" style="background:var(--green-50);color:var(--green)">💚</div>
              <div><h4>Easypaisa</h4><p style="font-size:13px;color:var(--gray-500)">Mobile Wallet</p></div>
              <div class="payment-radio">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function showBankDetails(academyId, studentId, studentName, studentClass, amount, method) {
  // Get academy bank details
  const { data: academy } = await supabase
    .from('academies')
    .select('bank_details')
    .eq('id', academyId)
    .single();

  const bank = academy?.bank_details || {};

  const resultDiv = document.getElementById('public-fee-result');

  let detailsHtml = '';
  if (method === 'bank') {
    detailsHtml = `
      <div class="bank-info-box">
        <div class="bank-detail-row"><span class="bank-label">Bank:</span><span class="bank-value">${escapeHtml(bank.bank_name || 'Dubai Islamic Bank')}</span></div>
        <div class="bank-detail-row"><span class="bank-label">Account Title:</span><span class="bank-value">${escapeHtml(bank.account_title || 'Syed Muhammad Shaheer Ullah')}</span></div>
        <div class="bank-detail-row"><span class="bank-label">Account #:</span><span class="bank-value copy-text" onclick="copyToClipboard('${escapeHtml(bank.account_number || '')}')">${escapeHtml(bank.account_number || 'N/A')} 📋</span></div>
        <div class="bank-detail-row"><span class="bank-label">IBAN:</span><span class="bank-value copy-text" onclick="copyToClipboard('${escapeHtml(bank.iban || '')}')">${escapeHtml(bank.iban || 'N/A')} 📋</span></div>
      </div>
    `;
  } else if (method === 'jazzcash') {
    detailsHtml = `
      <div class="bank-info-box">
        <div class="bank-detail-row"><span class="bank-label">JazzCash #:</span><span class="bank-value copy-text" onclick="copyToClipboard('${escapeHtml(bank.jazzcash_number || '')}')">${escapeHtml(bank.jazzcash_number || 'N/A')} 📋</span></div>
        <div class="bank-detail-row"><span class="bank-label">Account Title:</span><span class="bank-value">${escapeHtml(bank.jazzcash_title || bank.account_title || 'Syed Muhammad Shaheer Ullah')}</span></div>
      </div>
    `;
  } else {
    detailsHtml = `
      <div class="bank-info-box">
        <div class="bank-detail-row"><span class="bank-label">Easypaisa #:</span><span class="bank-value copy-text" onclick="copyToClipboard('${escapeHtml(bank.easypaisa_number || '')}')">${escapeHtml(bank.easypaisa_number || 'N/A')} 📋</span></div>
        <div class="bank-detail-row"><span class="bank-label">Account Title:</span><span class="bank-value">${escapeHtml(bank.easypaisa_title || bank.account_title || 'Syed Muhammad Shaheer Ullah')}</span></div>
      </div>
    `;
  }

  resultDiv.innerHTML = `
    <div class="public-card" style="margin-top:16px">
      <div class="card-header"><h3>Payment Details</h3></div>
      <div class="card-body">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:32px;font-weight:700;color:var(--navy)">${formatCurrency(amount)}</div>
          <div style="color:var(--gray-500)">${escapeHtml(studentName)} - ${escapeHtml(studentClass)}</div>
        </div>

        ${detailsHtml}

        <div style="margin-top:20px">
          <div class="form-group">
            <label class="form-label">Transaction ID / Reference Number *</label>
            <input type="text" class="form-input" id="public-transaction-id" placeholder="e.g., TRX123456789">
          </div>
          <div class="form-group">
            <label class="form-label">Screenshot (Optional)</label>
            <div class="upload-zone" onclick="document.getElementById('public-screenshot').click()">
              <input type="file" id="public-screenshot" style="display:none" accept="image/*" onchange="handlePublicScreenshot(this)">
              <div id="public-upload-preview" style="text-align:center">
                <div style="font-size:32px;margin-bottom:8px">📷</div>
                <p>Click to upload screenshot</p>
              </div>
            </div>
          </div>
          <button class="btn btn-primary btn-block" onclick="submitPublicPayment('${academyId}', '${studentId}', '${studentName}', '${studentClass}', ${amount}, '${method}')">
            ✅ Submit Payment
          </button>
        </div>
      </div>
    </div>
  `;
}

let publicScreenshot = null;

function handlePublicScreenshot(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    publicScreenshot = e.target.result;
    document.getElementById('public-upload-preview').innerHTML = `
      <img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:var(--radius)">
      <p style="margin-top:8px;color:var(--green)">✓ Screenshot uploaded</p>
    `;
  };
  reader.readAsDataURL(file);
}

async function submitPublicPayment(academyId, studentId, studentName, studentClass, amount, method) {
  const transactionId = document.getElementById('public-transaction-id').value.trim();

  if (!transactionId) {
    Toast.show('Please enter transaction ID', 'warning');
    return;
  }

  try {
    const { data, error } = await PublicPayment.submitPayment({
      academyId,
      studentId,
      studentName,
      class: studentClass,
      amount,
      month: CONFIG.MONTHS[new Date().getMonth()],
      year: new Date().getFullYear(),
      method,
      transactionId,
      screenshotUrl: publicScreenshot,
      notes: ''
    });

    if (error) throw error;

    document.getElementById('public-fee-result').innerHTML = `
      <div class="public-card" style="margin-top:16px">
        <div class="card-body" style="text-align:center;padding:40px">
          <div style="font-size:64px;margin-bottom:16px">✅</div>
          <h3>Payment Submitted!</h3>
          <p style="color:var(--gray-500);margin:12px 0">Your payment of <strong>${formatCurrency(amount)}</strong> has been submitted.</p>
          <p style="color:var(--gray-500)">Transaction ID: <code>${escapeHtml(transactionId)}</code></p>
          <p style="font-size:13px;color:var(--gray-400);margin-top:16px">Admin will verify and update your fee status soon.</p>
          <button class="btn btn-secondary" style="margin-top:20px" onclick="location.reload()">Pay Another Fee</button>
        </div>
      </div>
    `;

    Toast.show('Payment submitted successfully!', 'success');
  } catch (err) {
    Toast.show('Error: ' + err.message, 'error');
  }
}

// ==================================================
// 11. ACADEMY OWNER DASHBOARD
// ==================================================

function renderOwnerDashboard() {
  return `
    <div class="app-layout">
      ${renderOwnerSidebar()}
      <div class="main-content">
        ${renderOwnerTopBar()}
        <div class="page-content" id="owner-content">
          ${renderOwnerHome()}
        </div>
      </div>
    </div>
  `;
}

function renderOwnerSidebar() {
  const menuItems = [
    { route: 'owner-dashboard', icon: '📊', label: 'Dashboard' },
    { route: 'owner-students', icon: '👨‍🎓', label: 'Students' },
    { route: 'owner-classes', icon: '📚', label: 'Classes' },
    { route: 'owner-fees', icon: '💰', label: 'Fees' },
    { route: 'owner-payments', icon: '💳', label: 'Payments' },
    { route: 'owner-attendance', icon: '📋', label: 'Attendance' },
    { route: 'owner-teachers', icon: '👨‍🏫', label: 'Staff' },
    { route: 'owner-expenses', icon: '📉', label: 'Expenses' },
    { route: 'owner-reports', icon: '📈', label: 'Reports' },
    { route: 'owner-settings', icon: '⚙️', label: 'Settings' }
  ];

  return `
    <aside class="sidebar" id="owner-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon-small">📚</div>
          <div>
            <div class="sidebar-title">AMS</div>
            <div class="sidebar-subtitle" id="sidebar-academy-name">My Academy</div>
          </div>
        </div>
        <button class="sidebar-close" onclick="toggleSidebar()">✕</button>
      </div>
      <nav class="sidebar-nav">
        ${menuItems.map(item => `
          <a class="sidebar-link ${Router.currentRoute === item.route ? 'active' : ''}" onclick="Router.navigate('${item.route}')">
            <span class="sidebar-icon">${item.icon}</span>
            <span class="sidebar-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="plan-badge" id="sidebar-plan">Free Plan</div>
        <button class="btn btn-ghost btn-sm btn-block" onclick="handleLogout()">🚪 Logout</button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
  `;
}

function renderOwnerTopBar() {
  return `
    <header class="topbar">
      <button class="menu-toggle" onclick="toggleSidebar()">
        <span></span><span></span><span></span>
      </button>
      <div class="topbar-title" id="page-title">Dashboard</div>
      <div class="topbar-actions">
        <button class="topbar-btn" onclick="showNotifications()">
          🔔
          <span class="notif-badge" id="owner-notif-badge" style="display:none">0</span>
        </button>
        <div class="user-menu">
          <button class="user-btn" onclick="toggleUserMenu()">
            <div class="user-avatar" id="owner-avatar">A</div>
            <span class="user-name" id="owner-name">Admin</span>
          </button>
          <div class="user-dropdown" id="owner-user-dropdown">
            <a onclick="Router.navigate('owner-settings')">⚙️ Settings</a>
            <a onclick="handleLogout()">🚪 Logout</a>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderOwnerHome() {
  return `
    <div class="dashboard-page">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--blue-50);color:var(--blue)">👨‍🎓</div>
          <div class="stat-info">
            <div class="stat-value" id="owner-student-count">...</div>
            <div class="stat-label">Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--green-50);color:var(--green)">💰</div>
          <div class="stat-info">
            <div class="stat-value" id="owner-month-revenue">...</div>
            <div class="stat-label">This Month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--red-50);color:var(--red)">📉</div>
          <div class="stat-info">
            <div class="stat-value" id="owner-pending-fees">...</div>
            <div class="stat-label">Pending Fees</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--purple-50);color:var(--purple)">👨‍🏫</div>
          <div class="stat-info">
            <div class="stat-value" id="owner-staff-count">...</div>
            <div class="stat-label">Staff</div>
          </div>
        </div>
      </div>

      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Pending Payment Requests</h3>
            <span class="badge badge-amber" id="owner-pending-count">0</span>
          </div>
          <div id="owner-pending-payments">
            <div class="empty-state-small">Loading...</div>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="card-header"><h3>Quick Actions</h3></div>
          <div style="padding:20px;display:grid;gap:12px">
            <button class="btn btn-secondary" onclick="openModal('addStudent')">+ Add Student</button>
            <button class="btn btn-secondary" onclick="openModal('addClass')">+ Add Class</button>
            <button class="btn btn-secondary" onclick="openModal('addTeacher')">+ Add Staff</button>
            <button class="btn btn-secondary" onclick="openModal('addExpense')">+ Add Expense</button>
            <button class="btn btn-primary" onclick="Router.navigate('owner-payments')">🔍 Verify Payments</button>
          </div>
        </div>
      </div>

      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="card-header"><h3>Recent Students</h3></div>
          <div id="owner-recent-students">
            <div class="empty-state-small">Loading...</div>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="card-header"><h3>Fee Collection</h3></div>
          <div style="padding:20px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Collection Rate</span>
              <span id="owner-collection-rate">0%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="owner-collection-bar" style="width:0%;background:var(--green)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadOwnerDashboard() {
  if (!Auth.academyId) return;

  // Load stats
  const { count: studentCount } = await supabase
    .from('students').select('*', { count: 'exact', head: true })
    .eq('academy_id', Auth.academyId);

  document.getElementById('owner-student-count').textContent = studentCount || 0;

  // Load pending payments
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('academy_id', Auth.academyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  const pendingDiv = document.getElementById('owner-pending-payments');
  document.getElementById('owner-pending-count').textContent = pendingPayments?.length || 0;

  if (!pendingPayments || pendingPayments.length === 0) {
    pendingDiv.innerHTML = '<div class="empty-state-small">No pending payments</div>';
  } else {
    pendingDiv.innerHTML = pendingPayments.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid var(--gray-50)">
        <div>
          <div style="font-weight:500">${escapeHtml(p.student_name)}</div>
          <div style="font-size:12px;color:var(--gray-500)">${escapeHtml(p.method)} • ${formatDate(p.created_at)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:600">${formatCurrency(p.amount)}</div>
          <button class="btn btn-ghost btn-sm" style="color:var(--green)" onclick="approvePayment('${p.id}')">✓ Approve</button>
        </div>
      </div>
    `).join('');
  }

  // Load recent students
  const { data: recentStudents } = await supabase
    .from('students')
    .select('*')
    .eq('academy_id', Auth.academyId)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentDiv = document.getElementById('owner-recent-students');
  if (!recentStudents || recentStudents.length === 0) {
    recentDiv.innerHTML = '<div class="empty-state-small">No students yet</div>';
  } else {
    recentDiv.innerHTML = recentStudents.map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid var(--gray-50)">
        <div class="user-cell">
          <div class="user-avatar-small">${s.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-name">${escapeHtml(s.name)}</div>
            <div class="user-meta">${escapeHtml(s.class)}</div>
          </div>
        </div>
        <span class="badge badge-light">${formatCurrency(s.monthly_fee)}</span>
      </div>
    `).join('');
  }
}

// ==================================================
// 12. OWNER SETTINGS (Bank Details, Plan, Staff)
// ==================================================

function renderOwnerSettings() {
  return `
    <div class="content-header">
      <div><h1>⚙️ Academy Settings</h1></div>
    </div>

    <div class="settings-grid">
      <div class="settings-card">
        <div class="settings-header"><h3>🏫 Academy Info</h3></div>
        <div class="settings-body">
          <div class="form-group">
            <label class="form-label">Academy Name</label>
            <input type="text" class="form-input" id="setting-academy-name">
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input type="text" class="form-input" id="setting-academy-address">
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-input" id="setting-academy-phone">
          </div>
          <button class="btn btn-primary" onclick="saveAcademyInfo()">Save Info</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-header"><h3>🏦 Bank & Payment Details</h3></div>
        <div class="settings-body">
          <h4 style="font-size:14px;margin-bottom:12px">Bank Transfer</h4>
          <div class="form-group">
            <label class="form-label">Bank Name</label>
            <input type="text" class="form-input" id="setting-bank-name" value="Dubai Islamic Bank">
          </div>
          <div class="form-group">
            <label class="form-label">Account Title</label>
            <input type="text" class="form-input" id="setting-account-title" value="Syed Muhammad Shaheer Ullah">
          </div>
          <div class="form-group">
            <label class="form-label">Account Number</label>
            <input type="text" class="form-input" id="setting-account-number" placeholder="Enter account number">
          </div>
          <div class="form-group">
            <label class="form-label">IBAN</label>
            <input type="text" class="form-input" id="setting-iban" placeholder="Enter IBAN">
          </div>

          <h4 style="font-size:14px;margin:20px 0 12px">Mobile Wallets</h4>
          <div class="form-group">
            <label class="form-label">JazzCash Number</label>
            <input type="tel" class="form-input" id="setting-jazzcash" placeholder="03XX-XXXXXXX">
          </div>
          <div class="form-group">
            <label class="form-label">Easypaisa Number</label>
            <input type="tel" class="form-input" id="setting-easypaisa" placeholder="03XX-XXXXXXX">
          </div>
          <button class="btn btn-primary" onclick="saveBankDetails()">Save Payment Details</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-header"><h3>👥 Staff Management</h3></div>
        <div class="settings-body">
          <div class="form-group">
            <label class="form-label">Staff Email</label>
            <input type="email" class="form-input" id="staff-email" placeholder="staff@email.com">
          </div>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="staff-name" placeholder="Staff name">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="staff-role">
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="addStaff()">+ Add Staff</button>

          <div style="margin-top:20px" id="staff-list">
            <div class="empty-state-small">Loading staff...</div>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-header"><h3>💎 Plan & Billing</h3></div>
        <div class="settings-body">
          <div style="padding:16px;background:var(--blue-50);border-radius:var(--radius);margin-bottom:16px">
            <div style="font-weight:600" id="current-plan-name">Free Plan</div>
            <div style="font-size:13px;color:var(--gray-500)">50 students limit</div>
          </div>
          <div class="form-group">
            <label class="form-label">Upgrade Plan</label>
            <select class="form-select" id="upgrade-plan-select">
              <option value="free">Free (50 students)</option>
              <option value="basic">Basic - Rs 1,500/month (200 students)</option>
              <option value="premium">Premium - Rs 3,500/month (Unlimited)</option>
            </select>
          </div>
          <button class="btn btn-primary btn-block" onclick="upgradePlan()">Upgrade Now</button>
        </div>
      </div>
    </div>
  `;
}

async function saveBankDetails() {
  const bankDetails = {
    bank_name: document.getElementById('setting-bank-name').value,
    account_title: document.getElementById('setting-account-title').value,
    account_number: document.getElementById('setting-account-number').value,
    iban: document.getElementById('setting-iban').value,
    jazzcash_number: document.getElementById('setting-jazzcash').value,
    easypaisa_number: document.getElementById('setting-easypaisa').value
  };

  const { error } = await supabase
    .from('academies')
    .update({ bank_details: bankDetails })
    .eq('id', Auth.academyId);

  if (error) {
    Toast.show('Error saving: ' + error.message, 'error');
  } else {
    Toast.show('Bank details saved!', 'success');
  }
}

async function addStaff() {
  const email = document.getElementById('staff-email').value.trim();
  const name = document.getElementById('staff-name').value.trim();
  const role = document.getElementById('staff-role').value;

  if (!email || !name) {
    Toast.show('Please fill all fields', 'warning');
    return;
  }

  try {
    await AcademyOwner.addStaff(email, name, role);
    Toast.show('Staff added! Email sent with login details.', 'success');
    loadStaffList();
  } catch (err) {
    Toast.show('Error: ' + err.message, 'error');
  }
}

async function loadStaffList() {
  const { data: staff } = await AcademyOwner.getStaff();
  const listDiv = document.getElementById('staff-list');

  if (!staff || staff.length === 0) {
    listDiv.innerHTML = '<div class="empty-state-small">No staff added yet</div>';
    return;
  }

  listDiv.innerHTML = staff.map(s => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">
      <div>
        <div style="font-weight:500">${escapeHtml(s.user?.raw_user_meta_data?.full_name || 'N/A')}</div>
        <div style="font-size:12px;color:var(--gray-500)">${escapeHtml(s.user?.email || 'N/A')} • ${s.role}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="removeStaff('${s.id}')">🗑</button>
    </div>
  `).join('');
}
