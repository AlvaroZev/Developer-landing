# Triunder

Interactive Software & Engineering Showroom.

Triunder is a unified platform where visitors explore industries, configure solutions, interact with realistic application demos, compose modules, generate preliminary requirements, and submit project inquiries.

This is **not** a conventional portfolio. Marketing and showroom are one experience.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** React, TypeScript, Vite, Tailwind CSS
- **API:** Go (Chi), PostgreSQL
- **Shared packages:** domain, industry-registry, solution-registry, theme-system, i18n

## Quick start

```bash
pnpm install
pnpm --filter @triunder/web dev
```

In another terminal:

```bash
cd apps/api
go mod tidy
go run ./cmd/server
```

Web: http://localhost:5173  
API: http://localhost:8080/healthz

Copy `.env.example` to `.env` before enabling OpenAI or Docker Compose.

## Docker Compose

```bash
docker compose -f infrastructure/compose/docker-compose.yml up --build
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev:web` | Vite frontend |
| `pnpm --filter @triunder/api dev` | Go API |
| `pnpm test` | Unit/package tests |
| `pnpm typecheck` | TypeScript checks |
| `pnpm build` | Production builds |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [DATABASE.md](./DATABASE.md)
- [API.md](./API.md)
- [AI_DEVELOPMENT_GUIDE.md](./AI_DEVELOPMENT_GUIDE.md)

## Brand

Official name: **Triunder**.  
Mark: inverted triangular / Pyraminx-inspired geometry with an integrated balance-scales motif. Assets live in `apps/web/public/brand/`.

## License

MIT © Alvaro Zevallos
