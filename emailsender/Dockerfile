# ─── Builder stage ─────────────────────────────────────────────────────
FROM oven/bun:1.1.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm (Bun image doesn't include it by default)
RUN npm install -g pnpm

# Install dependencies (from npmjs — no workspace context needed)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# ─── Production stage ──────────────────────────────────────────────────
FROM oven/bun:1.1.0-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3003

# Health check — uses Bun's built-in fetch
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3003/health').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"

# Start with Bun runtime
CMD ["bun", "dist/index.js"]
