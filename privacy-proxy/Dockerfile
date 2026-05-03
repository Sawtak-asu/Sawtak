# ============================================
# Sawtak Privacy Proxy - Dockerfile
# ============================================

# Stage 1: Install dependencies
FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json bun.lock* ./

RUN rm -rf ~/.bun/install/cache && \
    bun install --no-cache || bun install --no-cache

# Stage 2: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun build src/server.ts --outdir dist --target bun --minify

# Stage 3: Production dependencies only
FROM oven/bun:1-alpine AS prod-deps

WORKDIR /app

COPY package.json bun.lock* ./

RUN rm -rf ~/.bun/install/cache && \
    bun install --production --no-cache --ignore-scripts || \
    bun install --production --no-cache --ignore-scripts

# Stage 4: Final production image
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sawtak-proxy -u 1001 -G nodejs

# Copy built output and production deps
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./

# Environment
ENV NODE_ENV=production
ENV PROXY_PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=3s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Ownership
RUN chown -R sawtak-proxy:nodejs /app

# Non-root user
USER sawtak-proxy

CMD ["bun", "run", "dist/server.js"]
