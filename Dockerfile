# Root Dockerfile for platforms that only look at /Dockerfile.
# Full local stack: docker compose up --build (API + web + Postgres).
# Prefer infrastructure/docker/api.Dockerfile when you control the path.

FROM golang:1.24-alpine AS build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY apps/api apps/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/triunder-api ./apps/api/cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget \
  && adduser -D -H -u 10001 triunder
WORKDIR /app
COPY --from=build /out/triunder-api /app/out
COPY database/migrations /app/database/migrations
ENV MIGRATIONS_PATH=/app/database/migrations
EXPOSE 8080
USER triunder
ENTRYPOINT ["/app/out"]
