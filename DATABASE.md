# Database

Postgres is the system of record when `DATABASE_URL` is set. The API applies `database/migrations` once and records the filename in `schema_migrations`. An empty `DATABASE_URL` uses the in-memory store and applies nothing. That mode is for tests and local UI checks, not for a deployment.

Identifiers are text generated in the application so both stores use the same values.

## Tables

- `users`, `user_profiles` — one profile row per user. Profile fields are optional. `role` is `user` or `admin`.
- `guest_sessions` — token hash, optional user id after migration.
- `sessions` — login token hash and expiry.
- `email_tokens` — one-time reset and verification tokens. Only the hash is stored.
- `demo_sessions` — one snapshot per person (or guest) and industry/solution pair. `state` is JSON from the demo engine.
- `saved_demonstrations` — bookmarks. They do not duplicate the snapshot.
- `inquiries`, `inquiry_notes` — the brief and administrator notes. Notes are not returned on the visitor's own list.
- `analytics_events` — consented funnel events and a small metadata object.
- `platform_settings` — one JSON document, key `showroom`, for feature flags, hidden case studies, and featured overrides. No secrets.
- `audit_logs` — administrator actions. The OpenAI key is not a column and is not written here.

Rows are owned by `user_id` or `guest_id`. Deleting a user cascades sessions, profiles, and demonstrations, and sets inquiry ownership to null so a submitted brief is not destroyed.

## Backup

`pg_dump` the `triunder` database from the Compose service. Restoring means loading that dump into an empty volume and starting the API, which will skip migrations that are already recorded.
