# Architecture

Triunder is a showroom for one engineering practice. Visitors have their own accounts. Industries, solutions, themes, and demonstration templates are global. A company name on a profile is not a security boundary, and there is no tenant database.

## Request path

The browser talks only to the web origin. In development, Vite proxies `/api` and `/healthz` when `API_PROXY_TARGET` is set. In Docker, nginx does the same proxy. The client never has a baked-in host: an empty `VITE_API_URL` means same origin.

The Go API (`apps/api`) is the only process that sees `OPENAI_API_KEY`, password hashes, and session secrets. Handlers in `internal/httpapi` authenticate from the `triunder_session` cookie or the `triunder_guest` cookie. A user id in a JSON body is never treated as ownership.

Mutating requests must send `X-Triunder-Client: web`. That blocks a foreign site from posting a form that would otherwise include the cookie. CORS allows only `CORS_ORIGINS` and is used when the API is on another host.

## Catalogs

`packages/industry-registry` and `packages/solution-registry` are the source of truth for names, themes, terminology, and which pairs exist. `scripts/export-catalog.mjs` writes `apps/api/internal/catalog/catalog.json`. A Vitest assertion fails if the JSON drifts. The API rejects an inquiry or a demonstration that is not in that file.

Custom industry is in the registry and has an empty solution list on purpose. It routes to the inquiry.

## Demonstrations

`packages/demo-engine` is one reducer, not 126 applications. Each solution has a blueprint: presentation, entities, statuses, and any hardware, order, calendar, or document behavior. The industry supplies theme, vocabulary, extra fields, currency, and tax. `resolveDemo` returns null for an unsupported pair.

All behavior goes through `reduceDemo`. The browser keeps the snapshot in `localStorage` and, when the API is reachable, mirrors it to `demo_sessions`. The API stores that snapshot. It does not reimplement the workflow. Simulated hardware is labeled in the interface and is never described as a physical connection. There is no complexity picker and no module composer.

## Accounts

Passwords are bcrypt. Session and guest tokens are random; the database stores `sha256(secret + token)`. Registration migrates the cookie-backed guest in one step (`attach`, `already-attached`, or `conflict`). Login does not. The account page has an explicit attach action. A conflict changes nothing.

## OpenAI

`internal/ai` is the provider boundary. The health check is `GET /v1/models`. Assistance is a chat completion whose JSON is checked before it is shown. If the key is missing, the status is `missing_credentials` and the assist route returns an error. It does not invent a reply. Public features are on only when the provider is configured, the last health check has not failed, and the administrator has enabled that feature.

## Analytics

Events are accepted only when the body says `consent: true`, which the browser sends after the visitor allows analytics. Metadata is limited to industry, solution, path, demoId, and status.
