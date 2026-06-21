# API Gateway Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy workspace files first (for better layer caching)
COPY package.json package-lock.json turbo.json ./
COPY services ./services
COPY packages ./packages
COPY apps ./apps
COPY agents ./agents
COPY workflows ./workflows

# Install dependencies (workspace-aware)
RUN npm ci --no-audit --no-fund

# Build API
WORKDIR /app/services/api-gateway
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
