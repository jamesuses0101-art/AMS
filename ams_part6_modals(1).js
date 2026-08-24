
// ==================================================
// 24. MODALS SYSTEM (from original code - preserved & enhanced)
// ==================================================

function openModal(type, param = null) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'active-modal';
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  let modalContent = '';

  switch(type) {
    case 'addStudent':
      modalContent = renderAddStudentModal();
      break;
    case 'editStudent':
      modalContent = renderEditStudentModal(param);
      break;
    case 'addClass':
      modalContent = renderAddClassModal();
      break;
    case 'editClass':
      modalContent = renderEditClassModal(param);
      break;
    case 'addTeacher':
      modalContent = renderAddTeacherModal();
      break;
    case 'editTeacher':
      modalContent = renderEditTeacherModal(param);
      break;
    case 'addExpense':
      modalContent = renderAddExpenseModal();
      break;
    case 'recordPayment':
      modalContent = renderRecordPaymentModal(param);
      break;
    case 'upgradePlan':
      modalContent = renderUpgradePlanModal();
      break;
    default:
      return;
  }

  overlay.innerHTML = modalContent;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('active-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 200);
  }
}

function renderAddStudentModal() {
  if (!State.canAddStudent()) {
    const limit = State.getStudentLimit();
    return `
      <div class="modal">
        <div class="modal-header">
          <h3>Student Limit Reached</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="text-align:center;padding:40px">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--amber-50);color:var(--amber);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px">⚠️</div>
          <h4 style="margin-bottom:8px">You've reached your ${limit} student limit</h4>
          <p style="color:var(--gray-500);margin-bottom:24px">Upgrade your plan to add more students and unlock more features.</p>
          <button class="btn btn-primary" onclick="closeModal();openModal('upgradePlan')">Upgrade Plan</button>
        </div>
      </div>
    `;
  }

  const classes = [...new Set(Storage.getAll('classes').map(c => c.name))];

  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Add New Student</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleAddStudent(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Student Name *</label>
              <input type="text" class="form-input" name="name" placeholder="Full name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Guardian Name</label>
              <input type="text" class="form-input" name="guardian" placeholder="Father/Guardian name">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" name="phone" placeholder="+92 300 1234567">
            </div>
            <div class="form-group">
              <label class="form-label">Class *</label>
              <div class="select-wrapper">
                <select class="form-select" name="class" required>
                  <option value="">Select class</option>
                  ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
                  ${classes.length === 0 ? '<option value="9th">9th</option><option value="10th">10th</option><option value="11th">11th</option><option value="12th">12th</option>' : ''}
                </select>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Monthly Fee (Rs)</label>
              <input type="number" class="form-input" name="monthlyFee" value="3000" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Admission Date</label>
              <input type="date" class="form-input" name="admissionDate" value="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input type="text" class="form-input" name="address" placeholder="Full address">
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes" placeholder="Any additional notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Student</button>
        </div>
      </form>
    </div>
  `;
}

function handleAddStudent(e) {
  e.preventDefault();
  const form = e.target;

  const student = {
    id: generateId(),
    academyId: State.getAcademyId(),
    name: form.name.value.trim(),
    guardian: form.guardian.value.trim() || '-',
    phone: form.phone.value.trim() || '-',
    class: form.class.value,
    monthlyFee: Number(form.monthlyFee.value) || 3000,
    admissionDate: form.admissionDate.value ? new Date(form.admissionDate.value).toISOString() : new Date().toISOString(),
    address: form.address.value.trim() || '',
    notes: form.notes.value.trim() || '',
    status: 'active'
  };

  Storage.save('students', student);

  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  Storage.save('fees', {
    id: generateId(),
    academyId: State.getAcademyId(),
    studentId: student.id,
    studentName: student.name,
    class: student.class,
    month: CONFIG.MONTHS[currentMonthIdx],
    year: currentYear,
    amount: student.monthlyFee,
    status: 'pending',
    paidAmount: 0,
    paidDate: null
  });

  if (new Date().getDate() <= 5 && currentMonthIdx > 0) {
    Storage.save('fees', {
      id: generateId(),
      academyId: State.getAcademyId(),
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      month: CONFIG.MONTHS[currentMonthIdx - 1],
      year: currentYear,
      amount: student.monthlyFee,
      status: 'pending',
      paidAmount: 0,
      paidDate: null
    });
  }

  Notifications.add('success', 'New student added', `${student.name} has been added to ${student.class}`);
  Toast.show('Student added successfully', 'success');
  closeModal();
  Router.render();
}

function openEditStudent(id) {
  openModal('editStudent', id);
}

function renderEditStudentModal(id) {
  const student = Storage.getById('students', id);
  if (!student) return '';

  const classes = [...new Set(Storage.getAll('classes').map(c => c.name))];

  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Edit Student</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleEditStudent(event, '${id}')">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Student Name</label>
              <input type="text" class="form-input" name="name" value="${escapeHtml(student.name)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Guardian Name</label>
              <input type="text" class="form-input" name="guardian" value="${escapeHtml(student.guardian || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" name="phone" value="${escapeHtml(student.phone || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Class</label>
              <div class="select-wrapper">
                <select class="form-select" name="class">
                  ${classes.map(c => `<option value="${c}" ${student.class===c?'selected':''}>${c}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Monthly Fee</label>
              <input type="number" class="form-input" name="monthlyFee" value="${student.monthlyFee || 3000}">
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <div class="select-wrapper">
                <select class="form-select" name="status">
                  <option value="active" ${student.status==='active'?'selected':''}>Active</option>
                  <option value="inactive" ${student.status==='inactive'?'selected':''}>Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input type="text" class="form-input" name="address" value="${escapeHtml(student.address || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${escapeHtml(student.notes || '')}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
}

function handleEditStudent(e, id) {
  e.preventDefault();
  const student = Storage.getById('students', id);
  if (!student) return;

  const oldClass = student.class;
  student.name = e.target.name.value.trim();
  student.guardian = e.target.guardian.value.trim() || '-';
  student.phone = e.target.phone.value.trim() || '-';
  student.class = e.target.class.value;
  student.monthlyFee = Number(e.target.monthlyFee.value) || 3000;
  student.status = e.target.status.value;
  student.address = e.target.address.value.trim() || '';
  student.notes = e.target.notes.value.trim() || '';

  Storage.save('students', student);

  const fees = Storage.getAll('fees').filter(f => f.studentId === id);
  fees.forEach(f => {
    f.studentName = student.name;
    f.class = student.class;
    Storage.save('fees', f);
  });

  const payments = Storage.getAll('payments').filter(p => p.studentId === id);
  payments.forEach(p => {
    p.studentName = student.name;
    p.class = student.class;
    Storage.save('payments', p);
  });

  const attendance = Storage.getAll('attendance').filter(a => a.studentId === id);
  attendance.forEach(a => {
    a.studentName = student.name;
    a.class = student.class;
    Storage.save('attendance', a);
  });

  Toast.show('Student updated', 'success');
  closeModal();
  Router.render();
}

function renderAddClassModal() {
  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Add New Class</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleAddClass(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Class Name *</label>
              <input type="text" class="form-input" name="name" placeholder="e.g. 10th" required>
            </div>
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" class="form-input" name="subject" placeholder="e.g. Physics">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Monthly Fee (Rs)</label>
              <input type="number" class="form-input" name="monthlyFee" value="3000">
            </div>
            <div class="form-group">
              <label class="form-label">Teacher</label>
              <input type="text" class="form-input" name="teacherName" placeholder="Teacher name">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Schedule</label>
            <input type="text" class="form-input" name="schedule" placeholder="e.g. Mon-Fri, 4PM-6PM">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Class</button>
        </div>
      </form>
    </div>
  `;
}

function handleAddClass(e) {
  e.preventDefault();
  const form = e.target;
  Storage.save('classes', {
    id: generateId(),
    academyId: State.getAcademyId(),
    name: form.name.value.trim(),
    subject: form.subject.value.trim() || '',
    teacherName: form.teacherName.value.trim() || '',
    monthlyFee: Number(form.monthlyFee.value) || 3000,
    schedule: form.schedule.value.trim() || '',
    status: 'active'
  });
  Toast.show('Class added', 'success');
  closeModal();
  Router.render();
}

function openEditClass(id) {
  openModal('editClass', id);
}

function renderEditClassModal(id) {
  const cls = Storage.getById('classes', id);
  if (!cls) return '';

  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Edit Class</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleEditClass(event, '${id}')">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Class Name</label>
              <input type="text" class="form-input" name="name" value="${escapeHtml(cls.name)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" class="form-input" name="subject" value="${escapeHtml(cls.subject || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Monthly Fee (Rs)</label>
              <input type="number" class="form-input" name="monthlyFee" value="${cls.monthlyFee || 3000}">
            </div>
            <div class="form-group">
              <label class="form-label">Teacher</label>
              <input type="text" class="form-input" name="teacherName" value="${escapeHtml(cls.teacherName || '')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Schedule</label>
            <input type="text" class="form-input" name="schedule" value="${escapeHtml(cls.schedule || '')}">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
}

function handleEditClass(e, id) {
  e.preventDefault();
  const cls = Storage.getById('classes', id);
  if (!cls) return;

  cls.name = e.target.name.value.trim();
  cls.subject = e.target.subject.value.trim() || '';
  cls.monthlyFee = Number(e.target.monthlyFee.value) || 3000;
  cls.teacherName = e.target.teacherName.value.trim() || '';
  cls.schedule = e.target.schedule.value.trim() || '';

  Storage.save('classes', cls);
  Toast.show('Class updated', 'success');
  closeModal();
  Router.render();
}

function renderAddTeacherModal() {
  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Add New Teacher</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleAddTeacher(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input type="text" class="form-input" name="name" placeholder="Full name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" name="phone" placeholder="+92 300 1234567">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" class="form-input" name="subject" placeholder="e.g. Mathematics">
            </div>
            <div class="form-group">
              <label class="form-label">Salary (Rs/month)</label>
              <input type="number" class="form-input" name="salary" value="35000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Classes (comma separated)</label>
            <input type="text" class="form-input" name="classes" placeholder="9th, 10th, 11th">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Teacher</button>
        </div>
      </form>
    </div>
  `;
}

function handleAddTeacher(e) {
  e.preventDefault();
  const form = e.target;
  Storage.save('teachers', {
    id: generateId(),
    academyId: State.getAcademyId(),
    name: form.name.value.trim(),
    phone: form.phone.value.trim() || '-',
    subject: form.subject.value.trim() || '',
    salary: Number(form.salary.value) || 35000,
    classes: form.classes.value.split(',').map(c => c.trim()).filter(Boolean),
    status: 'active'
  });
  Toast.show('Teacher added', 'success');
  closeModal();
  Router.render();
}

function openEditTeacher(id) {
  openModal('editTeacher', id);
}

function renderEditTeacherModal(id) {
  const teacher = Storage.getById('teachers', id);
  if (!teacher) return '';

  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Edit Teacher</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleEditTeacher(event, '${id}')">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" name="name" value="${escapeHtml(teacher.name)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" name="phone" value="${escapeHtml(teacher.phone || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" class="form-input" name="subject" value="${escapeHtml(teacher.subject || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Salary</label>
              <input type="number" class="form-input" name="salary" value="${teacher.salary || 35000}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Classes</label>
            <input type="text" class="form-input" name="classes" value="${teacher.classes?.join(', ') || ''}">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
}

function handleEditTeacher(e, id) {
  e.preventDefault();
  const teacher = Storage.getById('teachers', id);
  if (!teacher) return;

  teacher.name = e.target.name.value.trim();
  teacher.phone = e.target.phone.value.trim() || '-';
  teacher.subject = e.target.subject.value.trim() || '';
  teacher.salary = Number(e.target.salary.value) || 35000;
  teacher.classes = e.target.classes.value.split(',').map(c => c.trim()).filter(Boolean);

  Storage.save('teachers', teacher);
  Toast.show('Teacher updated', 'success');
  closeModal();
  Router.render();
}

function renderAddExpenseModal() {
  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Add Expense</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleAddExpense(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-input" name="title" placeholder="e.g. Academy Rent" required>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <div class="select-wrapper">
                <select class="form-select" name="category">
                  ${CONFIG.EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Amount (Rs) *</label>
              <input type="number" class="form-input" name="amount" placeholder="0" required min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes" placeholder="Optional notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Expense</button>
        </div>
      </form>
    </div>
  `;
}

function handleAddExpense(e) {
  e.preventDefault();
  const form = e.target;
  Storage.save('expenses', {
    id: generateId(),
    academyId: State.getAcademyId(),
    title: form.title.value.trim(),
    category: form.category.value,
    amount: Number(form.amount.value) || 0,
    date: form.date.value ? new Date(form.date.value).toISOString() : new Date().toISOString(),
    notes: form.notes.value.trim() || ''
  });
  Notifications.add('info', 'Expense added', `${form.title.value} — ${formatCurrency(form.amount.value)}`);
  Toast.show('Expense recorded', 'success');
  closeModal();
  Router.render();
}

function renderRecordPaymentModal(studentId = null) {
  const students = Storage.getAll('students');
  const preselected = studentId ? students.find(s => s.id === studentId) : null;

  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Record Payment</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <form onsubmit="handleRecordPayment(event)">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Student *</label>
            <div class="select-wrapper">
              <select class="form-select" name="studentId" ${preselected?'disabled':''} required>
                <option value="">Select student</option>
                ${students.map(s => `<option value="${s.id}" ${preselected?.id===s.id?'selected':''}>${escapeHtml(s.name)} — ${s.class}</option>`).join('')}
              </select>
            </div>
            ${preselected?`<input type="hidden" name="studentId" value="${preselected.id}">`:''}
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Amount (Rs) *</label>
              <input type="number" class="form-input" name="amount" placeholder="0" required min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Month</label>
              <div class="select-wrapper">
                <select class="form-select" name="month">
                  ${CONFIG.MONTHS.map(m => `<option value="${m}" ${new Date().getMonth()===CONFIG.MONTHS.indexOf(m)?'selected':''}>${m}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <div class="select-wrapper">
                <select class="form-select" name="method">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="JazzCash">JazzCash</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes" placeholder="Optional notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Record Payment</button>
        </div>
      </form>
    </div>
  `;
}

function handleRecordPayment(e) {
  e.preventDefault();
  const form = e.target;
  const studentId = form.studentId.value;
  const student = Storage.getById('students', studentId);
  if (!student) {
    Toast.show('Student not found', 'error');
    return;
  }

  const amount = Number(form.amount.value) || 0;
  const month = form.month.value;
  const year = new Date().getFullYear();

  Storage.save('payments', {
    id: generateId(),
    academyId: State.getAcademyId(),
    studentId,
    studentName: student.name,
    class: student.class,
    amount,
    month,
    year,
    date: form.date.value ? new Date(form.date.value).toISOString() : new Date().toISOString(),
    method: form.method.value,
    notes: form.notes.value.trim() || ''
  });

  const fees = Storage.getAll('fees').filter(f => f.studentId === studentId && f.month === month && f.year === year);
  if (fees.length > 0) {
    const fee = fees[0];
    fee.paidAmount = (fee.paidAmount || 0) + amount;
    if (fee.paidAmount >= fee.amount) {
      fee.status = 'paid';
      fee.paidDate = new Date().toISOString();
    } else if (fee.paidAmount > 0) {
      fee.status = 'partial';
    }
    Storage.save('fees', fee);
  } else {
    Storage.save('fees', {
      id: generateId(),
      academyId: State.getAcademyId(),
      studentId,
      studentName: student.name,
      class: student.class,
      month,
      year,
      amount: student.monthlyFee,
      status: amount >= student.monthlyFee ? 'paid' : amount > 0 ? 'partial' : 'pending',
      paidAmount: amount,
      paidDate: amount > 0 ? new Date().toISOString() : null
    });
  }

  Notifications.add('success', 'Payment received', `${formatCurrency(amount)} from ${student.name}`);
  Toast.show('Payment recorded successfully', 'success');
  closeModal();
  Router.render();
}

function renderUpgradePlanModal() {
  selectedPlanKey = null;
  return `
    <div class="modal">
      <div class="modal-header">
        <h3>Upgrade Your Plan</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${Object.entries(CONFIG.PLANS).map(([key, plan]) => `
            <div style="border:2px solid ${State.getPlan()===key?'var(--blue)':'var(--gray-200)'};border-radius:var(--radius);padding:16px;text-align:center;cursor:pointer;transition:all 0.2s" onclick="selectPlan('${key}')" class="plan-option" data-plan="${key}">
              <div style="font-size:14px;font-weight:600;margin-bottom:4px">${plan.name}</div>
              <div style="font-size:24px;font-weight:800;color:var(--navy)">Rs ${plan.price.toLocaleString()}</div>
              <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px">per month</div>
              <div style="font-size:13px;color:var(--gray-600)">Up to ${plan.limit} students</div>
              ${State.getPlan()===key?'<div style="margin-top:8px"><span class="badge badge-blue">Current</span></div>':''}
            </div>
          `).join('')}
        </div>
        <p style="font-size:12px;color:var(--gray-400);text-align:center;margin-top:16px">This is a demo. In production, this would connect to a payment gateway.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="confirmPlanUpgrade()">Upgrade</button>
      </div>
    </div>
  `;
}

let selectedPlanKey = null;

function selectPlan(key) {
  selectedPlanKey = key;
  document.querySelectorAll('.plan-option').forEach(el => {
    el.style.borderColor = el.dataset.plan === key ? 'var(--blue)' : 'var(--gray-200)';
    el.style.background = el.dataset.plan === key ? 'var(--blue-50)' : '';
  });
}

function confirmPlanUpgrade() {
  if (!selectedPlanKey) {
    Toast.show('Please select a plan', 'warning');
    return;
  }
  const academy = State.currentAcademy;
  academy.plan = selectedPlanKey;

  const academies = Storage.getAll('academies');
  const idx = academies.findIndex(a => a.id === academy.id);
  if (idx >= 0) academies[idx] = academy;
  Storage.setGlobal('academies', academies);
  State.currentAcademy = academy;

  Toast.show(`Upgraded to ${CONFIG.PLANS[selectedPlanKey].name}!`, 'success');
  closeModal();
  Router.render();
}
