# AI development guide

Instructions for future Cursor / coding agents working on Triunder.

## 1. Mental model

Triunder is a **unified interactive engineering showroom**, not a multi-tenant SaaS and not a static portfolio.

## 2. Where capabilities live

| Capability | Path |
|---|---|
| Domain contracts | `packages/domain` |
| Industries | `packages/industry-registry` |
| Solutions / compatibility | `packages/solution-registry` |
| Themes | `packages/theme-system` |
| Translations | `packages/i18n` |
| Showroom UI | `apps/web` |
| Demo engine | `apps/web/src/features/demo` |
| API / auth / AI | `apps/api` |

## 3. Extension rules

- **New industry:** register definition + theme; do not scatter conditionals.
- **New solution:** register with explicit `compatibleIndustryIds`.
- **New demo:** seed + store actions + tests; mark complete in `COMPLETE_DEMO_TEMPLATE_IDS`.
- **New AI provider:** implement `ai.Provider`; keep OpenAI calls server-side.
- **New analytics event:** follow `AnalyticsEventType` in domain.

## 4. Do not casually change

- Bidirectional industry/solution compatibility rule
- Unified showroom routing (no split marketing app)
- Server-only OpenAI credentials
- User-scoped isolation (no premature tenancy)
- Registry-driven test matrices

## 5. Test matrix

- Industry contract tests iterate `listIndustries()`
- Compatibility tests use `listCompatiblePairs()`
- Adding a registry entry automatically expands coverage

## 6. Before editing

1. Find the architectural owner
2. Read neighboring tests
3. Reuse registries/contracts
4. Update docs when behavior changes
5. Run `pnpm test` and `go test ./...` in `apps/api`

## 7. Comments

Prefer comments that explain WHY, WHERE to extend, and security/extension constraints — not narration of obvious code.
