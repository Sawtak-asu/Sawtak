FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install

# Generate Prisma Client
RUN bunx prisma generate

# Copy source code
COPY backend ./backend
COPY frontend ./frontend
COPY tsconfig.json ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=3030

# Expose port
EXPOSE 3030

# Start server
CMD ["bun", "run", "backend/src/index.ts"]
