# Project structure

```text
apps/web                 React showroom. Pages stay thin; domain behavior stays in demo-engine.
apps/api                 Go API. cmd/server wires config, store, and HTTP.
  internal/httpapi       Routes, cookies, validation, admin authorization.
  internal/store         Memory and Postgres. Handlers do not write SQL.
  internal/ai            OpenAI client. The only package that sends the API key.
  internal/auth          Password hashing and token hashing.
  internal/catalog       Embedded copy of the compatibility matrix.
  internal/config        Environment variables.
packages/industry-registry   20 industries, themes, vocabulary, case studies.
packages/solution-registry   51 solutions and the compatibility map.
packages/demo-engine     Blueprints, seeding, reducer, and the exercise used by tests.
packages/theme-system    Brand and industry tokens, contrast checks.
packages/i18n            English source and Spanish translation. Missing Spanish keys fail typecheck.
packages/contracts       Zod schemas shared with the web. The Go limits must match.
packages/domain          Inquiry compatibility, migration decision, conversion rate.
packages/api-client      Browser fetch wrapper. Sends the client header and cookies.
packages/test-utils      Catalog exercise report helper.
database/migrations      SQL applied by the API on startup. Do not edit an applied file.
infrastructure           API image, web image, nginx, Compose.
tests/e2e                Playwright visitor journey and accessibility smoke.
scripts                  Catalog export, catalog check, test report.
docs                     Generated test report only. The guides live at the repository root.
```

Do not add a second web app, a worker, or a tenant schema. A new HTTP concern goes in `httpapi` and, if it persists, in `store` first.
