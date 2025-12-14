# ============================================
# Sawtak Backend - Bun + Elysia.js Dockerfile
# ============================================

# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy prisma schema for client generation
COPY prisma ./prisma/

# Generate Prisma Client
RUN bunx prisma generate

# Copy source code
COPY . .

# Build the application
RUN bun build src/server.ts --outdir dist --target bun

# ============================================
# Production stage
# ============================================
FROM oven/bun:latest AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sawtak -u 1001 -G nodejs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Change ownership
RUN chown -R sawtak:nodejs /app

# Switch to non-root user
USER sawtak

# Start command - runs migrations then starts server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run dist/server.js"]
