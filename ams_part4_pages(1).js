
// ==================================================
// 13. DASHBOARD PAGE
// ==================================================

function renderDashboard() {
  const stats = getDashboardStats();
  const recentPayments = Storage.getAll('payments').slice(-5).reverse();
  const pendingFees = Storage.getAll('fees').filter(f => f.status !== 'paid').slice(0, 5);

  return `
    <div class="dashboard-page">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--blue-50);color:var(--blue)">👨‍🎓</div>
          <div class="stat-info">
            <div class="stat-value">${stats.totalStudents}</div>
            <div class="stat-label">Total Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--green-50);color:var(--green)">💰</div>
          <div class="stat-info">
            <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
            <div class="stat-label">Revenue This Month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--red-50);color:var(--red)">📉</div>
          <div class="stat-info">
            <div class="stat-value">${formatCurrency(stats.totalExpenses)}</div>
            <div class="stat-label">Expenses This Month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--purple-50);color:var(--purple)">📈</div>
          <div class="stat-info">
            <div class="stat-value">${formatCurrency(stats.netProfit)}</div>
            <div class="stat-label">Net Profit</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Fee Collection Overview</h3>
            <span class="badge badge-blue">This Month</span>
          </div>
          <div class="fee-overview">
            <div class="fee-stat">
              <div class="fee-stat-value" style="color:var(--green)">${formatCurrency(stats.collectedFees)}</div>
              <div class="fee-stat-label">Collected</div>
            </div>
            <div class="fee-stat">
              <div class="fee-stat-value" style="color:var(--red)">${formatCurrency(stats.pendingFees)}</div>
              <div class="fee-stat-label">Pending</div>
            </div>
            <div class="fee-stat">
              <div class="fee-stat-value" style="color:var(--blue)">${formatCurrency(stats.totalExpected)}</div>
              <div class="fee-stat-label">Expected</div>
            </div>
          </div>
          <div class="progress-bar" style="margin-top:16px">
            <div class="progress-fill" style="width:${stats.collectionRate}%;background:var(--green)"></div>
          </div>
          <div style="text-align:center;margin-top:8px;font-size:13px;color:var(--gray-500)">
            ${stats.collectionRate}% collection rate
          </div>
        </div>

        <div class="dashboard-card">
          <div class="card-header">
            <h3>Attendance Today</h3>
            <span class="badge badge-green">${stats.attendanceRate}%</span>
          </div>
          <div class="attendance-ring">
            <div class="ring-chart">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gray-200)" stroke-width="8"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="8"
                  stroke-dasharray="${2 * Math.PI * 40 * stats.attendanceRate / 100} ${2 * Math.PI * 40}"
                  transform="rotate(-90 50 50)"/>
              </svg>
              <div class="ring-text">
                <div class="ring-value">${stats.presentToday}</div>
                <div class="ring-label">Present</div>
              </div>
            </div>
            <div class="attendance-stats">
              <div><span style="color:var(--green)">●</span> Present: ${stats.presentToday}</div>
              <div><span style="color:var(--red)">●</span> Absent: ${stats.absentToday}</div>
              <div><span style="color:var(--gray-400)">●</span> Total: ${stats.totalStudents}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Recent Payments</h3>
            <a onclick="Router.navigate('payments')" style="color:var(--blue);font-size:13px;cursor:pointer">View All →</a>
          </div>
          ${recentPayments.length === 0 ? 
            '<div class="empty-state-small">No payments yet</div>' :
            `<div class="recent-list">
              ${recentPayments.map(p => `
                <div class="recent-item">
                  <div class="recent-info">
                    <div class="recent-title">${escapeHtml(p.studentName)}</div>
                    <div class="recent-meta">${p.month} • ${p.method}</div>
                  </div>
                  <div class="recent-amount" style="color:var(--green)">+${formatCurrency(p.amount)}</div>
                </div>
              `).join('')}
            </div>`
          }
        </div>

        <div class="dashboard-card">
          <div class="card-header">
            <h3>Pending Fees</h3>
            <a onclick="Router.navigate('fees')" style="color:var(--blue);font-size:13px;cursor:pointer">View All →</a>
          </div>
          ${pendingFees.length === 0 ?
            '<div class="empty-state-small">All fees collected! 🎉</div>' :
            `<div class="recent-list">
              ${pendingFees.map(f => `
                <div class="recent-item">
                  <div class="recent-info">
                    <div class="recent-title">${escapeHtml(f.studentName)}</div>
                    <div class="recent-meta">${f.class} • ${f.month}</div>
                  </div>
                  <div class="recent-amount" style="color:var(--red)">${formatCurrency(f.amount - (f.paidAmount || 0))}</div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
      </div>
    </div>
  `;
}

function getDashboardStats() {
  const students = Storage.getAll('students');
  const payments = Storage.getAll('payments');
  const expenses = Storage.getAll('expenses');
  const fees = Storage.getAll('fees');
  const attendance = Storage.getAll('attendance');

  const currentMonth = CONFIG.MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  const monthPayments = payments.filter(p => p.month === currentMonth && p.year === currentYear);
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === currentYear;
  });
  const monthFees = fees.filter(f => f.month === currentMonth && f.year === currentYear);
  const todayAttendance = attendance.filter(a => a.date === today);

  const totalRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpected = monthFees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const collectedFees = monthFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const pendingFees = totalExpected - collectedFees;

  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
  const attendanceRate = students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0;
  const collectionRate = totalExpected > 0 ? Math.round((collectedFees / totalExpected) * 100) : 0;

  return {
    totalStudents: students.length,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    totalExpected,
    collectedFees,
    pendingFees,
    collectionRate,
    presentToday,
    absentToday,
    attendanceRate
  };
}

function initDashboard() {
  // Dashboard is static, no special init needed
}

// ==================================================
// 14. STUDENTS PAGE
// ==================================================

function renderStudents() {
  const students = Storage.getAll('students');
  const searchTerm = (Router.params?.search || '').toLowerCase();
  const filtered = searchTerm ? students.filter(s => 
    s.name.toLowerCase().includes(searchTerm) || 
    s.class.toLowerCase().includes(searchTerm) ||
    (s.phone || '').includes(searchTerm)
  ) : students;

  return `
    <div class="content-header">
      <div>
        <h1>Students</h1>
        <p>${students.length} total students • ${State.getStudentLimit()} limit</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="Router.navigate('import')">
          <span>📥</span> Import
        </button>
        <button class="btn btn-primary" onclick="openModal('addStudent')">
          <span>+</span> Add Student
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search students..." value="${escapeHtml(searchTerm)}" 
                 oninput="searchStudents(this.value)">
        </div>
        <div class="filter-tabs">
          <button class="filter-tab active" onclick="filterStudents('all')">All</button>
          <button class="filter-tab" onclick="filterStudents('active')">Active</button>
          <button class="filter-tab" onclick="filterStudents('inactive')">Inactive</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Phone</th>
              <th>Monthly Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? 
              `<tr><td colspan="6" class="empty-state-cell">
                <div class="empty-state">
                  <div class="empty-icon">👨‍🎓</div>
                  <h4>No students found</h4>
                  <p>Add your first student to get started</p>
                  <button class="btn btn-primary" onclick="openModal('addStudent')">Add Student</button>
                </div>
              </td></tr>` :
              filtered.map(s => `
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar-small">${s.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div class="user-name">${escapeHtml(s.name)}</div>
                        <div class="user-meta">${escapeHtml(s.guardian || '-')}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-light">${escapeHtml(s.class)}</span></td>
                  <td>${escapeHtml(s.phone || '-')}</td>
                  <td>${formatCurrency(s.monthlyFee)}</td>
                  <td><span class="badge badge-${s.status === 'active' ? 'green' : 'gray'}">${s.status}</span></td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-ghost btn-sm" onclick="openEditStudent('${s.id}')" title="Edit">✏️</button>
                      <button class="btn btn-ghost btn-sm" onclick="openModal('recordPayment','${s.id}')" title="Payment">💳</button>
                      <button class="btn btn-ghost btn-sm" onclick="deleteStudent('${s.id}')" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function searchStudents(query) {
  Router.params = { search: query };
  document.querySelector('.page-content').innerHTML = renderStudents();
}

function filterStudents(status) {
  // Simple filter implementation
  const students = Storage.getAll('students');
  const filtered = status === 'all' ? students : students.filter(s => s.status === status);
  // Re-render would be complex here, so we use search approach
  Toast.show('Filter: ' + status, 'info');
}

function deleteStudent(id) {
  if (!confirm('Are you sure? This will delete the student and all related records.')) return;

  // Delete related records
  const fees = Storage.getAll('fees').filter(f => f.studentId === id);
  fees.forEach(f => Storage.delete('fees', f.id));

  const payments = Storage.getAll('payments').filter(p => p.studentId === id);
  payments.forEach(p => Storage.delete('payments', p.id));

  const attendance = Storage.getAll('attendance').filter(a => a.studentId === id);
  attendance.forEach(a => Storage.delete('attendance', a.id));

  Storage.delete('students', id);
  Toast.show('Student deleted', 'success');
  Router.render();
}

function initStudentsPage() {
  Router.params = null;
}

// ==================================================
// 15. CLASSES PAGE
// ==================================================

function renderClasses() {
  const classes = Storage.getAll('classes');
  const students = Storage.getAll('students');

  return `
    <div class="content-header">
      <div>
        <h1>Classes</h1>
        <p>${classes.length} classes offered</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('addClass')">
        <span>+</span> Add Class
      </button>
    </div>

    <div class="classes-grid">
      ${classes.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">📚</div>
          <h4>No classes yet</h4>
          <p>Add your first class to organize students</p>
          <button class="btn btn-primary" onclick="openModal('addClass')">Add Class</button>
        </div>
      ` : classes.map(c => {
        const classStudents = students.filter(s => s.class === c.name).length;
        return `
          <div class="class-card">
            <div class="class-header">
              <div class="class-icon">📖</div>
              <div class="class-menu">
                <button class="btn btn-ghost btn-sm" onclick="openEditClass('${c.id}')">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteClass('${c.id}')">🗑</button>
              </div>
            </div>
            <h3 class="class-name">${escapeHtml(c.name)}</h3>
            <p class="class-subject">${escapeHtml(c.subject || 'General')}</p>
            <div class="class-stats">
              <div class="class-stat">
                <span class="class-stat-value">${classStudents}</span>
                <span class="class-stat-label">Students</span>
              </div>
              <div class="class-stat">
                <span class="class-stat-value">${formatCurrency(c.monthlyFee)}</span>
                <span class="class-stat-label">Monthly Fee</span>
              </div>
            </div>
            ${c.teacherName ? `<div class="class-teacher">👨‍🏫 ${escapeHtml(c.teacherName)}</div>` : ''}
            ${c.schedule ? `<div class="class-schedule">🕐 ${escapeHtml(c.schedule)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function deleteClass(id) {
  if (!confirm('Delete this class? Students in this class will NOT be deleted.')) return;
  Storage.delete('classes', id);
  Toast.show('Class deleted', 'success');
  Router.render();
}

function initClassesPage() {}

// ==================================================
// 16. FEES PAGE
// ==================================================

function renderFees() {
  const fees = Storage.getAll('fees');
  const currentMonth = CONFIG.MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const monthFees = fees.filter(f => f.month === currentMonth && f.year === currentYear);
  const pending = monthFees.filter(f => f.status === 'pending');
  const partial = monthFees.filter(f => f.status === 'partial');
  const paid = monthFees.filter(f => f.status === 'paid');

  return `
    <div class="content-header">
      <div>
        <h1>Fees</h1>
        <p>${currentMonth} ${currentYear}</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('recordPayment')">
        <span>💳</span> Record Payment
      </button>
    </div>

    <div class="fee-stats-row">
      <div class="fee-stat-card pending">
        <div class="fee-stat-value">${pending.length}</div>
        <div class="fee-stat-label">Pending</div>
      </div>
      <div class="fee-stat-card partial">
        <div class="fee-stat-value">${partial.length}</div>
        <div class="fee-stat-label">Partial</div>
      </div>
      <div class="fee-stat-card paid">
        <div class="fee-stat-value">${paid.length}</div>
        <div class="fee-stat-label">Paid</div>
      </div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search fees..." oninput="searchFees(this.value)">
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${monthFees.length === 0 ?
              `<tr><td colspan="8" class="empty-state-cell">
                <div class="empty-state">
                  <div class="empty-icon">💰</div>
                  <h4>No fee records</h4>
                  <p>Add students to generate fee records</p>
                </div>
              </td></tr>` :
              monthFees.map(f => {
                const balance = (f.amount || 0) - (f.paidAmount || 0);
                return `
                  <tr>
                    <td>${escapeHtml(f.studentName)}</td>
                    <td><span class="badge badge-light">${escapeHtml(f.class)}</span></td>
                    <td>${f.month}</td>
                    <td>${formatCurrency(f.amount)}</td>
                    <td>${formatCurrency(f.paidAmount || 0)}</td>
                    <td style="color:${balance > 0 ? 'var(--red)' : 'var(--green)'}">${formatCurrency(balance)}</td>
                    <td><span class="badge badge-${f.status === 'paid' ? 'green' : f.status === 'partial' ? 'amber' : 'red'}">${f.status}</span></td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="openModal('recordPayment','${f.studentId}')">💳 Pay</button>
                    </td>
                  </tr>
                `;
              }).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function searchFees(query) {
  // Implementation would filter fees
  Toast.show('Search: ' + query, 'info');
}

function initFeesPage() {}

// ==================================================
// 17. PAYMENTS PAGE
// ==================================================

function renderPayments() {
  const payments = Storage.getAll('payments').reverse();

  return `
    <div class="content-header">
      <div>
        <h1>Payments</h1>
        <p>${payments.length} total payments</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('recordPayment')">
        <span>💳</span> Record Payment
      </button>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Class</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length === 0 ?
              `<tr><td colspan="7" class="empty-state-cell">
                <div class="empty-state">
                  <div class="empty-icon">💳</div>
                  <h4>No payments recorded</h4>
                  <p>Record your first payment</p>
                </div>
              </td></tr>` :
              payments.map(p => `
                <tr>
                  <td>${formatDate(p.date)}</td>
                  <td>${escapeHtml(p.studentName)}</td>
                  <td><span class="badge badge-light">${escapeHtml(p.class)}</span></td>
                  <td>${p.month}</td>
                  <td style="color:var(--green);font-weight:600">+${formatCurrency(p.amount)}</td>
                  <td>${escapeHtml(p.method)}</td>
                  <td>${escapeHtml(p.notes || '-')}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function initPaymentsPage() {}

// ==================================================
// 18. ATTENDANCE PAGE
// ==================================================

function renderAttendance() {
  const students = Storage.getAll('students');
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = Storage.getAll('attendance').filter(a => a.date === today);

  // Group by class
  const classes = [...new Set(students.map(s => s.class))];

  return `
    <div class="content-header">
      <div>
        <h1>Attendance</h1>
        <p>${formatDate(today)}</p>
      </div>
      <button class="btn btn-primary" onclick="saveAttendance()">
        <span>💾</span> Save Attendance
      </button>
    </div>

    ${classes.length === 0 ? `
      <div class="empty-state-card">
        <div class="empty-icon">📋</div>
        <h4>No classes found</h4>
        <p>Add classes and students first</p>
      </div>
    ` : classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>${escapeHtml(cls)}</h3>
            <span class="badge badge-light">${classStudents.length} students</span>
          </div>
          <div class="attendance-list">
            ${classStudents.map(s => {
              const record = todayAttendance.find(a => a.studentId === s.id);
              const status = record?.status || 'present';
              return `
                <div class="attendance-row" data-student="${s.id}">
                  <div class="attendance-student">
                    <div class="user-avatar-small">${s.name.charAt(0).toUpperCase()}</div>
                    <span>${escapeHtml(s.name)}</span>
                  </div>
                  <div class="attendance-toggle">
                    <button class="attendance-btn ${status === 'present' ? 'active' : ''}" 
                            onclick="setAttendance('${s.id}', 'present')">✓ Present</button>
                    <button class="attendance-btn ${status === 'absent' ? 'active absent' : ''}" 
                            onclick="setAttendance('${s.id}', 'absent')">✕ Absent</button>
                    <button class="attendance-btn ${status === 'leave' ? 'active leave' : ''}" 
                            onclick="setAttendance('${s.id}', 'leave')">⏸ Leave</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function setAttendance(studentId, status) {
  // Update UI
  const row = document.querySelector(`.attendance-row[data-student="${studentId}"]`);
  if (row) {
    row.querySelectorAll('.attendance-btn').forEach(btn => btn.classList.remove('active'));
    row.querySelector(`.attendance-btn:nth-child(${status === 'present' ? 1 : status === 'absent' ? 2 : 3})`).classList.add('active');
  }

  // Store temporarily
  if (!window.tempAttendance) window.tempAttendance = {};
  window.tempAttendance[studentId] = status;
}

function saveAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const students = Storage.getAll('students');

  students.forEach(s => {
    const status = window.tempAttendance?.[s.id] || 'present';

    // Check if record exists
    const existing = Storage.getAll('attendance').find(a => a.studentId === s.id && a.date === today);
    if (existing) {
      existing.status = status;
      Storage.save('attendance', existing);
    } else {
      Storage.save('attendance', {
        id: generateId(),
        academyId: State.getAcademyId(),
        studentId: s.id,
        studentName: s.name,
        class: s.class,
        date: today,
        status,
        notes: ''
      });
    }
  });

  window.tempAttendance = {};
  Toast.show('Attendance saved!', 'success');
  Notifications.add('success', 'Attendance recorded', `Attendance saved for ${formatDate(today)}`);
}

function initAttendancePage() {
  window.tempAttendance = {};
}

// ==================================================
// 19. TEACHERS PAGE
// ==================================================

function renderTeachers() {
  const teachers = Storage.getAll('teachers');

  return `
    <div class="content-header">
      <div>
        <h1>Teachers</h1>
        <p>${teachers.length} teachers</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('addTeacher')">
        <span>+</span> Add Teacher
      </button>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Subject</th>
              <th>Classes</th>
              <th>Salary</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${teachers.length === 0 ?
              `<tr><td colspan="6" class="empty-state-cell">
                <div class="empty-state">
                  <div class="empty-icon">👨‍🏫</div>
                  <h4>No teachers added</h4>
                  <p>Add your teaching staff</p>
                </div>
              </td></tr>` :
              teachers.map(t => `
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar-small" style="background:var(--purple-50);color:var(--purple)">${t.name.charAt(0).toUpperCase()}</div>
                      <div class="user-name">${escapeHtml(t.name)}</div>
                    </div>
                  </td>
                  <td>${escapeHtml(t.subject || '-')}</td>
                  <td>${(t.classes || []).map(c => `<span class="badge badge-light">${escapeHtml(c)}</span>`).join(' ')}</td>
                  <td>${formatCurrency(t.salary)}</td>
                  <td>${escapeHtml(t.phone || '-')}</td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-ghost btn-sm" onclick="openEditTeacher('${t.id}')">✏️</button>
                      <button class="btn btn-ghost btn-sm" onclick="deleteTeacher('${t.id}')">🗑</button>
                    </div>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Salary Summary -->
    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <h3>Monthly Salary Summary</h3>
      </div>
      <div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:16px;color:var(--gray-600)">Total Monthly Salaries:</span>
          <span style="font-size:24px;font-weight:700;color:var(--navy)">${formatCurrency(teachers.reduce((sum, t) => sum + (t.salary || 0), 0))}</span>
        </div>
      </div>
    </div>
  `;
}

function deleteTeacher(id) {
  if (!confirm('Delete this teacher?')) return;
  Storage.delete('teachers', id);
  Toast.show('Teacher deleted', 'success');
  Router.render();
}

function initTeachersPage() {}

// ==================================================
// 20. EXPENSES PAGE
// ==================================================

function renderExpenses() {
  const expenses = Storage.getAll('expenses').reverse();
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group by category
  const byCategory = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0);
  });

  return `
    <div class="content-header">
      <div>
        <h1>Expenses</h1>
        <p>Total: ${formatCurrency(totalExpenses)}</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('addExpense')">
        <span>+</span> Add Expense
      </button>
    </div>

    <div class="dashboard-row">
      <div class="dashboard-card">
        <div class="card-header"><h3>By Category</h3></div>
        <div style="padding:16px">
          ${Object.entries(byCategory).length === 0 ? 
            '<p style="color:var(--gray-400)">No expenses yet</p>' :
            Object.entries(byCategory).map(([cat, amount]) => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100)">
                <span>${escapeHtml(cat)}</span>
                <span style="font-weight:600">${formatCurrency(amount)}</span>
              </div>
            `).join('')
          }
        </div>
      </div>

      <div class="dashboard-card">
        <div class="card-header"><h3>Recent Expenses</h3></div>
        <div class="table-responsive">
          <table class="data-table" style="border:none">
            <tbody>
              ${expenses.length === 0 ?
                `<tr><td colspan="3" style="text-align:center;padding:40px;color:var(--gray-400)">No expenses recorded</td></tr>` :
                expenses.slice(0, 10).map(e => `
                  <tr>
                    <td>
                      <div style="font-weight:500">${escapeHtml(e.title)}</div>
                      <div style="font-size:12px;color:var(--gray-500)">${escapeHtml(e.category)} • ${formatDate(e.date)}</div>
                    </td>
                    <td style="color:var(--red);font-weight:600;text-align:right">-${formatCurrency(e.amount)}</td>
                    <td style="width:40px">
                      <button class="btn btn-ghost btn-sm" onclick="deleteExpense('${e.id}')">🗑</button>
                    </td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  Storage.delete('expenses', id);
  Toast.show('Expense deleted', 'success');
  Router.render();
}

function initExpensesPage() {}
