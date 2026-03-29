# API Reference

Base URL: `/api`

## Authentication

두 가지 인증 방식:
- **JWT Cookie**: `token` httpOnly cookie (backoffice, 파일 관리)
- **Bearer Token**: `Authorization: Bearer <token>` header (업로드 세션)

---

## Auth

### POST /auth/register
가입 (화이트리스트 이메일만 허용)

**Body**: `{ "email": "...", "password": "..." }` (password min 8자)
**Response**: `201 { "user": { "id", "email" } }`

### POST /auth/login
로그인 → JWT cookie 설정

**Body**: `{ "email": "...", "password": "..." }`
**Response**: `200 { "user": { "id", "email" } }` + Set-Cookie: token

### GET /auth/me
현재 로그인 사용자 확인 (세션 복원용)

**Auth**: JWT cookie
**Response**: `200 { "user": { "id", "email" } }` | `401`

### POST /auth/logout
로그아웃 → cookie 제거

**Auth**: JWT cookie
**Response**: `200 { "message": "Logged out" }`

---

## OTP

### POST /otp/generate
OTP 코드 생성 (6자리, 2분 만료)

**Auth**: JWT cookie
**Response**: `200 { "code": "123456", "expiresAt": "..." }`

---

## Session

### POST /session/init
업로드 세션 초기화 (QR 코드 생성)

**Response**: `201 { "sessionSig": "uuid", "qrData": "...", "expiresAt": "..." }`

### GET /session/activate
QR 스캔 후 세션 활성화

**Auth**: JWT cookie
**Query**: `?sig={session_sig}`
**Response**: redirect to backoffice

### POST /session/poll
세션 활성화 대기 (폴링)

**Body**: `{ "sessionSig": "uuid" }`
**Response**: `200 { "status": "active", "token": "..." }` | `200 { "status": "pending" }`

### POST /session/otp
OTP로 세션 활성화

**Body**: `{ "code": "123456" }`
**Response**: `200 { "token": "...", "expiresAt": "..." }`

---

## Upload

### POST /upload
파일 업로드 (multipart/form-data)

**Auth**: Bearer token (세션 토큰)
**Body**: `file` (single file, max 500MB)
**Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp, video/mp4, video/mpeg, video/quicktime, video/x-msvideo, audio/mpeg, audio/wav, audio/ogg, audio/webm
**Response**: `201 { "id", "originalName", "sizeBytes", "mimeType" }`

---

## Files

### GET /files
내 업로드 파일 목록 조회

**Auth**: JWT cookie
**Response**: `200 { "files": [{ "id", "original_name", "size_bytes", "mime_type", "created_at" }, ...] }`

### GET /files/:id/download
파일 다운로드 URL 발급 (S3 Presigned URL, 5분 만료)

**Auth**: JWT cookie
**Response**: `200 { "url": "https://...", "fileName": "..." }` | `404`

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /session/otp | 5 req / 1 min |
| POST /upload | 30 req / 15 min |

## Error Format

```json
{ "error": "Error message" }
```

Status codes: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 429 (rate limit)
