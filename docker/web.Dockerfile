# Web Dashboard Dockerfile (Next.js)
FROM node:20-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Copy workspace files
COPY package.json package-lock.json turbo.json ./
COPY services ./services
COPY packages ./packages
COPY apps ./apps
COPY agents ./agents
COPY workflows ./workflows

# Install dependencies (workspace-aware)
RUN npm ci --no-audit --no-fund

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev"]
