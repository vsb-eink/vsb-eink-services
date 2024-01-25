FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base as base-playwright
RUN pnpm dlx playwright@^1.41.1 install --with-deps chromium

FROM base AS build
WORKDIR /usr/src/app
COPY pnpm-lock.yaml .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch
COPY . .
RUN pnpm install --offline && \
    pnpm run -r build
RUN pnpm deploy --filter=compressor --prod /prod/compressor && \
    pnpm deploy --filter=grouper --prod /prod/grouper && \
    pnpm deploy --filter=renderer --prod /prod/renderer && \
    pnpm deploy --filter=scheduler --prod /prod/scheduler

FROM base AS compressor
WORKDIR /app
COPY --from=build /prod/compressor .
CMD [ "pnpm", "start" ]

FROM base AS grouper
WORKDIR /app
COPY --from=build /prod/grouper .
EXPOSE 3000
CMD [ "pnpm", "start" ]

FROM base-playwright AS renderer
WORKDIR /app
COPY --from=build /prod/renderer .
CMD [ "pnpm", "start" ]

FROM base AS scheduler
WORKDIR /app
COPY --from=build /prod/scheduler .
EXPOSE 3000
CMD [ "pnpm", "start" ]
