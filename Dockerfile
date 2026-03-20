FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY backend/ backend/
COPY frontend/ frontend/

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "backend/src/server.js"]
