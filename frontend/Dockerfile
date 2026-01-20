# Base image
FROM oven/bun:1-alpine AS base
WORKDIR /app

# 1. Install Dependencies
FROM base AS deps
# Create a temp directory to install deps (better caching)
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# 2. Build Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /temp/dev/node_modules ./node_modules
COPY . .

# ARGs for non-sensitive public vars
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# CRITICAL FIX HERE:
# Removed the word "ENV" from the shell command chain.
# Just use 'NODE_ENV=production' directly before 'bun run build'.
RUN --mount=type=secret,id=clerk_publishable_key \
    --mount=type=secret,id=clerk_secret_key \
    export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$(cat /run/secrets/clerk_publishable_key) && \
    export CLERK_SECRET_KEY=$(cat /run/secrets/clerk_secret_key) && \
    NODE_ENV=production bun run build

# 3. Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files for running Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", "start"]