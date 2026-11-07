# Demonstration catalog

The showroom has 20 industries, 51 solutions, and 126 compatible pairs. The pairs are listed in `packages/solution-registry/src/catalog.ts` and copied to `apps/api/internal/catalog/catalog.json`. Custom industry is the 20th industry and intentionally has no demonstration.

Each pair is the same engine with a different blueprint and industry overlay:

- The solution blueprint chooses the presentation (pipeline, ledger, commerce, operations, calendar, telemetry, documents, analytics, control, or knowledge), the entities, and the status graph.
- The industry chooses the theme, the words, extra fields, currency, and tax.
- Seeds are deterministic fictional records. Hardware readings, robot motion, valves, and emergency stops are calculated in the reducer and labeled as simulation.

That is a complete demonstration of each declared pair. It is not 126 separately designed applications, and it should not become a single form with the labels swapped. A new behavior belongs in the blueprint or the reducer, with a test, rather than a copied page.

`pnpm --filter @triunder/demo-engine test` runs every pair through seeding and one real action. Focused tests cover billing, tax, marketplace fees, scheduling conflicts, project progress, inventory reorder, irrigation, emergency stop, retrieval, and document extraction.

Known limits:

- Screenshot baselines are not stored. Token contrast is tested in `@triunder/theme-system`.
- Password reset mail is delivered only to the development log. The token flow itself is implemented.
- Google sign-in is implemented and hidden until the three Google environment variables are set. The automated tests do not call Google.
- OpenAI assistance works only with `OPENAI_API_KEY`. The default model is `gpt-4o-mini` when `OPENAI_MODEL` is empty. Tests use a stand-in server and do not spend API credit.
