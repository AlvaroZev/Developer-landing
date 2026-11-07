package config

import "testing"

func TestProductionRefusesUnsafeFlags(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("SESSION_SECRET", "short")
	t.Setenv("DEV_MAIL_LOG", "false")
	t.Setenv("ADMIN_EMAIL", "")
	t.Setenv("ADMIN_PASSWORD", "")
	if _, err := Load(); err == nil {
		t.Fatal("expected a short session secret to be refused")
	}
	t.Setenv("SESSION_SECRET", "this-is-a-long-enough-production-secret")
	t.Setenv("DEV_MAIL_LOG", "true")
	if _, err := Load(); err == nil {
		t.Fatal("expected DEV_MAIL_LOG to be refused in production")
	}
}

func TestDevelopmentAllowsALocalSecret(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("SESSION_SECRET", "local-secret")
	t.Setenv("DEV_MAIL_LOG", "true")
	t.Setenv("OPENAI_MODEL", "")
	t.Setenv("OPENAI_API_KEY", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.OpenAIModel != "gpt-4o-mini" {
		t.Fatalf("default model %s", cfg.OpenAIModel)
	}
}
