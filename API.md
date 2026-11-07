# API

Base path `/api/v1`. JSON errors look like `{ "error": { "code", "message", "fields?" } }`. Mutating calls need `X-Triunder-Client: web` and return 403 without it. Authenticated routes read the session cookie. Limits match `packages/contracts`.

## Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Process is up. |
| GET | `/auth/me` | `{ user, profile }`. Both null when signed out. This is 200 so a guest is not treated as an outage. |
| POST | `/auth/register` | Creates a user, sets the session, migrates the guest cookie, and claims `inquiryId` only when that inquiry is unowned and belongs to that guest or to nobody. |
| POST | `/auth/login` | Session cookie. Does not migrate a guest. |
| POST | `/auth/logout` | Clears the session. |
| POST | `/auth/forgot-password` | Always the same response. In development the link is logged when `DEV_MAIL_LOG=true`. |
| POST | `/auth/reset-password` | `{ token, password }`. |
| POST or GET | `/auth/verify-email` | Consumes a verification token. |
| GET | `/auth/oauth/google` | 404 unless Google client id, secret, and redirect URL are all set. |
| GET | `/platform/configuration` | AI status, public feature flags, featured demos, hidden stories. Never the key. |
| POST | `/guest-sessions` | Sets `triunder_guest`. |
| POST | `/guest-sessions/migrate` | Signed-in user. Result is `attach`, `already-attached`, or 409 `conflict`. |
| POST | `/demo-sessions` | Opens a compatible pair. Creates a guest cookie if needed. |
| PUT | `/demo-sessions/current` | Saves the engine snapshot for the signed-in user or the guest. |
| GET | `/demo-sessions` | The signed-in user's sessions. |
| POST, GET | `/configurations` | Saved demonstrations for the signed-in user. |
| POST | `/inquiries` | Guest or user. Validates the pair against the catalog. |
| GET | `/inquiries` | The signed-in user's inquiries only. |
| POST | `/ai/assist` | 503 when the provider is missing or unhealthy. 404 when the administrator has hidden that mode. |
| POST | `/analytics/events` | Requires `"consent": true`. Unknown event names are rejected. |
| PUT | `/profiles/me` | Optional profile fields. |

## Admin

Every `/admin` route requires `role=admin`. Hiding a button is not the control.

Inquiries can be filtered with `status`, `industry`, and `solution`. Status changes and notes are audited. User role changes cannot remove the caller's own admin role. `PUT /admin/settings` merges the fields it receives. `POST /admin/integrations/openai/health` calls the provider and records the error category, not a response body and not the key.

Rate limits default to 120 requests a minute, 10 on `/auth`, and 8 on `/ai`, per client address. `TRUST_PROXY=true` uses the first `X-Forwarded-For` hop and should be set only behind the Triunder proxy.
