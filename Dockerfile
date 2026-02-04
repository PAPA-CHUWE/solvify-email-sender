# ---- Base
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install deps
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Run (small image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Render provides PORT automatically
EXPOSE 3000

CMD ["node", "dist/index.js"]
