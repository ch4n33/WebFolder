const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// 업로드 디렉토리 생성
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 보안: 파일명 정규화 및 디렉토리 탈출 방지
function sanitizeFileName(fileName) {
    // 경로 구분자 제거 및 위험한 문자 필터링
    const sanitized = path.basename(fileName)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255); // 파일명 길이 제한
    
    return sanitized;
}

// Multer 설정 - 메모리 스토리지 사용 (보안 강화)
const storage = multer.memoryStorage();

// 파일 필터: 미디어 파일만 허용
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('미디어 파일만 업로드 가능합니다'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB 제한
    }
});

// Rate limiting
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 10, // 최대 10회 요청
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
});

// 인증 토큰 저장 (실제로는 Redis 등 사용 권장)
const authTokens = new Map();

// 인증 토큰 생성
function generateAuthToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// 인증 미들웨어
function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }
    
    const authData = authTokens.get(token);
    if (!authData || Date.now() > authData.expiry) {
        authTokens.delete(token);
        return res.status(401).json({ error: '인증이 만료되었습니다' });
    }
    
    req.authToken = token;
    next();
}

// API 라우트

// QR 코드 생성 (OTP 토큰 포함)
app.get('/api/auth/qr', (req, res) => {
    // 실제 구현에서는 otplib와 qrcode 라이브러리 사용
    // 여기서는 간단한 토큰 생성
    const token = generateAuthToken();
    
    // 환경 변수에서 사이트 URL 가져오기
    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const qrData = `${siteUrl}/auth?token=${token}`;
    
    res.json({ 
        token: token,
        qrData: qrData // QR 코드 데이터
    });
});

// 인증 상태 확인
app.get('/api/auth/status', (req, res) => {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.json({ authenticated: false });
    }
    
    const authData = authTokens.get(token);
    if (authData && Date.now() <= authData.expiry) {
        res.json({ 
            authenticated: true,
            token: token,
            expiry: authData.expiry
        });
    } else {
        if (authData) {
            authTokens.delete(token);
        }
        res.json({ authenticated: false });
    }
});

// 인증 처리 (OTP 검증)
app.post('/api/auth/verify', (req, res) => {
    const { secretKey, otp } = req.body;
    
    // 실제 구현에서는 otplib를 사용하여 OTP 검증
    // 여기서는 간단한 예시
    const validSecretKey = process.env.SECRET_KEY || 'default-secret-key';
    
    if (secretKey !== validSecretKey) {
        return res.status(401).json({ error: '잘못된 비밀키입니다' });
    }
    
    // OTP 검증 로직 (실제로는 otplib.authenticator.verify() 사용)
    // 여기서는 간단히 통과
    
    // 인증 토큰 생성 (10분 유효)
    const token = generateAuthToken();
    authTokens.set(token, {
        expiry: Date.now() + 10 * 60 * 1000 // 10분
    });
    
    res.json({ 
        token: token,
        expiry: Date.now() + 10 * 60 * 1000
    });
});

// 파일 업로드
app.post('/api/upload', uploadLimiter, authenticate, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '파일이 없습니다' });
    }
    
    try {
        // 파일명 정규화
        const sanitizedFileName = sanitizeFileName(req.file.originalname);
        const filePath = path.join(UPLOAD_DIR, sanitizedFileName);
        
        // 중복 파일명 처리
        let finalPath = filePath;
        let counter = 1;
        while (fs.existsSync(finalPath)) {
            const ext = path.extname(sanitizedFileName);
            const name = path.basename(sanitizedFileName, ext);
            finalPath = path.join(UPLOAD_DIR, `${name}_${counter}${ext}`);
            counter++;
        }
        
        // 파일 저장
        fs.writeFileSync(finalPath, req.file.buffer);
        
        res.json({ 
            success: true,
            message: '파일 업로드 완료',
            fileName: path.basename(finalPath)
        });
    } catch (error) {
        console.error('파일 저장 실패:', error);
        res.status(500).json({ error: '파일 저장 중 오류가 발생했습니다' });
    }
});

// 에러 핸들링
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '파일 크기가 너무 큽니다 (최대 100MB)' });
        }
    }
    
    res.status(500).json({ error: error.message || '서버 오류가 발생했습니다' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`업로드 디렉토리: ${UPLOAD_DIR}`);
});
