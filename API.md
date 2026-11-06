# API

Base path: `/api/v1`

## Conventions

- JSON request/response
- Consistent error objects `{ "error": "code" }`
- Identity from verified session/guest token — never trust client user IDs
- Rate limiting and CSRF harden as auth cookies land

## Current endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness |
| GET | `/api/v1/platform/configuration` | Public feature config (AI visibility) |
| GET | `/api/v1/admin/integrations/openai` | Admin OpenAI status (no key exposure) |
| POST | `/api/v1/admin/integrations/openai/health` | Real provider health check |
| POST | `/api/v1/requirements/generate` | AI or explicit template fallback |
| POST | `/api/v1/analytics/events` | Funnel events |
| POST | `/api/v1/guest-sessions` | Guest session bootstrap |

## OpenAI behavior

- Missing `OPENAI_API_KEY` → status `missing_credentials`
- Requirements endpoint returns `mode: "template_fallback"` and `generatedBy: "template"` when AI unavailable
- Never presents template output as OpenAI output
