-- Showroom schema. Users own their rows. There is no tenant id: a company
-- name on a profile is descriptive, not a security boundary.
-- Identifiers are generated in the application so the memory store used in
-- tests and the Postgres store persist the same values.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'admin')),
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  company_size text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  preferred_language text NOT NULL DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS guest_sessions (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS email_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('reset', 'verify')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE IF NOT EXISTS demo_sessions (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON DELETE CASCADE,
  guest_id text REFERENCES guest_sessions (id) ON DELETE CASCADE,
  industry_slug text NOT NULL,
  solution_slug text NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS demo_sessions_user_pair
  ON demo_sessions (user_id, industry_slug, solution_slug)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS demo_sessions_guest_pair
  ON demo_sessions (guest_id, industry_slug, solution_slug)
  WHERE guest_id IS NOT NULL AND user_id IS NULL;

CREATE TABLE IF NOT EXISTS saved_demonstrations (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  industry_slug text NOT NULL,
  solution_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, industry_slug, solution_slug)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  guest_id text REFERENCES guest_sessions (id) ON DELETE SET NULL,
  industry_slug text NOT NULL,
  solution_slug text NOT NULL DEFAULT '',
  custom_industry text NOT NULL DEFAULT '',
  problem text NOT NULL,
  desired text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'in_discussion', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inquiries_user ON inquiries (user_id);
CREATE INDEX IF NOT EXISTS inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS inquiries_industry ON inquiries (industry_slug);

CREATE TABLE IF NOT EXISTS inquiry_notes (
  id text PRIMARY KEY,
  inquiry_id text NOT NULL REFERENCES inquiries (id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES users (id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  guest_id text REFERENCES guest_sessions (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_type ON analytics_events (event_type);

CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  actor_id text REFERENCES users (id) ON DELETE SET NULL,
  action text NOT NULL,
  target text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
