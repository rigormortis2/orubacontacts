# Multi-stage Dockerfile for Node.js Backend
# Stage 1: Dependencies
FROM node:20-slim AS dependencies

WORKDIR /app

# Install required system dependencies including OpenSSL
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    wget \
    netcat-openbsd \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies AND prisma (needed for Prisma Studio)
RUN npm ci --only=production && \
    npm install prisma@^5.7.0 && \
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

# Expose application port and Prisma Studio port
EXPOSE 3000
EXPOSE 5555

# Create entrypoint script for database migration and dual service startup
COPY --chown=node:node <<EOF /app/entrypoint.sh
#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until nc -z database 5432 2>/dev/null; do
  echo "Database is unavailable - waiting..."
  sleep 2
done

echo "Database is ready!"
echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Prisma Studio on port 5555..."
npx prisma studio --port 5555 --browser none &
PRISMA_STUDIO_PID=\$!

echo "Starting application on port 3000..."
node dist/index.js &
APP_PID=\$!

echo "Services started:"
echo "  - API: http://localhost:3000 (PID: \$APP_PID)"
echo "  - Prisma Studio: http://localhost:5555 (PID: \$PRISMA_STUDIO_PID)"

# Wait for both processes
wait \$APP_PID \$PRISMA_STUDIO_PID
EOF

RUN chmod +x /app/entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start application with migrations
ENTRYPOINT ["/app/entrypoint.sh"]
