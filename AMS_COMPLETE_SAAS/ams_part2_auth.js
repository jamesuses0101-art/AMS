
// ==================================================
// 8. AUTHENTICATION PAGES
// ==================================================

function renderLogin() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon">📚</div>
          <h1>AMS</h1>
          <p>Academy Management System</p>
        </div>

        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" placeholder="you@academy.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>

        <div class="auth-divider">
          <span>or</span>
        </div>

        <button class="btn btn-secondary btn-block" onclick="loginDemo()">
          <span>🚀</span> Try Demo Account
        </button>

        <div class="auth-links">
          <a onclick="Router.navigate('forgot')">Forgot password?</a>
          <a onclick="Router.navigate('signup')">Create account</a>
        </div>

        <div class="auth-footer">
          <p style="font-size:12px;color:var(--gray-400);text-align:center;margin-top:16px">
            🔒 This is a frontend demo using localStorage.<br>
            Data is stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderSignup() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon">📚</div>
          <h1>Create Account</h1>
          <p>Start managing your academy</p>
        </div>

        <form onsubmit="handleSignup(event)">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" name="fullName" placeholder="Your name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Academy Name</label>
            <input type="text" class="form-input" name="academyName" placeholder="Your academy name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" placeholder="you@academy.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="Min 6 characters" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Create Account</button>
        </form>

        <div class="auth-links">
          <a onclick="Router.navigate('login')">Already have an account? Sign in</a>
        </div>
      </div>
    </div>
  `;
}

function renderForgot() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon">🔐</div>
          <h1>Reset Password</h1>
          <p>Enter your email to reset</p>
        </div>

        <form onsubmit="handleForgot(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" placeholder="you@academy.com" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
        </form>

        <div class="auth-links">
          <a onclick="Router.navigate('login')">Back to login</a>
        </div>

        <p style="font-size:12px;color:var(--gray-400);text-align:center;margin-top:16px">
          Demo: Use <strong>demo@ams.com / demo123</strong>
        </p>
      </div>
    </div>
  `;
}

// ==================================================
// 9. AUTH HANDLERS
// ==================================================

function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;

  // Check demo account
  if (email === CONFIG.DEMO_ACCOUNT.email && password === CONFIG.DEMO_ACCOUNT.password) {
    loginDemo();
    return;
  }

  const users = Storage.getAll('users');
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    Toast.show('Invalid email or password', 'error');
    return;
  }

  State.login(user);
  Toast.show('Welcome back, ' + user.fullName + '!', 'success');

  if (!State.currentAcademy?.onboardingComplete) {
    Router.navigate('onboarding');
  } else {
    Router.navigate('dashboard');
  }
}

function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim().toLowerCase();

  // Check if email exists
  const existing = Storage.getAll('users').find(u => u.email === email);
  if (existing) {
    Toast.show('Email already registered', 'error');
    return;
  }

  // Create academy
  const academy = {
    id: generateId(),
    name: form.academyName.value.trim(),
    plan: 'free',
    onboardingComplete: false,
    createdAt: new Date().toISOString()
  };
  Storage.save('academies', academy);

  // Create user
  const user = {
    id: generateId(),
    fullName: form.fullName.value.trim(),
    email: email,
    password: form.password.value,
    academyId: academy.id,
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  Storage.save('users', user);

  State.login(user);
  Toast.show('Account created! Let's set up your academy.', 'success');
  Router.navigate('onboarding');
}

function handleForgot(e) {
  e.preventDefault();
  Toast.show('Password reset link sent (demo functionality)', 'success');
  setTimeout(() => Router.navigate('login'), 1500);
}

function loginDemo() {
  // Clear existing demo data
  const demoEmail = CONFIG.DEMO_ACCOUNT.email;
  const existingUsers = Storage.getAll('users');
  const existingDemo = existingUsers.find(u => u.email === demoEmail);

  if (existingDemo) {
    // Reuse existing demo account
    State.login(existingDemo);
  } else {
    // Create fresh demo data
    const academy = {
      id: generateId(),
      name: CONFIG.DEMO_ACCOUNT.academy.name,
      plan: CONFIG.DEMO_ACCOUNT.academy.plan,
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    };
    Storage.save('academies', academy);

    const user = {
      id: generateId(),
      fullName: 'Demo User',
      email: demoEmail,
      password: CONFIG.DEMO_ACCOUNT.password,
      academyId: academy.id,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    Storage.save('users', user);

    // Create demo classes
    CONFIG.DEMO_ACCOUNT.academy.classes.forEach(c => {
      Storage.save('classes', {
        id: generateId(),
        academyId: academy.id,
        ...c,
        status: 'active'
      });
    });

    // Create demo teachers
    CONFIG.DEMO_ACCOUNT.academy.teachers.forEach(t => {
      Storage.save('teachers', {
        id: generateId(),
        academyId: academy.id,
        ...t,
        status: 'active'
      });
    });

    // Create demo students with fees
    const currentMonth = CONFIG.MONTHS[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    CONFIG.DEMO_ACCOUNT.academy.students.forEach(s => {
      const student = {
        id: generateId(),
        academyId: academy.id,
        ...s,
        admissionDate: new Date().toISOString(),
        notes: '',
        status: 'active'
      };
      Storage.save('students', student);

      // Generate fee
      Storage.save('fees', {
        id: generateId(),
        academyId: academy.id,
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        month: currentMonth,
        year: currentYear,
        amount: student.monthlyFee,
        status: 'pending',
        paidAmount: 0,
        paidDate: null
      });
    });

    // Add some sample payments
    const students = Storage.getAll('students');
    if (students[0]) {
      Storage.save('payments', {
        id: generateId(),
        academyId: academy.id,
        studentId: students[0].id,
        studentName: students[0].name,
        class: students[0].class,
        amount: 3500,
        month: currentMonth,
        year: currentYear,
        date: new Date().toISOString(),
        method: 'Cash',
        notes: ''
      });

      // Update fee
      const fees = Storage.getAll('fees').filter(f => f.studentId === students[0].id && f.month === currentMonth);
      if (fees[0]) {
        fees[0].paidAmount = 3500;
        fees[0].status = 'paid';
        fees[0].paidDate = new Date().toISOString();
        Storage.save('fees', fees[0]);
      }
    }

    // Add sample expenses
    Storage.save('expenses', {
      id: generateId(),
      academyId: academy.id,
      title: 'Academy Rent',
      category: 'Rent',
      amount: 25000,
      date: new Date().toISOString(),
      notes: 'Monthly rent'
    });

    Storage.save('expenses', {
      id: generateId(),
      academyId: academy.id,
      title: 'Electricity Bill',
      category: 'Utilities',
      amount: 3500,
      date: new Date().toISOString(),
      notes: ''
    });

    // Add sample attendance
    const today = new Date().toISOString().split('T')[0];
    students.slice(0, 3).forEach((s, i) => {
      Storage.save('attendance', {
        id: generateId(),
        academyId: academy.id,
        studentId: s.id,
        studentName: s.name,
        class: s.class,
        date: today,
        status: i === 2 ? 'absent' : 'present',
        notes: ''
      });
    });

    State.login(user);
  }

  Toast.show('Demo account loaded!', 'success');
  Router.navigate('dashboard');
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    State.logout();
    Toast.show('Logged out successfully', 'info');
    Router.navigate('login');
  }
}
