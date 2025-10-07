# Multi-stage Dockerfile for Next.js (Node 20) with Prisma

FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS builder
COPY . .
# Ensure node_modules from deps is used
ENV NODE_ENV=production
# Ensure a public directory exists even if the repo doesn't include one
RUN mkdir -p public
# Generate Prisma client (schema is now available) and build Next.js
RUN npm run prisma:generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Copy node_modules, built app, and necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/next-env.d.ts ./
COPY --from=builder /app/prisma ./prisma

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Container healthcheck using the app's health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD curl -fsS http://localhost:3000/api/health || exit 1

# Start Next.js
CMD ["npm", "run", "start"]
