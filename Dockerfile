# ====================
# Stage 1: Base
# ====================
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ====================
# Stage 2: Dependencies (Backend)
# ====================
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ====================
# Stage 3: Dependencies (UI)
# ====================
FROM base AS ui-deps
WORKDIR /app/ui
COPY ui/package.json ui/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ====================
# Stage 4: Build Backend
# ====================
FROM base AS build-backend
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ====================
# Stage 5: Build UI
# ====================
FROM base AS build-ui
WORKDIR /app/ui
COPY --from=ui-deps /app/ui/node_modules ./node_modules
COPY ui/ ./
RUN pnpm build

# ====================
# Stage 6: Production
# ====================
FROM node:22-alpine AS production

# Install Chromium for Playwright browser automation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user for security
RUN addgroup -g 1001 -S glinr && \
    adduser -S glinr -u 1001 -G glinr

WORKDIR /app

# Copy pnpm
COPY --from=base /root/.local/share/pnpm /root/.local/share/pnpm
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"

# Copy backend artifacts
COPY --from=build-backend /app/dist ./dist
COPY --from=build-backend /app/node_modules ./node_modules
COPY --from=build-backend /app/package.json ./

# Copy UI build artifacts
COPY --from=build-ui /app/ui/dist ./ui/dist

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R glinr:glinr /app

# Production environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Switch to non-root user
USER glinr

EXPOSE 3000

CMD ["node", "dist/server.js"]
