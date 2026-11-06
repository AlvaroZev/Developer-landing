package config

import (
	"os"
	"strconv"
)

// Config is loaded from environment variables at process start.
// Secrets (OPENAI_API_KEY, DB credentials, session secrets) must NEVER be
// returned in API responses or written to ordinary DB config tables.
type Config struct {
	Port            string
	DatabaseURL     string
	CORSOrigins     string
	SessionSecret   string
	OpenAIAPIKey    string
	OpenAIModel     string
	Environment     string
	PublicAIEnabled bool
}

func Load() Config {
	return Config{
		Port:            getenv("PORT", "8080"),
		DatabaseURL:     getenv("DATABASE_URL", "postgres://triunder:triunder@localhost:5432/triunder?sslmode=disable"),
		CORSOrigins:     getenv("CORS_ORIGINS", "http://localhost:5173"),
		SessionSecret:   getenv("SESSION_SECRET", "dev-only-change-me"),
		OpenAIAPIKey:    os.Getenv("OPENAI_API_KEY"),
		OpenAIModel:     getenv("OPENAI_MODEL", "gpt-4o-mini"),
		Environment:     getenv("APP_ENV", "development"),
		PublicAIEnabled: getenvBool("PUBLIC_AI_FEATURES_ENABLED", false),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
