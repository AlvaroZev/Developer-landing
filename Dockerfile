# Single-image deploy for hosts that only build /Dockerfile and expose one port.
# nginx listens on PORT (default 8080). The API always binds 127.0.0.1:8090 inside.
# For the full local stack (separate web/api/db): docker compose up --build

FROM golang:1.24-alpine AS api-build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY apps/api apps/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/triunder-api ./apps/api/cmd/server

FROM node:22-alpine AS web-build
WORKDIR /src
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web apps/web
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @triunder/web build

FROM nginx:1.27-alpine
RUN apk add --no-cache ca-certificates wget gettext
COPY --from=api-build /out/triunder-api /app/triunder-api
COPY database/migrations /app/database/migrations
COPY --from=web-build /src/apps/web/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.single.conf /etc/nginx/templates/default.conf.template
COPY infrastructure/docker/entrypoint-single.sh /entrypoint-single.sh
RUN chmod +x /entrypoint-single.sh \
  && sed -i 's/\r$//' /entrypoint-single.sh \
  && rm -f /etc/nginx/conf.d/default.conf
ENV MIGRATIONS_PATH=/app/database/migrations
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
ENTRYPOINT ["/entrypoint-single.sh"]
