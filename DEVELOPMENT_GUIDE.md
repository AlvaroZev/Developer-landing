# Development guide

## Prerequisites

- Node 20+
- pnpm 9
- Go 1.24+
- Docker (optional, for Compose)

## Local workflow

1. `pnpm install`
2. Copy `.env.example` → `.env`
3. `pnpm --filter @triunder/web dev`
4. `pnpm --filter @triunder/api dev`

## Adding an industry

1. Add theme tokens in `packages/theme-system/src/industry-themes.ts`
2. Register definition in `packages/industry-registry/src/definitions.ts`
3. Ensure referenced solutions exist and list this industry
4. Run registry tests — the new industry is included automatically

## Adding a complete demo

1. Register / update solution with `demoTemplateId`
2. Add seed in `apps/web/src/features/demo/seeds`
3. Wire `getDemoSeed`
4. Add `demoTemplateId` to `COMPLETE_DEMO_TEMPLATE_IDS` when fully interactive
5. Add store/workflow tests and an e2e smoke path

## Security notes

- Never put secrets in `VITE_*` variables
- Ownership must be derived from verified sessions, not client-supplied user IDs
- Demo data must remain fictional

## Testing expectations

No feature is done without automated verification. Registry-driven tests must stay source-of-truth based — do not hardcode industry lists in test files.
