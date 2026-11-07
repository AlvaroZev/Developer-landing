package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"triunder/apps/api/internal/auth"
	"triunder/apps/api/internal/store"
)

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	user, _, ok, _ := s.actor(r)
	if !ok {
		writeJSON(w, http.StatusOK, map[string]any{"user": nil, "profile": nil})
		return
	}
	profile, err := s.store.Profile(r.Context(), user.ID)
	if err != nil {
		profile = store.EmptyProfile()
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": publicUser(user), "profile": profile})
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email             string `json:"email"`
		Password          string `json:"password"`
		PreferredLanguage string `json:"preferredLanguage"`
		InquiryID         string `json:"inquiryId"`
	}
	if !decode(w, r, &body) {
		return
	}
	fields := map[string]string{}
	body.Email = strings.TrimSpace(body.Email)
	if !auth.ValidEmail(body.Email) {
		fields["email"] = "invalid"
	}
	if !auth.ValidPassword(body.Password) {
		fields["password"] = "invalid"
	}
	if len(fields) > 0 {
		writeError(w, http.StatusBadRequest, "invalid", "Check the highlighted fields.", fields)
		return
	}
	hash, err := auth.HashPassword(body.Password, s.cfg.BcryptCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not create the account.", nil)
		return
	}
	user, err := s.store.CreateUser(r.Context(), body.Email, hash, "user", false)
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "conflict", "An account with that email already exists.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not create the account.", nil)
		return
	}
	language := "en"
	if body.PreferredLanguage == "es" {
		language = "es"
	}
	profile := store.EmptyProfile()
	profile.PreferredLanguage = language
	_ = s.store.UpsertProfile(r.Context(), user.ID, profile)
	if err := s.issueSession(w, r, user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not start the session.", nil)
		return
	}
	_, guest, _, hasGuest := s.actor(r)
	guestID := ""
	if hasGuest {
		guestID = guest.ID
		_, _ = s.store.MigrateGuest(r.Context(), guest.ID, user.ID)
	}
	if body.InquiryID != "" {
		_ = s.store.ClaimInquiry(r.Context(), body.InquiryID, user.ID, guestID)
	}
	s.queueVerify(r.Context(), user)
	writeJSON(w, http.StatusCreated, map[string]any{"user": publicUser(user)})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	user, err := s.store.UserByEmail(r.Context(), body.Email)
	// Login does not attach a guest. The account page has an explicit action for that.
	if err != nil || !auth.CheckPassword(user.PasswordHash, body.Password) {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is wrong.", nil)
		return
	}
	if err := s.issueSession(w, r, user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not start the session.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": publicUser(user)})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("triunder_session"); err == nil && cookie.Value != "" {
		_ = s.store.DeleteSession(r.Context(), auth.HashToken(s.cfg.SessionSecret, cookie.Value))
	}
	s.clearCookie(w, "triunder_session")
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) forgot(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if !decode(w, r, &body) {
		return
	}
	// Same response whether or not the email exists.
	user, err := s.store.UserByEmail(r.Context(), body.Email)
	if err == nil {
		raw, hash := auth.NewToken(s.cfg.SessionSecret)
		_ = s.store.CreateEmailToken(r.Context(), user.ID, "reset", hash, time.Now().Add(time.Hour))
		s.sendMail(user.Email, "Reset your Triunder password", s.cfg.WebOrigin+"/reset-password?token="+raw)
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) reset(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	if !auth.ValidPassword(body.Password) {
		writeError(w, http.StatusBadRequest, "invalid", "Password does not meet the policy.", map[string]string{"password": "invalid"})
		return
	}
	userID, err := s.store.ConsumeEmailToken(r.Context(), "reset", auth.HashToken(s.cfg.SessionSecret, body.Token))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid", "This reset link is no longer valid.", nil)
		return
	}
	hash, err := auth.HashPassword(body.Password, s.cfg.BcryptCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not update the password.", nil)
		return
	}
	if err := s.store.SetPassword(r.Context(), userID, hash); err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not update the password.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) verify(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		var body struct {
			Token string `json:"token"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		token = body.Token
	}
	userID, err := s.store.ConsumeEmailToken(r.Context(), "verify", auth.HashToken(s.cfg.SessionSecret, token))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid", "This verification link is no longer valid.", nil)
		return
	}
	_ = s.store.SetEmailVerified(r.Context(), userID)
	if r.Method == http.MethodGet {
		http.Redirect(w, r, s.cfg.WebOrigin+"/login?verified=1", http.StatusSeeOther)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) queueVerify(ctx context.Context, user store.User) {
	raw, hash := auth.NewToken(s.cfg.SessionSecret)
	_ = s.store.CreateEmailToken(ctx, user.ID, "verify", hash, time.Now().Add(24*time.Hour))
	s.sendMail(user.Email, "Verify your Triunder email", s.cfg.WebOrigin+"/api/v1/auth/verify-email?token="+raw)
}

func (s *Server) googleConfigured() bool {
	return s.cfg.GoogleClientID != "" && s.cfg.GoogleSecret != "" && s.cfg.GoogleRedirect != ""
}

func (s *Server) googleStart(w http.ResponseWriter, r *http.Request) {
	if !s.googleConfigured() {
		writeError(w, http.StatusNotFound, "not_found", "Google sign-in is not configured.", nil)
		return
	}
	raw, _ := auth.NewToken(s.cfg.SessionSecret)
	s.setCookie(w, "triunder_oauth", raw, 600)
	query := url.Values{}
	query.Set("client_id", s.cfg.GoogleClientID)
	query.Set("redirect_uri", s.cfg.GoogleRedirect)
	query.Set("response_type", "code")
	query.Set("scope", "openid email profile")
	query.Set("state", raw)
	http.Redirect(w, r, "https://accounts.google.com/o/oauth2/v2/auth?"+query.Encode(), http.StatusFound)
}

func (s *Server) googleCallback(w http.ResponseWriter, r *http.Request) {
	if !s.googleConfigured() {
		writeError(w, http.StatusNotFound, "not_found", "Google sign-in is not configured.", nil)
		return
	}
	cookie, err := r.Cookie("triunder_oauth")
	if err != nil || cookie.Value == "" || cookie.Value != r.URL.Query().Get("state") || r.URL.Query().Get("code") == "" {
		http.Redirect(w, r, s.cfg.WebOrigin+"/login?error=oauth", http.StatusSeeOther)
		return
	}
	s.clearCookie(w, "triunder_oauth")
	email, verified, err := s.exchangeGoogle(r.Context(), r.URL.Query().Get("code"))
	if err != nil || !auth.ValidEmail(email) {
		http.Redirect(w, r, s.cfg.WebOrigin+"/login?error=oauth", http.StatusSeeOther)
		return
	}
	user, err := s.store.UserByEmail(r.Context(), email)
	if errors.Is(err, store.ErrNotFound) {
		random, _ := auth.NewToken(s.cfg.SessionSecret)
		hash, hashErr := auth.HashPassword(random, s.cfg.BcryptCost)
		if hashErr != nil {
			http.Redirect(w, r, s.cfg.WebOrigin+"/login?error=oauth", http.StatusSeeOther)
			return
		}
		user, err = s.store.CreateUser(r.Context(), email, hash, "user", verified)
	}
	if err != nil {
		http.Redirect(w, r, s.cfg.WebOrigin+"/login?error=oauth", http.StatusSeeOther)
		return
	}
	if verified && !user.EmailVerified {
		_ = s.store.SetEmailVerified(r.Context(), user.ID)
	}
	if err := s.issueSession(w, r, user.ID); err != nil {
		http.Redirect(w, r, s.cfg.WebOrigin+"/login?error=oauth", http.StatusSeeOther)
		return
	}
	http.Redirect(w, r, s.cfg.WebOrigin+"/account", http.StatusSeeOther)
}

func (s *Server) exchangeGoogle(ctx context.Context, code string) (string, bool, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", s.cfg.GoogleClientID)
	form.Set("client_secret", s.cfg.GoogleSecret)
	form.Set("redirect_uri", s.cfg.GoogleRedirect)
	form.Set("grant_type", "authorization_code")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{Timeout: 10 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return "", false, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if res.StatusCode != http.StatusOK {
		return "", false, errors.New("oauth_token")
	}
	var token struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &token); err != nil || token.AccessToken == "" {
		return "", false, errors.New("oauth_token")
	}
	infoReq, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return "", false, err
	}
	infoReq.Header.Set("Authorization", "Bearer "+token.AccessToken)
	infoRes, err := client.Do(infoReq)
	if err != nil {
		return "", false, err
	}
	defer infoRes.Body.Close()
	infoBody, _ := io.ReadAll(io.LimitReader(infoRes.Body, 1<<20))
	var info struct {
		Email    string `json:"email"`
		Verified bool   `json:"verified_email"`
	}
	if err := json.Unmarshal(infoBody, &info); err != nil {
		return "", false, err
	}
	return info.Email, info.Verified, nil
}
