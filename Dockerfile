# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY docker-entrypoint.sh ./

# Add non-root user
RUN addgroup -g 1001 nodejs && \
  adduser -S -u 1001 -G nodejs nodejs && \
  chmod +x docker-entrypoint.sh

USER nodejs

ENV HUSKY=0
ENV CI=true

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
