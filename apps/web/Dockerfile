# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────
FROM nginx:alpine AS production

# Copy Vite build output to nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to handle React Router (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]