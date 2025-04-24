FROM node:lts-slim AS base

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    ffmpeg python3 ca-certificates curl && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
RUN corepack enable && \
  corepack prepare pnpm@latest --activate

# Build
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Run
FROM base AS deploy
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
COPY --from=builder /app/node_modules ./node_modules
CMD ["pnpm", "start"]
