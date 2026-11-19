FROM node:26-alpine AS base

# --- Build ---
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output copies only what's needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Pas de dossier public/ dans ce projet : si tu en ajoutes un (favicon, images...), ajoute ici :
# COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
