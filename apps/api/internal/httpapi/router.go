package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/triunder/triunder/apps/api/internal/ai"
	"github.com/triunder/triunder/apps/api/internal/config"
)

func NewRouter(cfg config.Config, provider ai.Provider) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   strings.Split(cfg.CORSOrigins, ","),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Guest-Token"},
		AllowCredentials: true,
	}))

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "triunder-api"})
	})

	r.Route("/api/v1", func(api chi.Router) {
		api.Get("/platform/configuration", func(w http.ResponseWriter, _ *http.Request) {
			openai, ok := provider.(*ai.OpenAIProvider)
			model := ""
			status := provider.Status()
			if ok {
				model = openai.Model()
			}
			writeJSON(w, http.StatusOK, map[string]any{
				"ai": map[string]any{
					"provider":           provider.Name(),
					"status":             status,
					"model":              model,
					"publicFeaturesVisible": cfg.PublicAIEnabled && provider.Configured(),
					"features": map[string]bool{
						"requirementsGenerator": cfg.PublicAIEnabled && provider.Configured(),
						"projectAssistant":      cfg.PublicAIEnabled && provider.Configured(),
						"scopeGenerator":        cfg.PublicAIEnabled && provider.Configured(),
					},
				},
			})
		})

		api.Get("/admin/integrations/openai", func(w http.ResponseWriter, _ *http.Request) {
			// Auth middleware lands with admin panel — endpoint structure is ready.
			openai, ok := provider.(*ai.OpenAIProvider)
			payload := map[string]any{
				"provider": provider.Name(),
				"status":   provider.Status(),
				"configured": provider.Configured(),
				"hint":     "Set OPENAI_API_KEY in the environment. The key is never displayed.",
			}
			if ok {
				payload["model"] = openai.Model()
				payload["lastErrorCategory"] = openai.LastErrorCategory()
				if t := openai.LastSuccessfulHealthCheck(); t != nil {
					payload["lastSuccessfulHealthCheck"] = t.Format(time.RFC3339)
				}
			}
			writeJSON(w, http.StatusOK, payload)
		})

		api.Post("/admin/integrations/openai/health", func(w http.ResponseWriter, r *http.Request) {
			err := provider.HealthCheck(r.Context())
			if err != nil {
				writeJSON(w, http.StatusServiceUnavailable, map[string]any{
					"ok":     false,
					"status": provider.Status(),
					"error":  "health_check_failed",
				})
				return
			}
			writeJSON(w, http.StatusOK, map[string]any{"ok": true, "status": provider.Status()})
		})

		api.Post("/requirements/generate", func(w http.ResponseWriter, r *http.Request) {
			var input ai.RequirementsInput
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
				return
			}
			if !provider.Configured() || !cfg.PublicAIEnabled {
				// Explicit unavailable state — never fake AI output.
				doc := ai.TemplateFallback(input)
				writeJSON(w, http.StatusOK, map[string]any{
					"document": doc,
					"mode":     "template_fallback",
					"aiAvailable": false,
				})
				return
			}
			doc, err := provider.GenerateRequirements(r.Context(), input)
			if err != nil {
				writeJSON(w, http.StatusBadGateway, map[string]any{
					"error": "ai_generation_failed",
					"aiAvailable": true,
				})
				return
			}
			writeJSON(w, http.StatusOK, map[string]any{
				"document": doc,
				"mode":     "openai",
				"aiAvailable": true,
			})
		})

		api.Post("/analytics/events", func(w http.ResponseWriter, r *http.Request) {
			var event map[string]any
			if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
				return
			}
			// Persistence lands with PostgreSQL wiring; acknowledge for funnel continuity.
			writeJSON(w, http.StatusAccepted, map[string]string{"status": "accepted"})
		})

		api.Post("/guest-sessions", func(w http.ResponseWriter, _ *http.Request) {
			writeJSON(w, http.StatusCreated, map[string]any{
				"id":    "guest-pending-persistence",
				"token": "dev-guest-token",
				"note":  "Full guest token security and persistence arrive with DB migrations.",
			})
		})
	})

	return r
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
