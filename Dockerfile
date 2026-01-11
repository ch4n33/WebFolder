FROM node:22-alpine

WORKDIR /app

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install --production

# 애플리케이션 파일 복사
COPY . .

# 업로드 디렉토리 생성
RUN mkdir -p /app/uploads

# 포트 노출
EXPOSE 3000

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/app/uploads

# 보안: non-root 사용자로 실행
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 서버 시작
CMD ["node", "backend/server.js"]
