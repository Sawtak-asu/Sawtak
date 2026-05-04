# ============================================
# Sawtak Backend - Production Build
# ============================================
FROM oven/bun:1-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Stage 1: Install dependencies
COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile --verbose

COPY backend/ .
COPY network/Sawtak/ts-client /network/Sawtak/ts-client

RUN cd /network/Sawtak/ts-client && bun install --frozen-lockfile || bun install

RUN bunx prisma generate
RUN bun build src/server.ts --outdir dist --target bun --minify

FROM oven/bun:1-alpine AS runner

# Install OpenSSL for Prisma (needed at runtime too)
RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package.json backend/bun.lock* ./
RUN bun install --production --frozen-lockfile --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["bun", "run", "dist/server.js"]