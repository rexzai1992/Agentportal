FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
WORKDIR /app
COPY backend ./backend
COPY shared ./shared
COPY frontend ./frontend
RUN ln -s frontend/node_modules node_modules
WORKDIR /app/frontend
RUN npm run prisma:generate && npm run build
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["node", "../backend/scripts/start-demo.cjs"]
