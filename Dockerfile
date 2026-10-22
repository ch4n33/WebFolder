FROM node:22.23.4-alpine@sha256:ebc216c22db53dbde85719a874978d5aec04e6e405ad26a3804c6f9abc4ca1a9

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
