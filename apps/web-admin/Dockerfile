# Next.js admin portal — build from monorepo root context
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web-admin/package.json ./apps/web-admin/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/common/package.json ./packages/common/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ts-config/package.json ./packages/ts-config/
COPY packages/database/package.json ./packages/database/
RUN pnpm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY . .
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @medicore/web-admin build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN corepack enable
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@medicore/web-admin", "start"]
