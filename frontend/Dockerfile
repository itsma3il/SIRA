# Base image
FROM docker.io/oven/bun:1-alpine AS base
WORKDIR /app

# 1. Install Dependencies
FROM base AS deps
# Create a temp directory to install deps (better caching)
RUN mkdir -p /temp/dev
COPY ./frontend/package.json ./frontend/bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# 2. Build Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /temp/dev/node_modules ./node_modules
COPY ./frontend . 
# Copy docs from project root
COPY ./docs ../docs

# ARGs for non-sensitive public vars
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN NODE_ENV=production bun run build

# 3. Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Ensure public directory exists
RUN mkdir -p ./public

# Copy necessary files for running Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy docs from builder stage
COPY --from=builder /docs ../docs

EXPOSE 3000

CMD ["bun", "run", "start"]