
// ==================================================
// 21. REPORTS PAGE
// ==================================================

function renderReports() {
  const stats = getDashboardStats();
  const currentMonth = CONFIG.MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Monthly data for chart
  const monthlyData = getMonthlyData();

  return `
    <div class="content-header">
      <div>
        <h1>Reports</h1>
        <p>Financial overview and statistics</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--blue-50);color:var(--blue)">📊</div>
        <div class="stat-info">
          <div class="stat-value">${stats.totalStudents}</div>
          <div class="stat-label">Total Students</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green-50);color:var(--green)">💰</div>
        <div class="stat-info">
          <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
          <div class="stat-label">Revenue (${currentMonth})</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--red-50);color:var(--red)">📉</div>
        <div class="stat-info">
          <div class="stat-value">${formatCurrency(stats.totalExpenses)}</div>
          <div class="stat-label">Expenses (${currentMonth})</div>
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

    <div class="dashboard-row">
      <div class="dashboard-card">
        <div class="card-header"><h3>Monthly Revenue vs Expenses</h3></div>
        <div style="padding:20px">
          ${monthlyData.map(d => `
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">
                <span>${d.month}</span>
                <span style="color:var(--green)">${formatCurrency(d.revenue)}</span>
              </div>
              <div style="display:flex;gap:4px;height:24px;background:var(--gray-100);border-radius:4px;overflow:hidden">
                <div style="width:${Math.min((d.revenue / Math.max(d.revenue, d.expenses, 1)) * 100, 100)}%;background:var(--green);transition:width 0.3s"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:12px;color:var(--gray-500)">
                <span>Revenue: ${formatCurrency(d.revenue)}</span>
                <span>Expenses: ${formatCurrency(d.expenses)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="dashboard-card">
        <div class="card-header"><h3>Class-wise Students</h3></div>
        <div style="padding:20px">
          ${getClassWiseStats().map(c => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <div>
                <div style="font-weight:500">${escapeHtml(c.name)}</div>
                <div style="font-size:12px;color:var(--gray-500)">${c.students} students</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:600">${formatCurrency(c.revenue)}</div>
                <div style="font-size:12px;color:var(--gray-500)">revenue</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <h3>Fee Collection Report</h3>
        <span class="badge badge-blue">${currentMonth} ${currentYear}</span>
      </div>
      <div style="padding:20px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:16px">
          <div style="text-align:center;padding:16px;background:var(--green-50);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:var(--green)">${stats.collectionRate}%</div>
            <div style="font-size:13px;color:var(--gray-600)">Collection Rate</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--blue-50);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:var(--blue)">${formatCurrency(stats.collectedFees)}</div>
            <div style="font-size:13px;color:var(--gray-600)">Collected</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--red-50);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:var(--red)">${formatCurrency(stats.pendingFees)}</div>
            <div style="font-size:13px;color:var(--gray-600)">Pending</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getMonthlyData() {
  const months = CONFIG.MONTHS.slice(0, new Date().getMonth() + 1);
  const currentYear = new Date().getFullYear();

  return months.map(month => {
    const payments = Storage.getAll('payments').filter(p => p.month === month && p.year === currentYear);
    const expenses = Storage.getAll('expenses').filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === CONFIG.MONTHS.indexOf(month) && d.getFullYear() === currentYear;
    });

    return {
      month,
      revenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      expenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    };
  });
}

function getClassWiseStats() {
  const classes = Storage.getAll('classes');
  const students = Storage.getAll('students');
  const payments = Storage.getAll('payments');
  const currentMonth = CONFIG.MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return classes.map(c => {
    const classStudents = students.filter(s => s.class === c.name);
    const classPayments = payments.filter(p => p.class === c.name && p.month === currentMonth && p.year === currentYear);
    return {
      name: c.name,
      students: classStudents.length,
      revenue: classPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  });
}

function initReportsPage() {}

// ==================================================
// 22. SETTINGS PAGE
// ==================================================

function renderSettings() {
  const academy = State.currentAcademy;
  const user = State.currentUser;
  const plan = CONFIG.PLANS[State.getPlan()];
  const studentCount = Storage.getAll('students').length;

  return `
    <div class="content-header">
      <div>
        <h1>Settings</h1>
        <p>Manage your academy and account</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="settings-card">
        <div class="settings-header">
          <h3>🏫 Academy Settings</h3>
        </div>
        <div class="settings-body">
          <div class="form-group">
            <label class="form-label">Academy Name</label>
            <input type="text" class="form-input" id="academy-name" value="${escapeHtml(academy?.name || '')}">
          </div>
          <button class="btn btn-primary" onclick="saveAcademySettings()">Save Changes</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-header">
          <h3>👤 Account Settings</h3>
        </div>
        <div class="settings-body">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="user-name" value="${escapeHtml(user?.fullName || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" value="${escapeHtml(user?.email || '')}" disabled>
          </div>
          <button class="btn btn-primary" onclick="saveUserSettings()">Update Profile</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-header">
          <h3>💎 Plan & Billing</h3>
        </div>
        <div class="settings-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:16px;background:var(--blue-50);border-radius:8px">
            <div>
              <div style="font-weight:600">${plan.name} Plan</div>
              <div style="font-size:13px;color:var(--gray-500)">${studentCount} / ${plan.limit} students</div>
            </div>
            <div style="font-size:24px;font-weight:700;color:var(--navy)">Rs ${plan.price.toLocaleString()}</div>
          </div>
          <div class="progress-bar" style="margin-bottom:16px">
            <div class="progress-fill" style="width:${(studentCount / plan.limit) * 100}%;background:var(--blue)"></div>
          </div>
          <button class="btn btn-secondary btn-block" onclick="openModal('upgradePlan')">Upgrade Plan</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-header">
          <h3>⚠️ Danger Zone</h3>
        </div>
        <div class="settings-body">
          <p style="color:var(--gray-500);margin-bottom:16px;font-size:13px">These actions cannot be undone.</p>
          <button class="btn btn-danger btn-block" onclick="clearAllData()">🗑 Clear All Data</button>
        </div>
      </div>
    </div>
  `;
}

function saveAcademySettings() {
  const name = document.getElementById('academy-name').value.trim();
  if (!name) { Toast.show('Name required', 'error'); return; }

  const academy = State.currentAcademy;
  academy.name = name;

  const academies = Storage.getAll('academies');
  const idx = academies.findIndex(a => a.id === academy.id);
  if (idx >= 0) academies[idx] = academy;
  Storage.setGlobal('academies', academies);
  State.currentAcademy = academy;

  Toast.show('Academy settings saved', 'success');
  Router.render();
}

function saveUserSettings() {
  const name = document.getElementById('user-name').value.trim();
  if (!name) { Toast.show('Name required', 'error'); return; }

  const user = State.currentUser;
  user.fullName = name;
  Storage.save('users', user);
  State.currentUser = user;

  Toast.show('Profile updated', 'success');
  Router.render();
}

function clearAllData() {
  if (!confirm('⚠️ WARNING: This will delete ALL data permanently!

Are you absolutely sure?')) return;
  if (!confirm('Final confirmation: ALL students, classes, fees, payments, and records will be lost forever.

Type "DELETE" to confirm.')) return;

  Storage.clear();
  State.logout();
  Toast.show('All data cleared', 'info');
  Router.navigate('login');
}

function initSettingsPage() {}

// ==================================================
// 23. IMPORT SYSTEM (from original code - preserved)
// ==================================================

function renderImport() {
  const studentCount = Storage.getAll('students').length;
  const limit = State.getStudentLimit();

  return `
    <div class="content-header">
      <div>
        <h1>Import Students</h1>
        <p>Bulk import students from Excel, CSV, or paste data</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="downloadImportTemplate()">
          <span>📥</span> Download Template
        </button>
        <button class="btn btn-primary" onclick="Router.navigate('students')">Back to Students</button>
      </div>
    </div>

    <div style="margin-bottom:12px;font-size:13px;color:var(--gray-500)">
      Current students: ${studentCount} / ${limit} limit
      ${studentCount >= limit ? '<span class="badge badge-warning" style="margin-left:8px">Limit reached</span>' : ''}
    </div>

    <div class="card">
      <div class="card-body">
        <div class="import-zone" id="import-dropzone" onclick="document.getElementById('import-file').click()">
          <input type="file" id="import-file" style="display:none" accept=".xlsx,.xls,.csv" onchange="handleImportFile(this)">
          <div class="import-zone-icon">📤</div>
          <h4>Upload Excel or CSV File</h4>
          <p>Drag and drop or click to browse. Supports .xlsx, .xls, .csv</p>
        </div>

        <div style="margin-top:24px">
          <h4 style="font-size:14px;font-weight:600;margin-bottom:12px">Or Paste from Google Sheets / Excel</h4>
          <textarea class="form-textarea" id="paste-data" rows="6" placeholder="Paste tab-separated data here...
Format: Name | Guardian | Phone | Class | MonthlyFee | Address
Example:
Ahmad Khan Khalid Khan +92 300 1234567 10th 3500 Lahore
Fatima Ali Ali Ahmed +92 301 2345678 9th 3000 Lahore"></textarea>
          <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="handlePasteImport()">Parse Pasted Data</button>
        </div>

        <div id="import-preview-section" style="display:none;margin-top:24px">
          <h4 style="font-size:16px;font-weight:600;margin-bottom:12px">Preview — <span id="import-count">0</span> students found</h4>
          <div style="max-height:300px;overflow:auto;border:1px solid var(--gray-200);border-radius:var(--radius)">
            <table class="data-table" id="import-preview-table">
              <thead><tr><th>Name</th><th>Guardian</th><th>Phone</th><th>Class</th><th>Fee</th><th>Status</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div id="import-validation" style="margin-top:12px;padding:12px;border-radius:var(--radius);font-size:13px"></div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button class="btn btn-primary" onclick="confirmImport()">Import Students</button>
            <button class="btn btn-ghost" onclick="cancelImport()">Cancel</button>
          </div>
        </div>

        <div style="margin-top:32px;padding:20px;background:var(--gray-50);border-radius:var(--radius)">
          <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">Import Instructions</h4>
          <ul style="font-size:13px;color:var(--gray-600);line-height:1.8;padding-left:20px">
            <li>First row should be headers: Name, Guardian, Phone, Class, MonthlyFee, Address</li>
            <li>Or paste tab-separated data directly from Google Sheets or Excel</li>
            <li>Class should be one of your existing classes (or will be created)</li>
            <li>MonthlyFee should be a number (e.g. 3000)</li>
            <li>Duplicate names will be flagged for review</li>
            <li>Maximum file size: 5MB</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

let importData = [];
let importValidationErrors = [];

function handleImportFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (json.length < 2) {
        Toast.show('File appears to be empty', 'error');
        return;
      }

      parseImportData(json.slice(1));
    } catch (err) {
      console.error(err);
      Toast.show('Error reading file. Please check format.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function handlePasteImport() {
  const pasteText = document.getElementById('paste-data').value.trim();
  if (!pasteText) {
    Toast.show('Please paste some data first', 'warning');
    return;
  }

  const lines = pasteText.split('\n').filter(l => l.trim());
  const rows = lines.map(line => line.split('\t').map(c => c.trim()));

  parseImportData(rows);
}

function parseImportData(rows) {
  importData = [];
  importValidationErrors = [];
  const existingStudents = Storage.getAll('students');
  const existingNames = new Set(existingStudents.map(s => s.name.toLowerCase()));

  rows.forEach((row, index) => {
    if (!row[0]) return;

    const name = String(row[0] || '').trim();
    if (!name) return;

    const isDuplicate = existingNames.has(name.toLowerCase());

    importData.push({
      name: name,
      guardian: String(row[1] || '').trim() || '-',
      phone: String(row[2] || '').trim() || '-',
      class: String(row[3] || '9th').trim(),
      monthlyFee: Number(row[4]) || 3000,
      address: String(row[5] || '').trim() || '',
      _isDuplicate: isDuplicate,
      _rowNum: index + 2
    });

    if (isDuplicate) {
      importValidationErrors.push(`Row ${index + 2}: "${name}" already exists`);
    }
  });

  showImportPreview();
}

function showImportPreview() {
  document.getElementById('import-count').textContent = importData.length;
  const tbody = document.querySelector('#import-preview-table tbody');

  tbody.innerHTML = importData.slice(0, 10).map(s => `
    <tr style="${s._isDuplicate ? 'background:var(--red-50)' : ''}">
      <td>${escapeHtml(s.name)} ${s._isDuplicate ? '<span class="badge badge-danger" style="margin-left:4px">Duplicate</span>' : ''}</td>
      <td>${escapeHtml(s.guardian)}</td>
      <td>${escapeHtml(s.phone)}</td>
      <td>${escapeHtml(s.class)}</td>
      <td>${formatCurrency(s.monthlyFee)}</td>
      <td>${s._isDuplicate ? '<span style="color:var(--red);font-size:12px">Will skip</span>' : '<span style="color:var(--green);font-size:12px">OK</span>'}</td>
    </tr>
  `).join('') + (importData.length > 10 ? `<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">...and ${importData.length - 10} more</td></tr>` : '');

  const validationDiv = document.getElementById('import-validation');
  if (importValidationErrors.length > 0) {
    validationDiv.style.background = 'var(--red-50)';
    validationDiv.style.color = 'var(--red)';
    validationDiv.innerHTML = `<strong>${importValidationErrors.length} warning(s):</strong><br>` + importValidationErrors.slice(0, 5).join('<br>') + (importValidationErrors.length > 5 ? `<br>...and ${importValidationErrors.length - 5} more` : '');
  } else {
    validationDiv.style.background = 'var(--green-50)';
    validationDiv.style.color = 'var(--green)';
    validationDiv.innerHTML = '✓ All records look good. Ready to import.';
  }

  document.getElementById('import-preview-section').style.display = 'block';
  Toast.show(`${importData.length} students ready to import`, 'success');
}

function confirmImport() {
  if (importData.length === 0) return;

  const validData = importData.filter(s => !s._isDuplicate);

  if (!State.canAddStudent(validData.length)) {
    Toast.show(`Import would exceed your ${State.getStudentLimit()} student limit. Upgrade your plan.`, 'warning');
    return;
  }

  if (validData.length === 0) {
    Toast.show('No valid records to import (all duplicates)', 'warning');
    return;
  }

  let imported = 0;
  const currentMonth = CONFIG.MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  validData.forEach(s => {
    if (s.name) {
      const student = Storage.save('students', {
        id: generateId(),
        academyId: State.getAcademyId(),
        name: s.name,
        guardian: s.guardian,
        phone: s.phone,
        class: s.class,
        monthlyFee: s.monthlyFee,
        admissionDate: new Date().toISOString(),
        address: s.address,
        notes: '',
        status: 'active'
      });

      Storage.save('fees', {
        id: generateId(),
        academyId: State.getAcademyId(),
        studentId: student.id,
        studentName: student.name,
        class: s.class,
        month: currentMonth,
        year: currentYear,
        amount: s.monthlyFee,
        status: 'pending',
        paidAmount: 0,
        paidDate: null
      });
      imported++;
    }
  });

  Notifications.add('success', 'Import complete', `${imported} students imported successfully${importData.length > validData.length ? ` (${importData.length - validData.length} duplicates skipped)` : ''}`);
  Toast.show(`${imported} students imported!`, 'success');
  cancelImport();
  Router.render();
}

function cancelImport() {
  importData = [];
  importValidationErrors = [];
  const previewSection = document.getElementById('import-preview-section');
  if (previewSection) previewSection.style.display = 'none';
  const fileInput = document.getElementById('import-file');
  if (fileInput) fileInput.value = '';
  const pasteData = document.getElementById('paste-data');
  if (pasteData) pasteData.value = '';
}

function downloadImportTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Name', 'Guardian', 'Phone', 'Class', 'MonthlyFee', 'Address'],
    ['Ahmad Khan', 'Khalid Khan', '+92 300 1234567', '10th', 3500, 'Lahore'],
    ['Fatima Ali', 'Ali Ahmed', '+92 301 2345678', '9th', 3000, 'Lahore'],
    ['Hassan Raza', 'Raza Ahmed', '+92 302 3456789', '10th', 3500, 'Lahore']
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'AMS_Student_Import_Template.xlsx');
  Toast.show('Template downloaded', 'success');
}

function initImportPage() {}
