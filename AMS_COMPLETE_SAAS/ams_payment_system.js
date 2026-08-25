
// ==================================================
// MANUAL PAYMENT SYSTEM
// Bank: Dubai Islamic Bank
// Account: Syed Muhammad Shaheer Ullah
// ==================================================

// Bank Details Configuration
const BANK_DETAILS = {
  bankName: 'Dubai Islamic Bank',
  accountTitle: 'Syed Muhammad Shaheer Ullah',
  accountNumber: 'Enter your account number here',
  iban: 'Enter your IBAN here',
  branch: 'Main Branch',
  swiftCode: 'DUIBPKKA',

  // JazzCash Details
  jazzCash: {
    number: 'Enter your JazzCash number',
    accountTitle: 'Syed Muhammad Shaheer Ullah'
  },

  // Easypaisa Details
  easypaisa: {
    number: 'Enter your Easypaisa number',
    accountTitle: 'Syed Muhammad Shaheer Ullah'
  }
};

// ==================================================
// PAYMENT OPTIONS PAGE (For Students/Parents)
// ==================================================

function renderPaymentOptions(studentId = null, feeId = null) {
  const students = Storage.getAll('students');
  const fees = Storage.getAll('fees');

  let selectedStudent = null;
  let selectedFee = null;

  if (studentId) {
    selectedStudent = Storage.getById('students', studentId);
    if (feeId) {
      selectedFee = Storage.getById('fees', feeId);
    }
  }

  return `
    <div class="content-header">
      <div>
        <h1>💳 Pay Fee</h1>
        <p>Choose your payment method</p>
      </div>
    </div>

    <div class="payment-page">
      <!-- Student & Fee Selection -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>Select Student & Fee</h3></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Student *</label>
              <select class="form-select" id="pay-student" onchange="loadFeeOptions(this.value)" ${selectedStudent ? 'disabled' : ''}>
                <option value="">Select student</option>
                ${students.map(s => `<option value="${s.id}" ${selectedStudent?.id === s.id ? 'selected' : ''}>${escapeHtml(s.name)} - ${s.class}</option>`).join('')}
              </select>
              ${selectedStudent ? `<input type="hidden" id="pay-student" value="${selectedStudent.id}">` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">Fee Month *</label>
              <select class="form-select" id="pay-fee" onchange="updatePaymentAmount()">
                <option value="">Select fee</option>
              </select>
            </div>
          </div>
          <div id="fee-amount-display" style="display:none;margin-top:16px;padding:16px;background:var(--blue-50);border-radius:var(--radius)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:var(--gray-600)">Amount to Pay:</span>
              <span style="font-size:24px;font-weight:700;color:var(--navy)" id="pay-amount">Rs 0</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="payment-methods">
        <!-- Bank Transfer -->
        <div class="payment-method-card" onclick="selectPaymentMethod('bank')">
          <div class="payment-method-header">
            <div class="payment-icon">🏦</div>
            <div>
              <h4>Bank Transfer</h4>
              <p style="font-size:13px;color:var(--gray-500)">Dubai Islamic Bank</p>
            </div>
            <div class="payment-radio" id="radio-bank"></div>
          </div>
          <div class="payment-details" id="details-bank" style="display:none">
            <div class="bank-info-box">
              <div class="bank-detail-row">
                <span class="bank-label">Bank Name:</span>
                <span class="bank-value">${BANK_DETAILS.bankName}</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">Account Title:</span>
                <span class="bank-value">${BANK_DETAILS.accountTitle}</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">Account Number:</span>
                <span class="bank-value copy-text" onclick="copyToClipboard('${BANK_DETAILS.accountNumber}')">${BANK_DETAILS.accountNumber} 📋</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">IBAN:</span>
                <span class="bank-value copy-text" onclick="copyToClipboard('${BANK_DETAILS.iban}')">${BANK_DETAILS.iban} 📋</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">Branch:</span>
                <span class="bank-value">${BANK_DETAILS.branch}</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">SWIFT Code:</span>
                <span class="bank-value copy-text" onclick="copyToClipboard('${BANK_DETAILS.swiftCode}')">${BANK_DETAILS.swiftCode} 📋</span>
              </div>
            </div>
            <p style="font-size:13px;color:var(--gray-500);margin-top:12px">
              💡 Transfer karne ke baad neeche transaction ID ya screenshot upload karein.
            </p>
          </div>
        </div>

        <!-- JazzCash -->
        <div class="payment-method-card" onclick="selectPaymentMethod('jazzcash')">
          <div class="payment-method-header">
            <div class="payment-icon" style="background:var(--red-50);color:var(--red)">📱</div>
            <div>
              <h4>JazzCash</h4>
              <p style="font-size:13px;color:var(--gray-500)">Mobile Wallet</p>
            </div>
            <div class="payment-radio" id="radio-jazzcash"></div>
          </div>
          <div class="payment-details" id="details-jazzcash" style="display:none">
            <div class="bank-info-box">
              <div class="bank-detail-row">
                <span class="bank-label">JazzCash Number:</span>
                <span class="bank-value copy-text" onclick="copyToClipboard('${BANK_DETAILS.jazzCash.number}')">${BANK_DETAILS.jazzCash.number} 📋</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">Account Title:</span>
                <span class="bank-value">${BANK_DETAILS.jazzCash.accountTitle}</span>
              </div>
            </div>
            <p style="font-size:13px;color:var(--gray-500);margin-top:12px">
              💡 JazzCash app se "Send Money" karein, phir transaction ID neeche enter karein.
            </p>
          </div>
        </div>

        <!-- Easypaisa -->
        <div class="payment-method-card" onclick="selectPaymentMethod('easypaisa')">
          <div class="payment-method-header">
            <div class="payment-icon" style="background:var(--green-50);color:var(--green)">💚</div>
            <div>
              <h4>Easypaisa</h4>
              <p style="font-size:13px;color:var(--gray-500)">Mobile Wallet</p>
            </div>
            <div class="payment-radio" id="radio-easypaisa"></div>
          </div>
          <div class="payment-details" id="details-easypaisa" style="display:none">
            <div class="bank-info-box">
              <div class="bank-detail-row">
                <span class="bank-label">Easypaisa Number:</span>
                <span class="bank-value copy-text" onclick="copyToClipboard('${BANK_DETAILS.easypaisa.number}')">${BANK_DETAILS.easypaisa.number} 📋</span>
              </div>
              <div class="bank-detail-row">
                <span class="bank-label">Account Title:</span>
                <span class="bank-value">${BANK_DETAILS.easypaisa.accountTitle}</span>
              </div>
            </div>
            <p style="font-size:13px;color:var(--gray-500);margin-top:12px">
              💡 Easypaisa app se "Send Money" karein, phir transaction ID neeche enter karein.
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Proof Upload -->
      <div class="card" style="margin-top:20px">
        <div class="card-header"><h3>Payment Proof</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Transaction ID / Reference Number *</label>
            <input type="text" class="form-input" id="transaction-id" placeholder="e.g., TRX123456789">
          </div>
          <div class="form-group">
            <label class="form-label">Screenshot / Receipt (Optional)</label>
            <div class="upload-zone" onclick="document.getElementById('payment-screenshot').click()">
              <input type="file" id="payment-screenshot" style="display:none" accept="image/*" onchange="handleScreenshotUpload(this)">
              <div id="upload-preview" style="text-align:center">
                <div style="font-size:32px;margin-bottom:8px">📷</div>
                <p>Click to upload screenshot</p>
                <p style="font-size:12px;color:var(--gray-400)">JPG, PNG (max 5MB)</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes (Optional)</label>
            <textarea class="form-textarea" id="payment-notes" placeholder="Any additional information..."></textarea>
          </div>
          <button class="btn btn-primary btn-block" onclick="submitManualPayment()" id="submit-payment-btn" disabled>
            Submit Payment Request
          </button>
        </div>
      </div>
    </div>
  `;
}

let selectedPaymentMethod = null;
let uploadedScreenshot = null;
let currentFeeOptions = [];

function loadFeeOptions(studentId) {
  if (!studentId) return;

  const fees = Storage.getAll('fees').filter(f => 
    f.studentId === studentId && f.status !== 'paid'
  );

  currentFeeOptions = fees;

  const feeSelect = document.getElementById('pay-fee');
  feeSelect.innerHTML = '<option value="">Select fee</option>' + 
    fees.map(f => {
      const balance = (f.amount || 0) - (f.paidAmount || 0);
      return `<option value="${f.id}" data-amount="${balance}">${f.month} ${f.year} - ${formatCurrency(balance)}</option>`;
    }).join('');
}

function updatePaymentAmount() {
  const feeSelect = document.getElementById('pay-fee');
  const selectedOption = feeSelect.options[feeSelect.selectedIndex];
  const amount = selectedOption.dataset.amount || 0;

  document.getElementById('pay-amount').textContent = formatCurrency(amount);
  document.getElementById('fee-amount-display').style.display = 'block';

  checkFormValidity();
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;

  // Reset all
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelectorAll('.payment-details').forEach(detail => {
    detail.style.display = 'none';
  });
  document.querySelectorAll('.payment-radio').forEach(radio => {
    radio.innerHTML = '';
  });

  // Select current
  event.currentTarget.classList.add('selected');
  document.getElementById(`details-${method}`).style.display = 'block';
  document.getElementById(`radio-${method}`).innerHTML = '<div style="width:20px;height:20px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;color:white;font-size:12px">✓</div>';

  checkFormValidity();
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    Toast.show('Copied to clipboard!', 'success');
  });
}

function handleScreenshotUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    Toast.show('File too large. Max 5MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedScreenshot = e.target.result;
    document.getElementById('upload-preview').innerHTML = `
      <img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:var(--radius)">
      <p style="margin-top:8px;font-size:13px;color:var(--green)">✓ Screenshot uploaded</p>
    `;
  };
  reader.readAsDataURL(file);
}

function checkFormValidity() {
  const studentId = document.getElementById('pay-student').value;
  const feeId = document.getElementById('pay-fee').value;
  const transactionId = document.getElementById('transaction-id').value.trim();

  const isValid = studentId && feeId && selectedPaymentMethod && transactionId;
  document.getElementById('submit-payment-btn').disabled = !isValid;
}

// Monitor transaction ID input
document.addEventListener('input', function(e) {
  if (e.target.id === 'transaction-id') {
    checkFormValidity();
  }
});

function submitManualPayment() {
  const studentId = document.getElementById('pay-student').value;
  const feeId = document.getElementById('pay-fee').value;
  const transactionId = document.getElementById('transaction-id').value.trim();
  const notes = document.getElementById('payment-notes').value.trim();

  const student = Storage.getById('students', studentId);
  const fee = Storage.getById('fees', feeId);

  if (!student || !fee) {
    Toast.show('Please select student and fee', 'error');
    return;
  }

  // Create pending payment request
  const paymentRequest = {
    id: generateId(),
    academyId: State.getAcademyId(),
    studentId: studentId,
    studentName: student.name,
    class: student.class,
    feeId: feeId,
    feeMonth: fee.month,
    feeYear: fee.year,
    amount: (fee.amount || 0) - (fee.paidAmount || 0),
    paymentMethod: selectedPaymentMethod,
    transactionId: transactionId,
    screenshot: uploadedScreenshot,
    notes: notes,
    status: 'pending', // pending, approved, rejected
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null
  };

  Storage.save('payment_requests', paymentRequest);

  Notifications.add('info', 'Payment Submitted', `${student.name} submitted ${formatCurrency(paymentRequest.amount)} via ${selectedPaymentMethod}`);
  Toast.show('Payment request submitted! Admin will verify soon.', 'success');

  // Reset form
  Router.navigate('payments');
}

// ==================================================
// ADMIN PAYMENT VERIFICATION DASHBOARD
// ==================================================

function renderPaymentVerification() {
  const pendingRequests = Storage.getAll('payment_requests').filter(r => r.status === 'pending');
  const allRequests = Storage.getAll('payment_requests').reverse();

  return `
    <div class="content-header">
      <div>
        <h1>🔍 Payment Verification</h1>
        <p>${pendingRequests.length} pending requests</p>
      </div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <div class="filter-tabs">
          <button class="filter-tab active" onclick="filterPaymentRequests('all')">All</button>
          <button class="filter-tab" onclick="filterPaymentRequests('pending')">Pending</button>
          <button class="filter-tab" onclick="filterPaymentRequests('approved')">Approved</button>
          <button class="filter-tab" onclick="filterPaymentRequests('rejected')">Rejected</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allRequests.length === 0 ?
              `<tr><td colspan="7" class="empty-state-cell">
                <div class="empty-state">
                  <div class="empty-icon">🔍</div>
                  <h4>No payment requests</h4>
                </div>
              </td></tr>` :
              allRequests.map(req => `
                <tr>
                  <td>${formatDate(req.submittedAt)}</td>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar-small">${req.studentName.charAt(0).toUpperCase()}</div>
                      <div>
                        <div class="user-name">${escapeHtml(req.studentName)}</div>
                        <div class="user-meta">${escapeHtml(req.class)}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:600">${formatCurrency(req.amount)}</td>
                  <td><span class="badge badge-light">${escapeHtml(req.paymentMethod)}</span></td>
                  <td><code style="background:var(--gray-100);padding:2px 6px;border-radius:4px;font-size:12px">${escapeHtml(req.transactionId)}</code></td>
                  <td><span class="badge badge-${req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'amber'}">${req.status}</span></td>
                  <td>
                    <div class="action-btns">
                      ${req.status === 'pending' ? `
                        <button class="btn btn-ghost btn-sm" onclick="viewPaymentRequest('${req.id}')" title="View">👁</button>
                        <button class="btn btn-ghost btn-sm" style="color:var(--green)" onclick="approvePayment('${req.id}')" title="Approve">✓</button>
                        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="rejectPayment('${req.id}')" title="Reject">✕</button>
                      ` : `
                        <button class="btn btn-ghost btn-sm" onclick="viewPaymentRequest('${req.id}')" title="View">👁</button>
                      `}
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

function viewPaymentRequest(id) {
  const req = Storage.getById('payment_requests', id);
  if (!req) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="modal" style="max-width:600px">
      <div class="modal-header">
        <h3>Payment Request Details</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div>
            <div style="font-size:12px;color:var(--gray-500)">Student</div>
            <div style="font-weight:600">${escapeHtml(req.studentName)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--gray-500)">Class</div>
            <div style="font-weight:600">${escapeHtml(req.class)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--gray-500)">Amount</div>
            <div style="font-weight:600;font-size:18px;color:var(--navy)">${formatCurrency(req.amount)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--gray-500)">Method</div>
            <div style="font-weight:600">${escapeHtml(req.paymentMethod)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--gray-500)">Transaction ID</div>
            <div style="font-weight:600"><code>${escapeHtml(req.transactionId)}</code></div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--gray-500)">Status</div>
            <span class="badge badge-${req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'amber'}">${req.status}</span>
          </div>
        </div>

        ${req.screenshot ? `
          <div style="margin-bottom:20px">
            <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px">Screenshot</div>
            <img src="${req.screenshot}" style="max-width:100%;border-radius:var(--radius);border:1px solid var(--gray-200)">
          </div>
        ` : ''}

        ${req.notes ? `
          <div style="margin-bottom:20px">
            <div style="font-size:12px;color:var(--gray-500);margin-bottom:4px">Notes</div>
            <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius)">${escapeHtml(req.notes)}</div>
          </div>
        ` : ''}

        <div style="font-size:12px;color:var(--gray-400)">
          Submitted: ${formatDateTime(req.submittedAt)}
        </div>
      </div>
      ${req.status === 'pending' ? `
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Close</button>
          <button class="btn btn-danger" onclick="rejectPayment('${req.id}');this.closest('.modal-overlay').remove()">Reject</button>
          <button class="btn btn-primary" onclick="approvePayment('${req.id}');this.closest('.modal-overlay').remove()">Approve Payment</button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function approvePayment(id) {
  const req = Storage.getById('payment_requests', id);
  if (!req) return;

  req.status = 'approved';
  req.verifiedAt = new Date().toISOString();
  req.verifiedBy = State.currentUser?.id;
  Storage.save('payment_requests', req);

  // Update fee record
  const fee = Storage.getById('fees', req.feeId);
  if (fee) {
    fee.paidAmount = (fee.paidAmount || 0) + req.amount;
    if (fee.paidAmount >= fee.amount) {
      fee.status = 'paid';
      fee.paidDate = new Date().toISOString();
    } else {
      fee.status = 'partial';
    }
    Storage.save('fees', fee);
  }

  // Add to payments
  Storage.save('payments', {
    id: generateId(),
    academyId: State.getAcademyId(),
    studentId: req.studentId,
    studentName: req.studentName,
    class: req.class,
    amount: req.amount,
    month: req.feeMonth,
    year: req.feeYear,
    date: new Date().toISOString(),
    method: req.paymentMethod,
    notes: `Transaction: ${req.transactionId}`
  });

  Notifications.add('success', 'Payment Approved', `${formatCurrency(req.amount)} from ${req.studentName} approved`);
  Toast.show('Payment approved successfully!', 'success');
  Router.render();
}

function rejectPayment(id) {
  const req = Storage.getById('payment_requests', id);
  if (!req) return;

  req.status = 'rejected';
  req.verifiedAt = new Date().toISOString();
  req.verifiedBy = State.currentUser?.id;
  Storage.save('payment_requests', req);

  Notifications.add('error', 'Payment Rejected', `${req.studentName}'s payment of ${formatCurrency(req.amount)} was rejected`);
  Toast.show('Payment rejected', 'warning');
  Router.render();
}

function filterPaymentRequests(status) {
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');

  const allRequests = Storage.getAll('payment_requests').reverse();
  const filtered = status === 'all' ? allRequests : allRequests.filter(r => r.status === status);

  // Re-render table body
  const tbody = document.querySelector('.data-table tbody');
  tbody.innerHTML = filtered.length === 0 ?
    `<tr><td colspan="7" class="empty-state-cell"><div class="empty-state"><div class="empty-icon">🔍</div><h4>No requests found</h4></div></td></tr>` :
    filtered.map(req => `
      <tr>
        <td>${formatDate(req.submittedAt)}</td>
        <td>
          <div class="user-cell">
            <div class="user-avatar-small">${req.studentName.charAt(0).toUpperCase()}</div>
            <div><div class="user-name">${escapeHtml(req.studentName)}</div><div class="user-meta">${escapeHtml(req.class)}</div></div>
          </div>
        </td>
        <td style="font-weight:600">${formatCurrency(req.amount)}</td>
        <td><span class="badge badge-light">${escapeHtml(req.paymentMethod)}</span></td>
        <td><code style="background:var(--gray-100);padding:2px 6px;border-radius:4px;font-size:12px">${escapeHtml(req.transactionId)}</code></td>
        <td><span class="badge badge-${req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'amber'}">${req.status}</span></td>
        <td>
          <div class="action-btns">
            ${req.status === 'pending' ? `
              <button class="btn btn-ghost btn-sm" onclick="viewPaymentRequest('${req.id}')">👁</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--green)" onclick="approvePayment('${req.id}')">✓</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="rejectPayment('${req.id}')">✕</button>
            ` : `<button class="btn btn-ghost btn-sm" onclick="viewPaymentRequest('${req.id}')">👁</button>`}
          </div>
        </td>
      </tr>
    `).join('');
}
