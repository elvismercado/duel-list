# --- build stage ---
FROM node:22-alpine AS build

WORKDIR /app

# Activate the pnpm version pinned in package.json (`packageManager` field).
RUN corepack enable

# Install dependencies first for better layer caching.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the SPA.
COPY . .
ENV NODE_ENV=production
RUN pnpm run build

# --- runtime stage ---
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
