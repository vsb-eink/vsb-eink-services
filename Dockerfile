ARG HOSTER_NODE_VERSION="20.17"
ARG HOSTER_BUN_VERSION="1.1.27"
ARG HOSTER_DENO_VERSION="2.0.0-rc.1"

FROM node:21-slim AS builder-base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && \
    apt-get install openssl default-jre -y && \
    rm -rf /var/lib/apt/lists/* && \
    corepack enable pnpm && \
    pnpm -v

FROM node:21-slim AS runner-base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && \
    apt-get install openssl -y && \
    rm -rf /var/lib/apt/lists/* && \
    corepack enable pnpm && \
    pnpm -v

FROM builder-base AS repo-with-deps
WORKDIR /usr/src/app
COPY pnpm-lock.yaml ./
COPY patches/ patches/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

# ------ Dashboard ------
FROM repo-with-deps AS build-dashboard-vue
WORKDIR /usr/src/app
COPY --from=repo-with-deps /usr/src/app .
RUN pnpm -F dashboard-vue... run generate && \
    pnpm -F dashboard-vue... run build && \
    pnpm -F dashboard-vue exec pkg ./node_modules/@import-meta-env/cli/bin/import-meta-env.js --target node18-alpine-x64 --output nginx/import-meta-env && \
    pnpm -F dashboard-vue deploy --prod /prod/dashboard-vue

FROM nginx:1.25-alpine-slim AS dashboard-vue
COPY --from=build-dashboard-vue /prod/dashboard-vue/dist /usr/share/nginx/html
COPY --from=build-dashboard-vue /prod/dashboard-vue/.env.example /opt/env/
COPY --from=build-dashboard-vue /prod/dashboard-vue/nginx/import-meta-env /opt/env/
COPY --from=build-dashboard-vue /prod/dashboard-vue/nginx/templates /etc/nginx/templates
COPY --from=build-dashboard-vue /prod/dashboard-vue/nginx/docker-entrypoint.d/* /docker-entrypoint.d
RUN chmod +x /docker-entrypoint.d/*
HEALTHCHECK CMD wget --spider -o /dev/null http://127.0.0.1/
EXPOSE 80

# ------ Compressor ------
FROM repo-with-deps AS build-compressor
WORKDIR /usr/src/app
COPY --from=repo-with-deps /usr/src/app .
RUN pnpm -F compressor... run generate && \
    pnpm -F compressor... run build && \
    pnpm -F compressor deploy --prod /prod/compressor

FROM runner-base AS compressor
WORKDIR /app
COPY --from=build-compressor /prod/compressor .
CMD [ "pnpm", "start" ]

# ----- Facade -----
FROM repo-with-deps AS build-facade
WORKDIR /usr/src/app
COPY --from=repo-with-deps /usr/src/app .
RUN pnpm -F facade... run generate && \
    pnpm -F facade... run build && \
    pnpm -F facade deploy --prod /prod/facade

FROM runner-base AS facade
WORKDIR /app
COPY --from=build-facade /prod/facade .
EXPOSE 3000
HEALTHCHECK CMD ["pnpm", "healthcheck"]
CMD [ "pnpm", "start" ]

# ------ Grouper ------
FROM repo-with-deps AS build-grouper
WORKDIR /usr/src/app
COPY --from=repo-with-deps /usr/src/app .
RUN pnpm -F grouper... run generate && \
    pnpm -F grouper... run build && \
    pnpm -F grouper deploy --prod /prod/grouper

FROM runner-base AS grouper
WORKDIR /app
COPY --from=build-grouper /prod/grouper .
EXPOSE 3000
HEALTHCHECK CMD ["pnpm", "healthcheck"]
CMD [ "pnpm", "start" ]

# ------ Hoster ------
FROM node:${HOSTER_NODE_VERSION} AS node-binary
FROM oven/bun:${HOSTER_BUN_VERSION} AS bun-binary
FROM denoland/deno:bin-${HOSTER_DENO_VERSION} AS deno-binary

FROM httpd:bookworm AS hoster

RUN apt-get update && apt-get install -y \
      python3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node-binary /usr/local/bin/node /usr/local/bin/
COPY --from=bun-binary /usr/local/bin/bun /usr/local/bin/
COPY --from=deno-binary /deno /usr/local/bin/deno
COPY --from=repo-with-deps /usr/src/app/services/hoster/httpd.conf /usr/local/apache2/conf/httpd.conf

# ------ Renderer ------
FROM runner-base AS runner-base-playwright
RUN pnpm dlx playwright@1.41.1 install --with-deps chromium

FROM repo-with-deps AS build-renderer
WORKDIR /usr/src/app
COPY --from=repo-with-deps /usr/src/app .
RUN pnpm -F renderer... run generate && \
    pnpm -F renderer... run build && \
    pnpm -F renderer deploy --prod /prod/renderer

FROM runner-base-playwright AS renderer
WORKDIR /app
COPY --from=build-renderer /prod/renderer .
CMD [ "pnpm", "start" ]

# ------ Scheduler ------
FROM repo-with-deps AS build-scheduler
WORKDIR /usr/src/app
COPY --from=repo-with-deps /usr/src/app .
RUN pnpm -F scheduler... run generate && \
    pnpm -F scheduler... run build && \
    pnpm -F scheduler deploy --prod /prod/scheduler

FROM runner-base AS scheduler
WORKDIR /app
COPY --from=build-scheduler /prod/scheduler .
EXPOSE 3000
HEALTHCHECK CMD ["pnpm", "healthcheck"]
CMD [ "pnpm", "start" ]
