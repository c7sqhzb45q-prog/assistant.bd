# API Gateway Dockerfile
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json turbo.json ./
COPY services ./services
COPY packages ./packages
COPY apps ./apps
COPY agents ./agents
COPY workflows ./workflows

RUN npm ci --no-audit --no-fund

WORKDIR /app/services/api-gateway
RUN npm run build

RUN chown -R node:node /app
USER node

EXPOSE 3001

CMD ["npm", "run", "start"]
