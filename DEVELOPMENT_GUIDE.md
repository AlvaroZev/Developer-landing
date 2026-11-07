# Development guide

Use the registries. Do not sprinkle `if (industry === "healthcare")` through a page.

## Add an industry

1. Add the industry in `packages/industry-registry/src/industries.ts`, including flavor, currency, and theme slug.
2. Add light and dark tokens in `packages/theme-system` and keep the contrast test green.
3. Add its row to `compatibility` in `packages/solution-registry/src/catalog.ts`. Use solutions that already exist unless you are also adding a solution. Leave `custom` empty.
4. Add any vocabulary or extra fields in `packages/demo-engine/src/vocabulary.ts`.
5. Add English and Spanish copy for anything new in `packages/i18n`.
6. Run `node scripts/export-catalog.mjs`. The registry tests fail if the JSON copy is stale.

The homepage, routes, and API pick the industry up from those registries. There is no second list to edit.

## Add a solution

1. Add the solution in `packages/solution-registry/src/catalog.ts` with both languages, a category, workflows, and integrations.
2. Add a blueprint in the matching file under `packages/demo-engine/src/blueprints` and register it.
3. Teach `exercise.ts` which action proves the workflow, if the generic plan is not enough.
4. Put the solution on the industries that should offer it. A solution with no industry fails the registry test.
5. Export the catalog JSON again.

## Add a workflow effect

Change `reduceDemo` in `packages/demo-engine/src/reduce.ts` and cover it with a focused test plus the generated pair exercise. Do not fork a second reducer.

## Add an API field

Change `packages/contracts` and the matching check in `apps/api/internal/httpapi/validate.go` in the same change. Persist it through `internal/store`, with a new SQL file in `database/migrations`. Do not alter `001_init.sql` after it has been applied anywhere.

## Add an AI feature

Implement it on the `ai.Provider` interface. Gate the route on both provider status and the administrator flag. Do not call OpenAI from the browser. Do not return a canned paragraph when the key is missing.

## Tests that must keep passing

- Registry and theme tests, which are generated from the data rather than a handwritten industry list.
- `packages/demo-engine` exercises every compatible pair.
- `go test ./apps/api/...` covers auth, ownership, migration, and the missing-key behavior.
- Playwright covers the first-screen selectors and one full visitor journey on desktop and mobile.

Visual screenshot baselines are not committed. Contrast for the shared tokens is checked in the theme package. Accessibility smoke uses axe and currently disables the color-contrast rule because the token tests own that check.
