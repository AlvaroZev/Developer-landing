// Package httpapi is the HTTP edge of the showroom.
// Identity comes from the session or guest cookie. A user id in a JSON body is
// never treated as proof of ownership. Mutating requests must send
// X-Triunder-Client so a foreign site cannot submit a form that rides the cookie.
package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"triunder/apps/api/internal/ai"
	"triunder/apps/api/internal/auth"
	"triunder/apps/api/internal/catalog"
	"triunder/apps/api/internal/config"
	"triunder/apps/api/internal/store"
)

type Mailer interface {
	Send(to, subject, body string) error
}

type LogMailer struct {
	Log     *slog.Logger
	Enabled bool
}

func (m LogMailer) Send(to, subject, body string) error {
	if !m.Enabled {
		return errors.New("mail_not_configured")
	}
	// Development only. Production refuses DEV_MAIL_LOG at startup, so a reset
	// link is never written to production logs by this mailer.
	m.Log.Info("dev_mail", "to", to, "subject", subject, "body", body)
	return nil
}

type Server struct {
	cfg       config.Config
	store     store.Store
	ai        ai.Provider
	mail      Mailer
	log       *slog.Logger
	catalog   *catalog.Catalog
	limiter   *limiter
	aiMu      sync.Mutex
	lastCheck time.Time
	lastErr   string
	aiFailed  bool
}

func New(cfg config.Config, st store.Store, provider ai.Provider, mail Mailer, log *slog.Logger, cat *catalog.Catalog) *Server {
	if provider == nil {
		provider = ai.NewOpenAI("", "")
	}
	if mail == nil {
		mail = LogMailer{Log: log, Enabled: false}
	}
	if cfg.RateGeneral == 0 {
		cfg.RateGeneral = 120
	}
	if cfg.RateAuth == 0 {
		cfg.RateAuth = 10
	}
	if cfg.RateAI == 0 {
		cfg.RateAI = 8
	}
	if cfg.BcryptCost == 0 {
		cfg.BcryptCost = 12
	}
	return &Server{
		cfg: cfg, store: st, ai: provider, mail: mail, log: log, catalog: cat,
		limiter: &limiter{hits: map[string][]time.Time{}},
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/v1/auth/me", s.me)
	mux.HandleFunc("POST /api/v1/auth/register", s.register)
	mux.HandleFunc("POST /api/v1/auth/login", s.login)
	mux.HandleFunc("POST /api/v1/auth/logout", s.logout)
	mux.HandleFunc("POST /api/v1/auth/forgot-password", s.forgot)
	mux.HandleFunc("POST /api/v1/auth/reset-password", s.reset)
	mux.HandleFunc("POST /api/v1/auth/verify-email", s.verify)
	mux.HandleFunc("GET /api/v1/auth/verify-email", s.verify)
	mux.HandleFunc("GET /api/v1/auth/oauth/google", s.googleStart)
	mux.HandleFunc("GET /api/v1/auth/oauth/google/callback", s.googleCallback)
	mux.HandleFunc("GET /api/v1/platform/configuration", s.platform)
	mux.HandleFunc("POST /api/v1/guest-sessions", s.guest)
	mux.HandleFunc("POST /api/v1/guest-sessions/migrate", s.migrate)
	mux.HandleFunc("POST /api/v1/demo-sessions", s.openDemo)
	mux.HandleFunc("PUT /api/v1/demo-sessions/current", s.saveDemoState)
	mux.HandleFunc("GET /api/v1/demo-sessions", s.listDemos)
	mux.HandleFunc("POST /api/v1/configurations", s.saveConfiguration)
	mux.HandleFunc("GET /api/v1/configurations", s.listConfigurations)
	mux.HandleFunc("POST /api/v1/inquiries", s.createInquiry)
	mux.HandleFunc("GET /api/v1/inquiries", s.listInquiries)
	mux.HandleFunc("POST /api/v1/ai/assist", s.assist)
	mux.HandleFunc("POST /api/v1/analytics/events", s.analytics)
	mux.HandleFunc("PUT /api/v1/profiles/me", s.updateProfile)
	mux.HandleFunc("GET /api/v1/admin/inquiries", s.adminInquiries)
	mux.HandleFunc("PATCH /api/v1/admin/inquiries/{id}", s.adminInquiryStatus)
	mux.HandleFunc("POST /api/v1/admin/inquiries/{id}/notes", s.adminNote)
	mux.HandleFunc("GET /api/v1/admin/users", s.adminUsers)
	mux.HandleFunc("PATCH /api/v1/admin/users/{id}", s.adminRole)
	mux.HandleFunc("GET /api/v1/admin/analytics", s.adminAnalytics)
	mux.HandleFunc("GET /api/v1/admin/integrations/openai", s.adminOpenAI)
	mux.HandleFunc("POST /api/v1/admin/integrations/openai/health", s.adminOpenAIHealth)
	mux.HandleFunc("GET /api/v1/admin/settings", s.adminSettings)
	mux.HandleFunc("PUT /api/v1/admin/settings", s.adminSaveSettings)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		s.cors(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		writeError(w, http.StatusNotFound, "not_found", "Not found.", nil)
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.cors(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		rec := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		defer func() {
			if recovered := recover(); recovered != nil {
				s.log.Error("panic", "path", r.URL.Path)
				writeError(rec, http.StatusInternalServerError, "internal", "Something went wrong.", nil)
			}
		}()
		if !s.csrfOK(r) {
			writeError(rec, http.StatusForbidden, "forbidden", "Missing client header.", nil)
			return
		}
		if !s.allow(r) {
			writeError(rec, http.StatusTooManyRequests, "rate_limited", "Too many requests.", nil)
			return
		}
		started := time.Now()
		mux.ServeHTTP(rec, r)
		s.log.Info("request", "method", r.Method, "path", r.URL.Path, "status", rec.status, "ms", time.Since(started).Milliseconds())
	})
}

func (s *Server) csrfOK(r *http.Request) bool {
	switch r.Method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return true
	default:
		return r.Header.Get("X-Triunder-Client") == "web"
	}
}

func (s *Server) allow(r *http.Request) bool {
	kind := "general"
	limit := s.cfg.RateGeneral
	// Reading the session is not a login attempt. The tighter budget is for
	// password and token mutations, and it must not share a counter with page loads.
	if strings.Contains(r.URL.Path, "/ai/") {
		kind = "ai"
		limit = s.cfg.RateAI
	} else if r.Method != http.MethodGet && r.Method != http.MethodHead && strings.Contains(r.URL.Path, "/auth/") {
		kind = "auth"
		limit = s.cfg.RateAuth
	}
	return s.limiter.allow(s.clientIP(r)+" "+kind, limit)
}

func (s *Server) clientIP(r *http.Request) string {
	if s.cfg.TrustProxy {
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			return strings.TrimSpace(strings.Split(fwd, ",")[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func (s *Server) cors(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return
	}
	for _, allowed := range s.cfg.CORSOrigins {
		if origin == allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Triunder-Client")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			return
		}
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (s *statusWriter) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

type limiter struct {
	mu   sync.Mutex
	hits map[string][]time.Time
}

func (l *limiter) allow(key string, limit int) bool {
	now := time.Now()
	cutoff := now.Add(-time.Minute)
	l.mu.Lock()
	defer l.mu.Unlock()
	kept := l.hits[key][:0]
	for _, hit := range l.hits[key] {
		if hit.After(cutoff) {
			kept = append(kept, hit)
		}
	}
	if len(kept) >= limit {
		l.hits[key] = kept
		return false
	}
	l.hits[key] = append(kept, now)
	return true
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, code, message string, fields map[string]string) {
	payload := map[string]any{"code": code, "message": message}
	if len(fields) > 0 {
		payload["fields"] = fields
	}
	writeJSON(w, status, map[string]any{"error": payload})
}

func decode(w http.ResponseWriter, r *http.Request, dest any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(dest); err != nil && !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "invalid_json", "The request body is not valid JSON.", nil)
		return false
	}
	return true
}

func (s *Server) actor(r *http.Request) (store.User, store.Guest, bool, bool) {
	var user store.User
	var guest store.Guest
	hasUser, hasGuest := false, false
	if cookie, err := r.Cookie("triunder_session"); err == nil && cookie.Value != "" {
		found, err := s.store.UserBySession(r.Context(), auth.HashToken(s.cfg.SessionSecret, cookie.Value))
		if err == nil {
			user = found
			hasUser = true
		}
	}
	if cookie, err := r.Cookie("triunder_guest"); err == nil && cookie.Value != "" {
		found, err := s.store.GuestByToken(r.Context(), auth.HashToken(s.cfg.SessionSecret, cookie.Value))
		if err == nil {
			guest = found
			hasGuest = true
		}
	}
	return user, guest, hasUser, hasGuest
}

func (s *Server) setCookie(w http.ResponseWriter, name, value string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name: name, Value: value, Path: "/", MaxAge: maxAge, HttpOnly: true,
		Secure: s.cfg.AppEnv == "production", SameSite: http.SameSiteLaxMode,
	})
}

func (s *Server) clearCookie(w http.ResponseWriter, name string) {
	s.setCookie(w, name, "", -1)
}

func (s *Server) issueSession(w http.ResponseWriter, r *http.Request, userID string) error {
	raw, hash := auth.NewToken(s.cfg.SessionSecret)
	if err := s.store.CreateSession(r.Context(), hash, userID, time.Now().Add(14*24*time.Hour)); err != nil {
		return err
	}
	s.setCookie(w, "triunder_session", raw, 14*24*3600)
	return nil
}

func publicUser(user store.User) map[string]any {
	return map[string]any{
		"id": user.ID, "email": user.Email, "role": user.Role, "emailVerified": user.EmailVerified,
	}
}

func (s *Server) requireUser(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	user, _, ok, _ := s.actor(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Sign in.", nil)
		return store.User{}, false
	}
	return user, true
}

func (s *Server) requireAdmin(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	user, ok := s.requireUser(w, r)
	if !ok {
		return store.User{}, false
	}
	if user.Role != "admin" {
		writeError(w, http.StatusForbidden, "forbidden", "Admin only.", nil)
		return store.User{}, false
	}
	return user, true
}

type aiPublic struct {
	Provider string `json:"provider"`
	Status   string `json:"status"`
	Model    string `json:"model"`
	Features struct {
		ProjectDescription     bool `json:"projectDescription"`
		RequirementsAssistance bool `json:"requirementsAssistance"`
	} `json:"features"`
	LastCheck string `json:"lastCheck,omitempty"`
	LastError string `json:"lastError,omitempty"`
}

func (s *Server) describeAI(ctx context.Context) aiPublic {
	settings, err := s.store.LoadSettings(ctx)
	if err != nil {
		settings = store.DefaultSettings()
	}
	view := aiPublic{Provider: "openai", Model: s.cfg.OpenAIModel, Status: "configured"}
	s.aiMu.Lock()
	failed := s.aiFailed
	if !s.lastCheck.IsZero() {
		view.LastCheck = s.lastCheck.UTC().Format(time.RFC3339)
	}
	view.LastError = s.lastErr
	s.aiMu.Unlock()
	switch {
	case !settings.AIEnabled:
		view.Status = "disabled"
	case !s.ai.Configured():
		view.Status = "missing_credentials"
	case failed:
		view.Status = "connection_error"
	}
	if view.Status == "configured" {
		view.Features.ProjectDescription = settings.ProjectDescription
		view.Features.RequirementsAssistance = settings.RequirementsAssistance
	}
	return view
}

func (s *Server) sendMail(to, subject, body string) {
	if err := s.mail.Send(to, subject, body); err != nil && s.log != nil {
		s.log.Info("mail_skipped", "category", "mail_not_configured")
	}
}

func ownerOf(user store.User, guest store.Guest, hasUser, hasGuest bool) store.Owner {
	if hasUser {
		return store.Owner{UserID: user.ID}
	}
	if hasGuest {
		return store.Owner{GuestID: guest.ID}
	}
	return store.Owner{}
}
