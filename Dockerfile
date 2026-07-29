# syntax=docker/dockerfile:1.7
# ---------- builder ----------
FROM node:22-alpine AS builder
RUN corepack enable
RUN npm config set registry https://registry.npmmirror.com
WORKDIR /src

# Install deps first (cache friendly).
# --ignore-scripts: skip the project's "postinstall: nuxt prepare" — it needs
# the source which we haven't copied yet. Also bypasses pnpm 10's
# "approve-builds" gate for native-binary deps.
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set registry https://registry.npmmirror.com \
    && pnpm install --frozen-lockfile --ignore-scripts

# Build (nuxt build runs `nuxt prepare` internally).
COPY . .
RUN pnpm build

# ---------- runtime ----------
FROM node:22-alpine
WORKDIR /app

# Only ship the produced server bundle.
COPY --from=builder --chown=node:node /src/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
# Nuxt runtimeConfig overrides:
ENV NUXT_API_INTERNAL=http://127.0.0.1:8080
ENV NUXT_PUBLIC_API_BASE=

USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
