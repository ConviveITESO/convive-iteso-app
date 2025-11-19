# Backend Dockerfile - Multi-stage build with Node.js 22 Alpine
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy package.json files for all workspaces
COPY apps/api/package.json ./apps/api/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS builder

# Copy source code
COPY packages/schemas ./packages/schemas
COPY packages/typescript-config ./packages/typescript-config
COPY apps/api ./apps/api

# Build the schemas package first
RUN pnpm --filter @repo/schemas build

# Build the backend application
RUN pnpm --filter api build

# Production stage
FROM node:22-alpine AS runner

# Install pnpm
RUN corepack enable pnpm

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package.json files and install production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/schemas/package.json ./packages/schemas/

# Copy built schemas package
COPY --from=builder --chown=nestjs:nodejs /app/packages/schemas/dist ./packages/schemas/dist

# Copy built backend application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Note: Backend runtime environment variables are passed via EC2 user-data script
# See: infra/user-data-backend.sh.tpl

USER nestjs

EXPOSE 8080

ENV PORT=8080

CMD ["node", "apps/api/dist/src/main.js"]
