// Command server is the Triunder API process.
// It reads configuration from the environment, applies database migrations when
// DATABASE_URL is set, and serves the showroom API. An empty DATABASE_URL keeps
// an in-memory store so local checks can run without Postgres. That mode is not
// a production deployment.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"triunder/apps/api/internal/ai"
	"triunder/apps/api/internal/auth"
	"triunder/apps/api/internal/catalog"
	"triunder/apps/api/internal/config"
	"triunder/apps/api/internal/httpapi"
	"triunder/apps/api/internal/store"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		log.Error("config", "err", err.Error())
		os.Exit(1)
	}
	cat, err := catalog.Load()
	if err != nil {
		log.Error("catalog", "err", err.Error())
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var persistence store.Store
	if cfg.DatabaseURL == "" {
		log.Warn("database_url_empty", "store", "memory")
		persistence = store.NewMemory()
	} else {
		pg, err := store.OpenPostgres(ctx, cfg.DatabaseURL, cfg.MigrationsPath)
		if err != nil {
			log.Error("postgres", "err", err.Error())
			os.Exit(1)
		}
		defer pg.Close()
		persistence = pg
	}
	if cfg.AdminEmail != "" && cfg.AdminPassword != "" {
		hash, err := auth.HashPassword(cfg.AdminPassword, cfg.BcryptCost)
		if err != nil {
			log.Error("admin", "err", "hash")
			os.Exit(1)
		}
		if err := persistence.EnsureAdmin(ctx, cfg.AdminEmail, hash); err != nil {
			log.Error("admin", "err", err.Error())
			os.Exit(1)
		}
	}
	provider := ai.NewOpenAI(cfg.OpenAIKey, cfg.OpenAIBaseURL)
	if !provider.Configured() {
		log.Warn("openai_missing_credentials")
	}
	api := httpapi.New(cfg, persistence, provider, httpapi.LogMailer{Log: log, Enabled: cfg.DevMailLog}, log, cat)
	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
	}
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdown)
	}()
	log.Info("listening", "port", cfg.Port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Error("listen", "err", err.Error())
		os.Exit(1)
	}
}
