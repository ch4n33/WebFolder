# Deployment

## Infrastructure

- **Cluster**: Kloud (개인 Kubernetes 클러스터)
- **Namespace**: `kloud-apps`
- **Domain**: `wf.rche.moe`
- **TLS**: Let's Encrypt (cert-manager)
- **Ingress**: Traefik
- **Container Registry**: `ghcr.io/ch4n33/webfolder`

## CI/CD

GitHub Actions workflow: `.github/workflows/deploy-webfolder.yml`

### Trigger
`main` 브랜치 push 시 다음 경로 변경 감지:
- `backend/**`, `frontend/**`, `Dockerfile`, `package.json`, `package-lock.json`
- `cluster/apps/webfolder/**`, `.github/workflows/deploy-webfolder.yml`

### Pipeline
1. Multi-arch Docker 이미지 빌드 (linux/amd64 + linux/arm64)
2. GHCR push (태그: `{sha}` + `latest`)
3. `kubectl set image` → rolling update
4. `kubectl rollout status` 확인 (timeout 120s)

### Runner
Self-hosted runner (`[self-hosted, kloud]`)

## Kubernetes Manifests

`cluster/apps/webfolder/` 디렉토리:

| 파일 | 설명 |
|------|------|
| `deployment.yaml` | 1 replica, 64Mi~256Mi memory, 50m~500m CPU, health probes |
| `service.yaml` | ClusterIP port 80 → 3000 |
| `ingress.yaml` | wf.rche.moe, TLS, Traefik |

### Secrets
`webfolder-secret` (namespace: kloud-apps)에 환경변수 저장:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiry | 30d |
| `SITE_URL` | Public URL | - |
| `S3_ENDPOINT` | MinIO/S3 endpoint | - |
| `S3_REGION` | AWS region | us-east-1 |
| `S3_ACCESS_KEY` | S3 access key | - |
| `S3_SECRET_KEY` | S3 secret key | - |
| `S3_BUCKET` | Bucket name | webfolder |
| `SESSION_DURATION_MINUTES` | Upload session TTL | 3 |
| `OTP_DURATION_MINUTES` | OTP validity | 2 |

## Local Development

```bash
# 의존성 설치
npm install

# 개발 서버 (nodemon)
npm run dev

# DB 마이그레이션
npm run migrate

# Docker Compose (app + MinIO)
docker compose up
```

## Docker

- Base image: `node:22-alpine`
- Non-root user: `nodejs` (UID 1001)
- Port: 3000
- Health check: `GET /healthz`
