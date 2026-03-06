# Next.js standalone build for Docker
# Requires output: 'standalone' in next.config

FROM node:22.17.0-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
# Skip postinstall (prisma generate) until builder has prisma/schema.prisma
RUN npm install --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# So Payload URL is correct if Next inlines env at build time (Docker network hostname)
ENV PAYLOAD_API_URL=http://litecoin-fund-cms:3000/api
ENV PAYLOAD_CMS_URL=http://litecoin-fund-cms:3000
ENV USE_PAYLOAD_CMS=true
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
