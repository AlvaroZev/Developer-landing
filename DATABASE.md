# Database

Primary store: **PostgreSQL**.

## Initial entities (planned / implementing)

- users, user_profiles
- guest_sessions
- demo_sessions, demo_session_events
- saved_configurations, configuration_modules
- projects, project_modules
- requirements_documents, requirements_sections
- project_inquiries, inquiry_notes
- favorites
- analytics_events
- platform_settings, feature_flags
- admin_roles, admin_permissions, admin_audit_logs

Industry/solution catalogs remain code-owned registries for the showroom engine. Admin catalog management can overlay featured/status flags without forking the registry contracts.

## Rules

- Foreign keys + ownership columns for user-scoped data
- JSONB for snapshots/config payloads, not as a substitute for relational modeling
- Migrations only — no ad-hoc schema drift
- Do **not** store API keys in ordinary settings tables

## Local

Default Compose URL:

`postgres://triunder:triunder@localhost:5432/triunder?sslmode=disable`
