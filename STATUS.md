# Triunder — implementation status

Updated during the initial build session.

## Completed

- [x] Phase 0 — Greenfield assessment (empty repo → monorepo)
- [x] Phase 1 — pnpm + Turborepo, brand mark/SVG/favicon, design tokens, i18n en/es, routing shell
- [x] Phase 2 — Homepage as showroom entrance (industry grid, featured demos, capabilities)
- [x] Phase 3 — 20 industries, solution catalog, complexity profiles, theme engine, URL config
- [x] Phase 4 — Demo application shell (sidebar, dashboard, tables, search/filter, notifications)
- [x] Phase 5 — Six interactive demos: Healthcare CRM, Retail E-commerce, MES, Fleet, Real Estate CRM, Agriculture IoT
- [x] Phase 8 (foundation) — OpenAI provider abstraction, missing-key detection, admin status endpoints, template fallback (never labeled as AI)

## In progress

- [x] Phase 6 (showroom) — Module add/remove in the demo shell; cross-module effects live in `@triunder/demo-engine`
- [ ] Phase 6 remainder — persist compositions server-side and cover every cross-module path in the browser
- [ ] Phase 7 — PostgreSQL persistence, real auth, secure guest tokens, guest→account migration

## Remaining

- [ ] Phase 9 — Full requirements/scope builders in UI (API endpoint exists)
- [ ] Phase 10 — User dashboard + admin panel UI
- [ ] Phase 11 — Playwright e2e, a11y, visual regression, coverage gates
- [ ] Phase 12 — Harden Docker/CI, seeds, production deploy docs

## Verification (this session)

- `@triunder/demo-engine` — 17 tests, coverage statements 85.7%, functions 89.3%, branches 54.3% (gate is 50% until negative paths are filled in)
- `@triunder/solution-registry` — 6 tests
- `@triunder/web` — 6 tests, `tsc --noEmit` clean
- `go test ./...` in `apps/api` — AI provider package green; HTTP routes still untested
- Browser: homepage, retail catalog, add-to-cart, simulated checkout (stock 18 → 17, order count persisted in `sessionStorage` across refresh)
- Web: `pnpm --filter @triunder/web dev` → http://localhost:5173

## Known limitations

- Guest session tokens are bootstrap placeholders until DB migrations land
- Contact/inquiry form acknowledges locally until persistence is wired
- Each industry’s primary solution opens the demo engine. Flagship demos (healthcare, retail, manufacturing, fleet, real estate, agriculture) have specialized workflows; the other industries use the generic registry demo
- AI features stay hidden/fallback until `OPENAI_API_KEY` + `PUBLIC_AI_FEATURES_ENABLED=true`
