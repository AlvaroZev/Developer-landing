# Architecture

## Product shape

Triunder is a **single unified showroom**. There is no separate marketing site and demo app.

Visitor journey:

`/` → industry → solution → complexity → demo app → modules → requirements → inquiry

URL state restores configuration. Guest sessions persist exploration without registration.

## Boundaries

| Area | Owner | Notes |
|---|---|---|
| Domain types | `packages/domain` | Shared vocabulary |
| Industries | `packages/industry-registry` | Source of truth + test matrix |
| Solutions | `packages/solution-registry` | Compatibility is bidirectional |
| Themes | `packages/theme-system` | CSS variables only |
| i18n | `packages/i18n` | en / es catalogs |
| Demo UI engine | `apps/web/src/features/demo` | Shell, tables, charts, actions |
| Demo seeds | `apps/web/src/features/demo/seeds` | Fictional data only |
| HTTP API | `apps/api` | Auth, persistence, AI, admin |
| AI provider | `apps/api/internal/ai` | OpenAI behind Provider interface |

## Non-goals (initial release)

- Multi-tenant SaaS / organization provisioning
- Real payment processing in demos
- Presenting simulated hardware as physically connected
- Exposing OpenAI keys to the browser

## Compatibility rule

A pair `(industry, solution)` is valid only when:

1. Industry lists the solution in `supportedSolutionIds`
2. Solution lists the industry in `compatibleIndustryIds`

`listCompatiblePairs()` drives automated matrix tests.

## Complexity

`starter | professional | enterprise` are **demonstration profiles**, not subscriptions.

## AI

- Key: `OPENAI_API_KEY` (server only)
- Default model: `gpt-4o-mini` via `OPENAI_MODEL`
- Missing key → status `missing_credentials`; no fake AI output
- Admin controls public feature visibility separately from provider availability
