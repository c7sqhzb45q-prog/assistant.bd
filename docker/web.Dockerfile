# Web Dashboard Dockerfile (Next.js)
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json turbo.json ./
COPY services ./services
COPY packages ./packages
COPY apps ./apps
COPY agents ./agents
COPY workflows ./workflows

RUN npm ci --no-audit --no-fund

WORKDIR /app/apps/web

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
