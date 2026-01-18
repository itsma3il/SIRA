FROM oven/bun:1-alpine AS base

WORKDIR /app

# Install dependencies into temp folder to cache them
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Release stage
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Next.js specific build
ENV NODE_ENV=production
RUN bun run build

EXPOSE 3000

# Start with bun
CMD ["bun", "run", "start"]