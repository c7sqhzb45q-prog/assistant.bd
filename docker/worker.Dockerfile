# Worker/Service Dockerfile (for background services)
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

ARG SERVICE_NAME

COPY package.json package-lock.json turbo.json ./
COPY services ./services
COPY packages ./packages
COPY apps ./apps
COPY agents ./agents
COPY workflows ./workflows

RUN npm ci --no-audit --no-fund

WORKDIR /app/services/${SERVICE_NAME}
RUN npm run build

RUN chown -R node:node /app
USER node

CMD ["npm", "run", "start"]
