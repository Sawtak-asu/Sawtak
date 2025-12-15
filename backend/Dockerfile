# ============================================
# Sawtak Backend - Optimized Dockerfile
# ============================================

# Stage 1: Install ALL dependencies (including dev) for building
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Clear cache and install dependencies with retry
RUN rm -rf ~/.bun/install/cache && \
    bun install --no-cache || bun install --no-cache

# Stage 2: Build the application
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema for client generation
COPY prisma ./prisma/

# Generate Prisma Client
RUN bunx prisma generate

# Copy source code
COPY . .

# Build the application  
RUN bun build src/server.ts --outdir dist --target bun --minify

# Stage 3: Production dependencies only
FROM oven/bun:1-alpine AS prod-deps

WORKDIR /app

COPY package.json bun.lock* ./

# Install ONLY production dependencies
RUN rm -rf ~/.bun/install/cache && \
    bun install --production --no-cache --ignore-scripts || \
    bun install --production --no-cache --ignore-scripts

# Stage 4: Final production image
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma (Alpine)
RUN apk add --no-cache openssl libc6-compat

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sawtak -u 1001 -G nodejs

# Copy only what's needed for production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./

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
