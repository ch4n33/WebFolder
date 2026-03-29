# WebFolder

공유 PC에서 S3-compatible 스토리지(MinIO)로 파일을 업로드하는 웹 서비스. QR 코드 또는 OTP를 통한 인증 후 파일 업로드, 백오피스에서 파일 관리.

## Tech Stack

Node.js 22+ (ES modules) · Express 4 · PostgreSQL · S3 (MinIO) · JWT · Zod · Vanilla JS frontend

## Commands

```bash
npm run dev          # 개발 서버 (nodemon, port 3000)
npm run migrate      # DB 마이그레이션 실행
npm test             # 전체 테스트 (vitest)
npm run test:unit    # 단위 테스트
npm run test:int     # 통합 테스트
```

## Pages

- `/upload` — 공유 PC 업로드 인터페이스 (QR/OTP 인증)
- `/backoffice` — 사용자 대시보드 (로그인, OTP 생성, 파일 관리)

## Deployment

Kloud 클러스터 (kloud-apps namespace) · `wf.rche.moe` · GitHub Actions CI/CD · multi-arch (amd64+arm64)

main push 시 자동 배포.

## Documentation

- [Architecture](docs/architecture.md) — 프로젝트 구조, DB 스키마, 인증 플로우, 레이어 아키텍처
- [API Reference](docs/api.md) — 전체 API 엔드포인트, 요청/응답 형식, 인증 방식
- [Deployment](docs/deployment.md) — 배포 인프라, CI/CD 파이프라인, K8s 매니페스트, 환경변수
