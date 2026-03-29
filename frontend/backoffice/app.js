const API = window.location.origin + '/api';

let otpTimerInterval = null;

// --- Form Toggling ---
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
});

// --- Register ---
document.getElementById('register-btn').addEventListener('click', async () => {
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');
  errorEl.textContent = '';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'Registration failed';
      return;
    }
    // Auto-login after registration
    await doLogin(email, password);
  } catch {
    errorEl.textContent = 'Network error';
  }
});

// --- Login ---
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  await doLogin(email, password);
});

async function doLogin(email, password) {
  const errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'Login failed';
      return;
    }
    // QR activate에서 리다이렉트된 경우 원래 URL로 복귀
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('return');
    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }
    showDashboard(data.user.email);
  } catch {
    errorEl.textContent = 'Network error';
  }
}

// --- Dashboard ---
function showDashboard(email) {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  document.getElementById('user-email').textContent = email;
  loadFiles();
}

// --- Logout ---
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('otp-display').classList.add('hidden');
});

// --- Session Restore on Page Load ---
(async () => {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      showDashboard(data.user.email);
    }
  } catch {
    // No valid session, show login form
  }
})();

// --- File List ---
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function loadFiles() {
  const container = document.getElementById('files-list');
  container.innerHTML = '<p class="hint">Loading...</p>';

  try {
    const res = await fetch(`${API}/files`, { credentials: 'include' });
    if (!res.ok) {
      container.innerHTML = '<p class="hint">Failed to load files</p>';
      return;
    }
    const { files } = await res.json();

    if (files.length === 0) {
      container.innerHTML = '<p class="files-empty">No files uploaded yet</p>';
      return;
    }

    container.innerHTML = files.map(f => `
      <div class="file-row">
        <div class="file-info">
          <div class="file-name" title="${f.original_name}">${f.original_name}</div>
          <div class="file-meta">${formatFileSize(Number(f.size_bytes))} · ${new Date(f.created_at).toLocaleDateString()}</div>
        </div>
        <button class="btn-download" data-id="${f.id}">Download</button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `${API}/files/${btn.dataset.id}/download`;
      });
    });
  } catch {
    container.innerHTML = '<p class="hint">Network error</p>';
  }
}

document.getElementById('refresh-files-btn').addEventListener('click', loadFiles);

// --- OTP Generation ---
document.getElementById('otp-btn').addEventListener('click', async () => {
  const btn = document.getElementById('otp-btn');
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/otp/generate`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      btn.disabled = false;
      return;
    }

    const display = document.getElementById('otp-display');
    display.classList.remove('hidden');
    document.getElementById('otp-code').textContent = data.code;

    // Start countdown
    const expiresAt = new Date(data.expiresAt);
    if (otpTimerInterval) clearInterval(otpTimerInterval);

    otpTimerInterval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        clearInterval(otpTimerInterval);
        document.getElementById('otp-timer').textContent = 'Expired';
        document.getElementById('otp-code').style.color = '#475569';
        btn.disabled = false;
        return;
      }
      const sec = Math.ceil(remaining / 1000);
      document.getElementById('otp-timer').textContent = `Expires in ${sec}s`;
    }, 1000);
  } catch {
    btn.disabled = false;
  }
});
