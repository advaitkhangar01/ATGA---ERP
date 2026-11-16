# Multi-stage production build for Atul Glass Agency ERP
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy application source code
COPY . .

# Generate Prisma Client & Build Next.js application
RUN npx prisma generate
RUN npm run build

# Production Runner Stage (Non-root security context)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only production artifacts with non-root ownership
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000

CMD ["npm", "start"]
