# Project structure

```text
triunder/
├── apps/
│   ├── web/                 # React showroom (Vite)
│   └── api/                 # Go REST API
├── packages/
│   ├── domain/              # Shared domain types
│   ├── industry-registry/   # 20 industries + contract tests
│   ├── solution-registry/   # Solutions + compatibility matrix
│   ├── theme-system/        # Brand + industry tokens
│   └── i18n/                # English / Spanish messages
├── database/                # Migrations & seeds (expanding)
├── infrastructure/
│   ├── docker/
│   └── compose/
├── tests/                   # Cross-cutting e2e / a11y (expanding)
├── docs/
├── scripts/
└── .github/workflows/
```

## Where new work belongs

| Change | Location |
|---|---|
| New industry | `packages/industry-registry` + theme in `theme-system` |
| New solution | `packages/solution-registry` + demo template if interactive |
| New demo interactions | `apps/web/src/features/demo` |
| Auth / persistence | `apps/api/internal/...` + `database/migrations` |
| AI feature | `apps/api/internal/ai` + admin visibility settings |
| Translation string | `packages/i18n/src/locales` |
