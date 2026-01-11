# WebFolder - 개인 NAS용 파일 업로드 웹 앱

단방향 파일 업로드 전용 웹 애플리케이션입니다. 드래그 앤 드롭으로 간편하게 파일을 업로드할 수 있습니다.

## 주요 기능

- **마우스/터치 전용 UI**: 키보드 입력 없이 사용 가능
- **단방향 업로드**: 파일 업로드만 가능, 다운로드 불가
- **인증 시스템**: OTP + QR 코드 기반 인증 (10분 유효)
- **미디어 파일만 허용**: 이미지, 비디오, 오디오 파일만 업로드 가능
- **Docker 지원**: 컨테이너로 격리 실행
- **보안 강화**: 디렉토리 탈출 방지, 파일명 정규화, Rate Limiting

## 설치 및 실행

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 SECRET_KEY 등 설정

# 개발 서버 실행
npm run dev
```

### Docker 사용

```bash
# Docker 이미지 빌드
docker build -t webfolder .

# Docker Compose로 실행
docker-compose up -d
```

## 프로젝트 구조

```
webFolder/
├── index.html          # 프론트엔드 HTML
├── style.css           # 프론트엔드 CSS
├── app.js              # 프론트엔드 JavaScript
├── package.json        # Node.js 의존성
├── Dockerfile          # Docker 이미지 정의
├── docker-compose.yml  # Docker Compose 설정
├── backend/
│   └── server.js       # Express 서버
└── SPEC.md             # 프로젝트 명세서
```

## API 엔드포인트

### 인증

- `GET /api/auth/qr` - QR 코드 토큰 생성
- `GET /api/auth/status?token=xxx` - 인증 상태 확인
- `POST /api/auth/verify` - OTP 인증 처리

### 업로드

- `POST /api/upload` - 파일 업로드 (인증 필요)

## 보안 고려사항

1. **디렉토리 탈출 방지**: 파일명 정규화 및 `path.basename()` 사용
2. **파일 타입 검증**: MIME 타입 기반 미디어 파일만 허용
3. **파일 크기 제한**: 500MB 제한
4. **Rate Limiting**: 15분당 10회 요청 제한
5. **인증 토큰**: 10분 유효 기간

## 향후 개선 사항

- [ ] 실제 QR 코드 생성 및 표시 (qrcode 라이브러리 통합)
- [ ] OTP 검증 구현 (otplib 사용)
- [ ] Discord 봇 연동 (승인 시스템)
- [ ] 파일 업로드 진행률 개선
- [ ] 로그 시스템 추가

## 라이선스

ISC
