// 인증 상태 관리
let isAuthenticated = false;
let authToken = null;
let authExpiry = null;

// DOM 요소
const authSection = document.getElementById('auth-section');
const uploadSection = document.getElementById('upload-section');
const qrCode = document.getElementById('qr-code');
const authStatus = document.getElementById('auth-status');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const uploadStatus = document.getElementById('upload-status');
const fileList = document.getElementById('file-list');

// 초기화
init();

async function init() {
    // QR 코드 생성 및 인증 상태 확인
    await generateQRCode();
    checkAuthStatus();
    
    // 인증 상태 확인 주기적 체크 (1초마다)
    setInterval(checkAuthStatus, 1000);
    
    // 드롭 존 이벤트
    setupDropZone();
}

// QR 코드 생성
async function generateQRCode() {
    try {
        const response = await fetch('/api/auth/qr');
        const data = await response.json();
        
        // QR 코드 이미지 생성 (간단한 텍스트 표시로 대체, 실제로는 qrcode 라이브러리 사용)
        const qrText = data.token || 'QR_CODE_PLACEHOLDER';
        // 실제 구현에서는 QRCode.toCanvas() 사용
        qrCode.getContext('2d').fillText('QR 코드', 50, 50);
    } catch (error) {
        console.error('QR 코드 생성 실패:', error);
        authStatus.textContent = 'QR 코드 생성 실패';
        authStatus.className = 'status-message error';
    }
}

// 인증 상태 확인
async function checkAuthStatus() {
    if (authExpiry && Date.now() > authExpiry) {
        // 인증 만료
        isAuthenticated = false;
        authToken = null;
        authExpiry = null;
        showAuthSection();
        return;
    }
    
    if (!isAuthenticated) {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                isAuthenticated = true;
                authToken = data.token;
                authExpiry = data.expiry;
                showUploadSection();
            }
        } catch (error) {
            console.error('인증 상태 확인 실패:', error);
        }
    }
}

// 인증 섹션 표시
function showAuthSection() {
    authSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
}

// 업로드 섹션 표시
function showUploadSection() {
    authSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
}

// 드롭 존 설정
function setupDropZone() {
    // 클릭 이벤트
    dropZone.addEventListener('click', () => {
        if (isAuthenticated) {
            fileInput.click();
        }
    });
    
    // 드래그 이벤트
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            dropZone.classList.add('drag-over');
        }
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        if (isAuthenticated && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // 파일 입력 변경
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });
}

// 파일 처리
async function handleFiles(files) {
    const fileArray = Array.from(files);
    
    // 미디어 파일만 필터링
    const mediaFiles = fileArray.filter(file => {
        const type = file.type;
        return type.startsWith('image/') || 
               type.startsWith('video/') || 
               type.startsWith('audio/');
    });
    
    if (mediaFiles.length === 0) {
        showStatus('미디어 파일만 업로드 가능합니다', 'error');
        return;
    }
    
    // 각 파일 업로드
    for (const file of mediaFiles) {
        await uploadFile(file);
    }
}

// 파일 업로드
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // 파일 리스트에 추가
    const fileItem = createFileItem(file.name);
    fileList.appendChild(fileItem);
    
    try {
        const xhr = new XMLHttpRequest();
        
        // 진행 상태 업데이트
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                updateProgress(percent);
                updateFileItemStatus(fileItem, 'uploading', `${Math.round(percent)}%`);
            }
        });
        
        // 완료 처리
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                updateFileItemStatus(fileItem, 'success', '완료');
                showStatus(`${file.name} 업로드 완료`, 'success');
            } else {
                updateFileItemStatus(fileItem, 'error', '실패');
                showStatus(`${file.name} 업로드 실패`, 'error');
            }
        });
        
        // 에러 처리
        xhr.addEventListener('error', () => {
            updateFileItemStatus(fileItem, 'error', '에러');
            showStatus(`${file.name} 업로드 중 에러 발생`, 'error');
        });
        
        // 요청 전송
        xhr.open('POST', '/api/upload');
        if (authToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }
        xhr.send(formData);
        
    } catch (error) {
        console.error('업로드 실패:', error);
        updateFileItemStatus(fileItem, 'error', '에러');
        showStatus(`${file.name} 업로드 실패`, 'error');
    }
}

// 파일 아이템 생성
function createFileItem(fileName) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
        <span class="file-name">${fileName}</span>
        <span class="file-status uploading">업로드 중...</span>
    `;
    return item;
}

// 파일 아이템 상태 업데이트
function updateFileItemStatus(item, status, text) {
    const statusEl = item.querySelector('.file-status');
    statusEl.className = `file-status ${status}`;
    statusEl.textContent = text;
}

// 진행 상태 업데이트
function updateProgress(percent) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;
    uploadProgress.classList.remove('hidden');
    
    if (percent >= 100) {
        setTimeout(() => {
            uploadProgress.classList.add('hidden');
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        }, 1000);
    }
}

// 상태 메시지 표시
function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `status-message ${type}`;
    
    setTimeout(() => {
        uploadStatus.textContent = '';
        uploadStatus.className = 'status-message';
    }, 5000);
}
