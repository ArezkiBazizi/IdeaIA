# =============================================================================
# Build multi-stage : dépendances → Prisma client → image runtime minimale.
# Distroless est possible pour du Node pur, mais Prisma (engines natifs) est
# plus simple avec Alpine + utilisateur non-root (compromis fréquent en prod).
# =============================================================================

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
COPY server.js ./
COPY src ./src
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY package.json ./
COPY prisma ./prisma
COPY server.js ./
COPY src ./src
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
