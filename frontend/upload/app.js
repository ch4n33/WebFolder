const API = window.location.origin + '/api';

let sessionToken = null;
let sessionExpiresAt = null;
let sessionSig = null;
let pollInterval = null;
let timerInterval = null;

// --- Tab Switching ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
  });
});

// --- QR Flow ---
async function initQrSession() {
  try {
    const res = await fetch(`${API}/session/init`, { method: 'POST' });
    const data = await res.json();
    sessionSig = data.sessionSig;

    const canvas = document.getElementById('qr-canvas');
    QRCode.toCanvas(canvas, data.qrUrl, { width: 200, margin: 2 });

    startPolling();
  } catch (err) {
    setStatus('qr-status', 'Failed to initialize session', 'error');
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/session/poll?sig=${sessionSig}`);
      const data = await res.json();
      if (data.active) {
        clearInterval(pollInterval);
        activateUpload(data.sessionToken, data.expiresAt);
      }
    } catch {
      // ignore polling errors
    }
  }, 1000);
}

// --- OTP Flow ---
document.getElementById('otp-submit').addEventListener('click', submitOtp);
document.getElementById('otp-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitOtp();
});

async function submitOtp() {
  const input = document.getElementById('otp-input');
  const code = input.value.trim();
  if (code.length !== 6) {
    setStatus('otp-status', 'Enter a 6-digit code', 'error');
    return;
  }

  const btn = document.getElementById('otp-submit');
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/session/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus('otp-status', data.error || 'Invalid OTP', 'error');
      btn.disabled = false;
      return;
    }

    activateUpload(data.sessionToken, data.expiresAt);
  } catch {
    setStatus('otp-status', 'Network error', 'error');
    btn.disabled = false;
  }
}

// --- Upload Activation ---
function activateUpload(token, expiresAt) {
  sessionToken = token;
  sessionExpiresAt = new Date(expiresAt);

  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('upload-section').classList.remove('hidden');

  startTimer();
  setupDropZone();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const totalMs = sessionExpiresAt - Date.now();

  timerInterval = setInterval(() => {
    const remaining = sessionExpiresAt - Date.now();
    if (remaining <= 0) {
      clearInterval(timerInterval);
      sessionExpired();
      return;
    }
    const pct = (remaining / totalMs) * 100;
    document.getElementById('timer-fill').style.width = `${pct}%`;
    const sec = Math.ceil(remaining / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    document.getElementById('timer-text').textContent = `${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

function sessionExpired() {
  sessionToken = null;
  document.getElementById('upload-section').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
  initQrSession();
}

// --- Drop Zone ---
function setupDropZone() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });
}

function handleFiles(fileList) {
  const allowed = /^(image|video|audio)\//;
  for (const file of fileList) {
    if (!allowed.test(file.type)) continue;
    uploadFile(file);
  }
}

function uploadFile(file) {
  const fileList = document.getElementById('file-list');
  const item = document.createElement('div');
  item.className = 'file-item';
  item.innerHTML = `
    <span class="name">${file.name}</span>
    <span class="size">${formatSize(file.size)}</span>
    <div class="progress-bar"><div class="fill" style="width:0%"></div></div>
    <span class="status-icon"></span>
  `;
  fileList.prepend(item);

  const fill = item.querySelector('.fill');
  const icon = item.querySelector('.status-icon');

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API}/upload`);
  xhr.setRequestHeader('Authorization', `Bearer ${sessionToken}`);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      fill.style.width = `${(e.loaded / e.total) * 100}%`;
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      fill.style.width = '100%';
      fill.style.background = '#16a34a';
      icon.textContent = '\u2713';
      icon.style.color = '#16a34a';
    } else {
      fill.style.background = '#dc2626';
      icon.textContent = '\u2717';
      icon.style.color = '#dc2626';
    }
  };

  xhr.onerror = () => {
    fill.style.background = '#dc2626';
    icon.textContent = '\u2717';
    icon.style.color = '#dc2626';
  };

  const formData = new FormData();
  formData.append('file', file);
  xhr.send(formData);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function setStatus(id, message, type) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = `status ${type || ''}`;
}

// --- Init ---
initQrSession();
