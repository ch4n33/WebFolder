# Architecture

## Project Structure

```
backend/src/
├── app.js                    # Express app setup (middleware, routes, static files)
├── server.js                 # Entry point (listen + periodic cleanup)
├── config/
│   ├── index.js              # Environment config
│   └── s3.js                 # S3 client (AWS SDK v3)
├── db/
│   ├── connection.js         # PostgreSQL pool
│   ├── migrate.js            # Migration runner
│   └── migrations/           # SQL migration files
├── middleware/
│   ├── authenticate.js       # JWT cookie verification → req.user
│   ├── authorizeSession.js   # Bearer token verification (upload sessions)
│   ├── errorHandler.js       # Central error handler
│   └── validate.js           # Zod schema validation (body, query, params)
├── routes/                   # Express routers
├── services/                 # Business logic
├── repositories/             # DB queries + S3 operations
├── schemas/                  # Zod validation schemas
└── utils/
    ├── errors.js             # Custom error classes
    └── crypto.js             # bcrypt password hashing

frontend/
├── upload/                   # Shared PC upload interface
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── qrcode.min.js
└── backoffice/               # User dashboard (auth, OTP, file management)
    ├── index.html
    ├── app.js
    └── style.css
```

## Layer Architecture

```
Routes (HTTP) → Services (Business Logic) → Repositories (DB/S3)
```

- **Routes**: HTTP 핸들러, 미들웨어 체인 구성, 입력 검증
- **Services**: 비즈니스 규칙, 여러 repository 조합
- **Repositories**: 단일 데이터 소스 접근 (PostgreSQL 또는 S3)

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| email | TEXT UNIQUE | |
| password | TEXT | bcrypt hashed |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### otps
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | |
| code | VARCHAR(6) | 6자리 OTP |
| expires_at | TIMESTAMPTZ | |
| used | BOOLEAN | |

### upload_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | nullable (pending 상태) |
| session_sig | UUID UNIQUE | QR 코드 식별자 |
| token | TEXT | Bearer token |
| status | VARCHAR(10) | pending / active / expired |
| expires_at | TIMESTAMPTZ | |

### uploads
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | |
| session_id | INTEGER FK → upload_sessions | nullable |
| s3_key | TEXT | S3 저장 경로 |
| original_name | TEXT | 원본 파일명 |
| size_bytes | BIGINT | |
| mime_type | TEXT | |
| created_at | TIMESTAMPTZ | |

### email_whitelist
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| email | TEXT UNIQUE | 가입 허용 이메일 |

## Authentication Flows

### 1. JWT (Backoffice)
사용자가 이메일/비밀번호로 로그인 → JWT를 httpOnly cookie로 설정 (30일 만료) → 이후 요청에서 cookie로 인증.

### 2. QR Code Flow (Shared PC → Personal Device)
1. 공유 PC: `POST /api/session/init` → session_sig(UUID) 생성 + QR 표시
2. 개인 기기: QR 스캔 → `/api/session/activate?sig={sig}` 접속 (JWT 인증 필요)
3. 세션 활성화 → Bearer token 발급
4. 공유 PC: `POST /api/session/poll` 폴링으로 token 수신 → 파일 업로드 가능

### 3. OTP Flow (Personal Device → Shared PC)
1. 개인 기기: backoffice에서 OTP 생성 (6자리, 2분 만료)
2. 공유 PC: OTP 입력 → `POST /api/session/otp` → 세션 활성화 + token 발급

## Tech Stack

- **Runtime**: Node.js 22+ (ES modules)
- **Framework**: Express 4
- **Database**: PostgreSQL (pg)
- **Storage**: S3-compatible (MinIO / AWS S3) via AWS SDK v3
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Zod
- **Frontend**: Vanilla JS (no framework)
