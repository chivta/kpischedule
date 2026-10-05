# Dev: source is bind-mounted, vite serves with hot reload.
FROM node:24-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Builder: produce the static bundle.
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production: nginx serving only the built assets, no source, no build tools.
FROM nginxinc/nginx-unprivileged:1.30-alpine AS production
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
