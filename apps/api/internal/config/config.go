// Package config reads process environment. Secrets stay here and are never
// written to the database or returned by an HTTP handler.
package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"triunder/apps/api/internal/auth"
)

type Config struct {
	AppEnv         string
	Port           string
	DatabaseURL    string
	MigrationsPath string
	CORSOrigins    []string
	WebOrigin      string
	SessionSecret  string
	AdminEmail     string
	AdminPassword  string
	DevMailLog     bool
	OpenAIKey      string
	OpenAIModel    string
	OpenAIBaseURL  string
	GoogleClientID string
	GoogleSecret   string
	GoogleRedirect string
	TrustProxy     bool
	BcryptCost     int
	RateGeneral    int
	RateAuth       int
	RateAI         int
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:         env("APP_ENV", "development"),
		Port:           env("API_PORT", "8080"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		MigrationsPath: env("MIGRATIONS_PATH", "database/migrations"),
		CORSOrigins:    split(env("CORS_ORIGINS", "http://localhost:5173")),
		WebOrigin:      os.Getenv("PUBLIC_WEB_ORIGIN"),
		SessionSecret:  os.Getenv("SESSION_SECRET"),
		AdminEmail:     strings.TrimSpace(os.Getenv("ADMIN_EMAIL")),
		AdminPassword:  os.Getenv("ADMIN_PASSWORD"),
		DevMailLog:     os.Getenv("DEV_MAIL_LOG") == "true",
		OpenAIKey:      strings.TrimSpace(os.Getenv("OPENAI_API_KEY")),
		OpenAIModel:    strings.TrimSpace(os.Getenv("OPENAI_MODEL")),
		OpenAIBaseURL:  strings.TrimRight(os.Getenv("OPENAI_BASE_URL"), "/"),
		GoogleClientID: strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID")),
		GoogleSecret:   os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirect: strings.TrimSpace(os.Getenv("GOOGLE_REDIRECT_URL")),
		TrustProxy:     os.Getenv("TRUST_PROXY") == "true",
		BcryptCost:     12,
		RateGeneral:    120,
		RateAuth:       10,
		RateAI:         8,
	}
	if cfg.OpenAIModel == "" {
		// Documented default. Changing it is an environment choice, not a code default elsewhere.
		cfg.OpenAIModel = "gpt-4o-mini"
	}
	if cfg.WebOrigin == "" && len(cfg.CORSOrigins) > 0 {
		cfg.WebOrigin = cfg.CORSOrigins[0]
	}
	if cfg.AppEnv != "production" && cfg.BcryptCost == 12 {
		cfg.BcryptCost = 10
	}
	if cfg.AppEnv == "production" {
		if len(cfg.SessionSecret) < 32 {
			return cfg, errors.New("SESSION_SECRET must be at least 32 characters in production")
		}
		if cfg.DevMailLog {
			return cfg, errors.New("DEV_MAIL_LOG is refused in production")
		}
		if cfg.AdminEmail != "" && !auth.ValidPassword(cfg.AdminPassword) {
			return cfg, errors.New("ADMIN_PASSWORD does not meet the password policy")
		}
	}
	if cfg.SessionSecret == "" {
		return cfg, errors.New("SESSION_SECRET is required")
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func split(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

// Int is used by tests that want to override a limit from an env value.
func Int(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return parsed
}
