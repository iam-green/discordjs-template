FROM node:lts-slim AS base

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    ffmpeg python3 ca-certificates curl && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
RUN corepack enable && \
  corepack prepare pnpm@latest --activate

# Builder for dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm run build

# Run
FROM base AS deploy
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
COPY --from=build /app/node_modules ./node_modules
CMD ["pnpm", "start"]

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1
