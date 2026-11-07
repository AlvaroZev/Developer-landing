# Guide for the next coding agent

Read this before editing. The interesting behavior is in a few places. Most of the catalog is data.

## How the repository is split

1. Industry facts live in `packages/industry-registry`. Solution facts and the compatibility map live in `packages/solution-registry`.
2. What a demonstration does lives in `packages/demo-engine`. The React pages in `apps/web/src/pages/demo.tsx` render a resolved demo. They should not grow a second set of business rules.
3. Shared labels live in `packages/i18n/src/messages.ts`. `es` is typed against `en`, so a missing translation fails `pnpm typecheck`.
4. HTTP and persistence live in `apps/api`. The browser calls them through `packages/api-client`.
5. Themes live in `packages/theme-system` and are applied as CSS variables. Do not add per-industry selectors in `styles.css`.

## Where a change belongs

- A new page that is still the showroom: `apps/web/src/pages`, and a route in `app.tsx`.
- A new persisted field: `packages/contracts`, `httpapi/validate.go`, both store implementations, and a new file under `database/migrations`.
- A new integration: a package under `apps/api/internal`, with a constructor that reads the environment in `config`. Do not log the secret and do not return it.
- A new analytics event: add it to the allowlist in `packages/contracts` and in `httpapi/validate.go`, then send it from `apps/web/src/lib/analytics.ts` after consent.

## Reuse these

`reduceDemo`, `resolveDemo`, `validateInquiry`, `createClient`, `themeToCssVars`, and the store interface. Do not start a second demo state machine, a second fetch wrapper, or a query that lives in a handler.

## Contracts that must stay true

- Selectors offer only `compatibility`. `resolveDemo` returns null otherwise. The API returns 404 otherwise.
- There is no complexity tier and no cross-system composer. Do not add either.
- Guest migration is decided from the cookie's stored row. A conflict must not move rows.
- Login does not attach a guest. Registration does.
- OpenAI output is untrusted. Validate it. If the key is absent, fail visibly and do not substitute a written answer.
- Administrator checks happen in the API. A hidden button is not authorization.
- Users see their own inquiries, sessions, and saved demos. Internal notes stay on the admin payload.
- Demonstration copy stays fictional. Hardware views stay labeled as simulated.

## Add an industry, solution, or demo

Follow `DEVELOPMENT_GUIDE.md`. After the registry edit, run `node scripts/export-catalog.mjs`. The pair is not done because a route renders. `packages/demo-engine` must exercise it, and the homepage must be able to select it.

## Frontend and backend

The web app can keep working when `/api/v1/auth/me` fails: demonstrations fall back to `localStorage`. Do not make the first screen wait on the API. Do not put the OpenAI key, `DATABASE_URL`, or `SESSION_SECRET` in anything Vite bundles.

## Migrations and tests

New SQL is a new numbered file. The API applies it on startup. `go test ./apps/api/...` uses memory. `go test -tags=integration` uses `DATABASE_URL` and is the migration check.

The industry and solution tests import the registries, so a new entry is tested without being copied into the test file. The engine test loops `allCompatiblePairs()`. Playwright is the visitor journey, not a substitute for the pair loop.

## Do not casually change

- The cookie names, the client header, or the decision to keep marketing and the showroom in one app.
- The catalog JSON by hand. Generate it.
- The in-memory store's method signatures without updating Postgres. They implement one interface.
- Production startup: a short `SESSION_SECRET` or `DEV_MAIL_LOG=true` must still refuse to boot.
