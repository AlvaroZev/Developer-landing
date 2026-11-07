# Triunder

Triunder is an interactive engineering showroom. A visitor chooses an industry and a compatible solution on the first screen, then uses a working demonstration of that system. It is one website, not a marketing page that links to a separate product.

The demonstrations are fictional operating data. Nothing in the showroom is a live connection to hardware.

## What is included

- 20 industries and 51 solutions, with an explicit compatibility matrix of 126 demonstrations. Custom industry has no demonstration and goes to the project inquiry.
- Guest sessions, accounts, guest-to-account migration, saved demonstrations, and a personal dashboard.
- A short project inquiry, with optional OpenAI help only when a key is configured and an administrator has turned the feature on.
- An admin panel for inquiries, people, catalog visibility, analytics, and the OpenAI health check.
- English and Spanish.

## Run it locally

Requirements: Node 20+, pnpm 9.15.9, Go 1.24. Postgres is required for the Docker stack and for `go test -tags=integration`. The API uses an in-memory store when `DATABASE_URL` is empty, which is how the browser tests run.

```powershell
copy .env.example .env
pnpm install
pnpm dev
```

In another terminal:

```powershell
go run ./apps/api/cmd/server
```

The web app is at `http://127.0.0.1:5173` and proxies `/api` to the API when `API_PROXY_TARGET` is set. Leave `VITE_API_URL` empty.

Sign in as the bootstrapped administrator with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. The password is created only when that email does not already exist. Later boots do not reset it.

## Docker

```powershell
copy .env.example .env
docker compose up --build
```

Open `http://localhost:8080`. The web container proxies `/api` and `/healthz` to the API. Postgres data lives in the `triunder-db` volume.

The API binary is `./apps/api/cmd/server`, not the repo root. Platforms that run a bare `go build` fail with `no Go files in /app`. Use this repo's `Dockerfile`, `infrastructure/docker/api.Dockerfile`, or `nixpacks.toml` so the build targets that package. If port 8080 is already taken on your machine, set `TRIUNDER_WEB_PORT=8088` before `docker compose up`.

```powershell
$env:TRIUNDER_WEB_PORT="8088"
docker compose up --build
```

Helper scripts: `pnpm docker:up`, `pnpm docker:down`, `pnpm docker:build`.

To back up the database:

```powershell
docker compose exec db pg_dump -U triunder triunder > triunder.sql
```

Restore by piping that file into `psql` on a new volume. Do not commit `.env` or the dump.

For a production process, set `APP_ENV=production`, a unique `SESSION_SECRET` of at least 32 characters, and `DEV_MAIL_LOG=false`. The API exits if that combination is unsafe. Password reset and verification links are only printed in development. Production needs a mail transport behind the `Mailer` interface before those links can be delivered.

## Checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
go test ./apps/api/...
node scripts/check-catalog.mjs
pnpm e2e
```

`go test -tags=integration ./apps/api/...` needs `DATABASE_URL`. Ordinary tests do not call OpenAI.

## Where to read next

- `ARCHITECTURE.md` — how the pieces fit.
- `PROJECT_STRUCTURE.md` — where a file belongs.
- `DEVELOPMENT_GUIDE.md` — how to add an industry, solution, or demonstration.
- `DATABASE.md`, `API.md`, `AI_DEVELOPMENT_GUIDE.md`.
- `docs/CATALOG.md` — what the demonstrations actually are, and what they are not.
