# ============================================
# Sawtak Backend - Optimized Production Build
# ============================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Stage 1: Install dependencies with caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --no-progress

# Stage 2: Build the application
COPY . .
# Only generate prisma if the directory exists
RUN if [ -d "./prisma" ]; then bunx prisma generate; fi
RUN bun build src/server.ts --outdir dist --target bun --minify

# Stage 3: Production Runner (Real Prod)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install production dependencies only to keep it clean
COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile --no-progress

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Start command
CMD ["bun", "run", "dist/server.js"]
