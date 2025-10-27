# Multi-stage Dockerfile for Node.js Backend
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma Client for production
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create directory for Excel imports
RUN mkdir -p /app/imports && \
    chown -R node:node /app

# Use non-root user
USER node

# Expose application port
EXPOSE 3000

# Create entrypoint script for database migration
COPY --chown=node:node <<EOF /app/entrypoint.sh
#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until wget --spider --quiet http://database:5432 2>/dev/null || nc -z database 5432; do
  sleep 2
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node dist/index.js
EOF

RUN chmod +x /app/entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start application with migrations
ENTRYPOINT ["/app/entrypoint.sh"]
