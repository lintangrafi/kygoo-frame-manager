# ── Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Copy source + build
COPY . .
RUN npx next build

# ── Prune dev deps ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev --frozen-lockfile

# ── Runtime ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.local ./.env.local
COPY --from=builder /app/server ./server

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Start both Next.js + WS server
CMD ["node", "server.js"]