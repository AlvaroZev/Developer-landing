package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"triunder/apps/api/internal/ai"
	"triunder/apps/api/internal/auth"
	"triunder/apps/api/internal/catalog"
	"triunder/apps/api/internal/config"
	"triunder/apps/api/internal/store"
)

type mailbox struct {
	mu   sync.Mutex
	body []string
}

func (m *mailbox) Send(_, _, body string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.body = append(m.body, body)
	return nil
}

func testServer(t *testing.T, provider ai.Provider, cfg config.Config) (*httptest.Server, *http.Client, *mailbox, store.Store) {
	t.Helper()
	cat, err := catalog.Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.SessionSecret == "" {
		cfg.SessionSecret = "test-secret-test-secret-test-secret"
	}
	if cfg.BcryptCost == 0 {
		cfg.BcryptCost = bcrypt.MinCost
	}
	if cfg.OpenAIModel == "" {
		cfg.OpenAIModel = "gpt-4o-mini"
	}
	if cfg.WebOrigin == "" {
		cfg.WebOrigin = "http://127.0.0.1:5173"
	}
	if cfg.RateGeneral == 0 {
		cfg.RateGeneral = 1000
	}
	if cfg.RateAuth == 0 {
		cfg.RateAuth = 1000
	}
	if cfg.RateAI == 0 {
		cfg.RateAI = 1000
	}
	if provider == nil {
		provider = ai.NewOpenAI("", "")
	}
	mem := store.NewMemory()
	mail := &mailbox{}
	handler := New(cfg, mem, provider, mail, slog.New(slog.NewTextHandler(io.Discard, nil)), cat).Handler()
	ts := httptest.NewServer(handler)
	t.Cleanup(ts.Close)
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	return ts, &http.Client{Jar: jar}, mail, mem
}

func call(t *testing.T, client *http.Client, method, url string, body any, csrf bool) (int, []byte) {
	t.Helper()
	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		reader = bytes.NewReader(raw)
	}
	req, err := http.NewRequest(method, url, reader)
	if err != nil {
		t.Fatal(err)
	}
	if csrf {
		req.Header.Set("X-Triunder-Client", "web")
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	payload, _ := io.ReadAll(res.Body)
	return res.StatusCode, payload
}

func TestCSRFAndAuthRoundTrip(t *testing.T) {
	ts, client, mail, mem := testServer(t, nil, config.Config{})
	status, _ := call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "a@example.com", "password": "whatever1"}, false)
	if status != http.StatusForbidden {
		t.Fatalf("csrf status %d", status)
	}
	status, body := call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/register", map[string]string{
		"email": "ada@example.com", "password": "correct-horse1", "preferredLanguage": "es",
	}, true)
	if status != http.StatusCreated {
		t.Fatalf("register %d %s", status, body)
	}
	status, body = call(t, client, http.MethodGet, ts.URL+"/api/v1/auth/me", nil, true)
	if status != http.StatusOK || !strings.Contains(string(body), "ada@example.com") {
		t.Fatalf("me %d %s", status, body)
	}
	if strings.Contains(string(body), "password") {
		t.Fatalf("password material in profile response: %s", body)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/logout", map[string]string{}, true)
	if status != http.StatusNoContent {
		t.Fatalf("logout %d", status)
	}
	status, body = call(t, client, http.MethodGet, ts.URL+"/api/v1/auth/me", nil, true)
	if !strings.Contains(string(body), `"user":null`) {
		t.Fatalf("expected anonymous me, got %s", body)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "ada@example.com", "password": "wrong-password1"}, true)
	if status != http.StatusUnauthorized {
		t.Fatalf("bad login %d", status)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/forgot-password", map[string]string{"email": "ada@example.com"}, true)
	if status != http.StatusOK || len(mail.body) == 0 {
		t.Fatalf("reset mail %#v status %d", mail.body, status)
	}
	resetMail := mail.body[len(mail.body)-1]
	if !strings.Contains(resetMail, "/reset-password?token=") {
		t.Fatalf("reset mail %s", resetMail)
	}
	token := resetMail[strings.LastIndex(resetMail, "token=")+6:]
	status, body = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/reset-password", map[string]string{"token": token, "password": "newer-password1"}, true)
	if status != http.StatusOK {
		t.Fatalf("reset %d %s", status, body)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "ada@example.com", "password": "newer-password1"}, true)
	if status != http.StatusOK {
		t.Fatalf("login after reset %d", status)
	}
	_ = mem
	hash, err := auth.HashPassword("newer-password1", bcrypt.MinCost)
	if err != nil || hash == "" {
		t.Fatal(err)
	}
}

func TestInquiryOwnershipAndGuestMigration(t *testing.T) {
	ts, guestClient, _, mem := testServer(t, nil, config.Config{})
	status, _ := call(t, guestClient, http.MethodPost, ts.URL+"/api/v1/guest-sessions", map[string]string{}, true)
	if status != http.StatusCreated {
		t.Fatalf("guest %d", status)
	}
	status, body := call(t, guestClient, http.MethodPost, ts.URL+"/api/v1/inquiries", map[string]string{
		"industrySlug": "healthcare", "solutionSlug": "robotics", "problem": "This problem is long enough to submit.",
		"name": "Ada", "email": "ada@example.com",
	}, true)
	if status != http.StatusBadRequest || !strings.Contains(string(body), "incompatible_solution") {
		t.Fatalf("expected incompatible, got %d %s", status, body)
	}
	status, body = call(t, guestClient, http.MethodPost, ts.URL+"/api/v1/inquiries", map[string]string{
		"industrySlug": "healthcare", "solutionSlug": "scheduling",
		"problem": "The clinic double-books follow-up visits and loses them.",
		"name":    "Ada Lovelace", "email": "ada@example.com", "company": "Northwind",
	}, true)
	if status != http.StatusCreated {
		t.Fatalf("inquiry %d %s", status, body)
	}
	var created store.Inquiry
	if err := json.Unmarshal(body, &created); err != nil {
		t.Fatal(err)
	}
	status, body = call(t, guestClient, http.MethodPost, ts.URL+"/api/v1/auth/register", map[string]string{
		"email": "ada@example.com", "password": "correct-horse1", "inquiryId": created.ID,
	}, true)
	if status != http.StatusCreated {
		t.Fatalf("register %d %s", status, body)
	}
	status, body = call(t, guestClient, http.MethodGet, ts.URL+"/api/v1/inquiries", nil, true)
	if status != http.StatusOK || !strings.Contains(string(body), created.ID) {
		t.Fatalf("owner list %d %s", status, body)
	}

	otherJar, _ := cookiejar.New(nil)
	other := &http.Client{Jar: otherJar}
	status, body = call(t, other, http.MethodPost, ts.URL+"/api/v1/auth/register", map[string]string{
		"email": "grace@example.com", "password": "correct-horse1", "inquiryId": created.ID,
	}, true)
	if status != http.StatusCreated {
		t.Fatalf("other register %d %s", status, body)
	}
	status, body = call(t, other, http.MethodGet, ts.URL+"/api/v1/inquiries", nil, true)
	if strings.Contains(string(body), created.ID) {
		t.Fatalf("cross-user inquiry leak: %s", body)
	}
	status, _ = call(t, other, http.MethodGet, ts.URL+"/api/v1/admin/inquiries", nil, true)
	if status != http.StatusForbidden {
		t.Fatalf("user admin status %d", status)
	}

	if err := mem.EnsureAdmin(t.Context(), "admin@triunder.local", mustHash(t)); err != nil {
		t.Fatal(err)
	}
	adminJar, _ := cookiejar.New(nil)
	admin := &http.Client{Jar: adminJar}
	status, body = call(t, admin, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "admin@triunder.local", "password": "Triunder-admin-1"}, true)
	if status != http.StatusOK {
		t.Fatalf("admin login %d %s", status, body)
	}
	status, body = call(t, admin, http.MethodGet, ts.URL+"/api/v1/admin/inquiries?industry=healthcare&solution=scheduling", nil, true)
	if status != http.StatusOK || !strings.Contains(string(body), "double-books") {
		t.Fatalf("admin list %d %s", status, body)
	}
	status, _ = call(t, admin, http.MethodPatch, ts.URL+"/api/v1/admin/inquiries/"+created.ID, map[string]string{"status": "in_discussion"}, true)
	if status != http.StatusOK {
		t.Fatalf("status %d", status)
	}
	status, _ = call(t, admin, http.MethodPost, ts.URL+"/api/v1/admin/inquiries/"+created.ID+"/notes", map[string]string{"body": "Call the clinic."}, true)
	if status != http.StatusCreated {
		t.Fatalf("note %d", status)
	}
}

func TestLoginDoesNotAttachGuestUntilAsked(t *testing.T) {
	ts, guestClient, _, _ := testServer(t, nil, config.Config{})
	_, _ = call(t, guestClient, http.MethodPost, ts.URL+"/api/v1/guest-sessions", map[string]string{}, true)
	status, body := call(t, guestClient, http.MethodPost, ts.URL+"/api/v1/inquiries", map[string]string{
		"industrySlug": "custom", "customIndustry": "Shipyard", "solutionSlug": "",
		"problem": "We still plan dry dock work on a whiteboard.",
		"name":    "Grace Hopper", "email": "grace@example.com",
	}, true)
	if status != http.StatusCreated {
		t.Fatalf("inquiry %d %s", status, body)
	}
	accountJar, _ := cookiejar.New(nil)
	account := &http.Client{Jar: accountJar}
	status, _ = call(t, account, http.MethodPost, ts.URL+"/api/v1/auth/register", map[string]string{"email": "grace@example.com", "password": "correct-horse1"}, true)
	if status != http.StatusCreated {
		t.Fatalf("register %d", status)
	}
	_, _ = call(t, account, http.MethodPost, ts.URL+"/api/v1/auth/logout", map[string]string{}, true)
	guestURL, _ := http.NewRequest(http.MethodGet, ts.URL, nil)
	for _, cookie := range guestClient.Jar.Cookies(guestURL.URL) {
		if cookie.Name == "triunder_guest" {
			account.Jar.SetCookies(guestURL.URL, []*http.Cookie{cookie})
		}
	}
	status, _ = call(t, account, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "grace@example.com", "password": "correct-horse1"}, true)
	if status != http.StatusOK {
		t.Fatalf("login %d", status)
	}
	status, body = call(t, account, http.MethodGet, ts.URL+"/api/v1/inquiries", nil, true)
	if strings.Contains(string(body), "whiteboard") {
		t.Fatalf("login attached the guest: %s", body)
	}
	status, body = call(t, account, http.MethodPost, ts.URL+"/api/v1/guest-sessions/migrate", map[string]string{}, true)
	if status != http.StatusOK || !strings.Contains(string(body), "attach") {
		t.Fatalf("migrate %d %s", status, body)
	}
	status, body = call(t, account, http.MethodGet, ts.URL+"/api/v1/inquiries", nil, true)
	if !strings.Contains(string(body), "whiteboard") {
		t.Fatalf("migrate lost the inquiry: %s", body)
	}
	status, body = call(t, account, http.MethodPost, ts.URL+"/api/v1/guest-sessions/migrate", map[string]string{}, true)
	if status != http.StatusOK || !strings.Contains(string(body), "already-attached") {
		t.Fatalf("second migrate %d %s", status, body)
	}
}

func TestOpenAIIsHonestWithoutAKey(t *testing.T) {
	const secret = "sk-live-secret-value"
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer "+secret {
			t.Errorf("missing bearer")
		}
		if r.URL.Path == "/models" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"{\"problem\":\"The clinic loses follow-up visits between inboxes.\",\"desired\":\"One appointment book.\",\"notes\":\"Clarified the handoff.\"}"}}]}`))
	}))
	defer upstream.Close()
	ts, client, _, mem := testServer(t, ai.NewOpenAI(secret, upstream.URL), config.Config{OpenAIKey: secret})
	status, body := call(t, client, http.MethodGet, ts.URL+"/api/v1/platform/configuration", nil, true)
	if status != http.StatusOK || !strings.Contains(string(body), "configured") || strings.Contains(string(body), secret) {
		t.Fatalf("platform %d %s", status, body)
	}
	if err := mem.EnsureAdmin(t.Context(), "admin@triunder.local", mustHash(t)); err != nil {
		t.Fatal(err)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "admin@triunder.local", "password": "Triunder-admin-1"}, true)
	if status != http.StatusOK {
		t.Fatal(status)
	}
	status, body = call(t, client, http.MethodPost, ts.URL+"/api/v1/admin/integrations/openai/health", map[string]string{}, true)
	if status != http.StatusOK || !strings.Contains(string(body), "unauthorized") || strings.Contains(string(body), secret) {
		t.Fatalf("health %d %s", status, body)
	}
	status, body = call(t, client, http.MethodPost, ts.URL+"/api/v1/ai/assist", map[string]string{
		"mode": "describe", "industrySlug": "healthcare", "solutionSlug": "scheduling",
		"problem": "Follow-ups get lost.", "locale": "en",
	}, true)
	if status != http.StatusServiceUnavailable {
		t.Fatalf("assist while unhealthy %d %s", status, body)
	}

	healthy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/models" {
			_, _ = w.Write([]byte(`{"data":[]}`))
			return
		}
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"{\"problem\":\"The clinic loses follow-up visits between inboxes.\",\"desired\":\"One appointment book.\",\"notes\":\"Clarified the handoff.\"}"}}]}`))
	}))
	defer healthy.Close()
	ts, client, _, mem = testServer(t, ai.NewOpenAI(secret, healthy.URL), config.Config{})
	if err := mem.EnsureAdmin(t.Context(), "admin@triunder.local", mustHash(t)); err != nil {
		t.Fatal(err)
	}
	_, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "admin@triunder.local", "password": "Triunder-admin-1"}, true)
	status, body = call(t, client, http.MethodPost, ts.URL+"/api/v1/admin/integrations/openai/health", map[string]string{}, true)
	if status != http.StatusOK || !strings.Contains(string(body), `"status":"configured"`) || strings.Contains(string(body), secret) {
		t.Fatalf("healthy %d %s", status, body)
	}
	status, body = call(t, client, http.MethodPost, ts.URL+"/api/v1/ai/assist", map[string]string{
		"mode": "describe", "industrySlug": "healthcare", "solutionSlug": "scheduling",
		"problem": "Follow-ups get lost.", "locale": "en",
	}, true)
	if status != http.StatusOK || !strings.Contains(string(body), "appointment book") || strings.Contains(string(body), secret) {
		t.Fatalf("assist %d %s", status, body)
	}
	status, _ = call(t, client, http.MethodPut, ts.URL+"/api/v1/admin/settings", map[string]bool{"projectDescription": false, "aiEnabled": true}, true)
	if status != http.StatusOK {
		t.Fatalf("settings %d", status)
	}
	status, body = call(t, client, http.MethodGet, ts.URL+"/api/v1/platform/configuration", nil, true)
	if strings.Contains(string(body), `"projectDescription":true`) {
		t.Fatalf("hidden feature still public: %s", body)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/ai/assist", map[string]string{
		"mode": "describe", "industrySlug": "healthcare", "problem": "Follow-ups get lost.",
	}, true)
	if status != http.StatusNotFound {
		t.Fatalf("hidden assist %d", status)
	}

	missing, anon, _, _ := testServer(t, ai.NewOpenAI("", ""), config.Config{})
	status, body = call(t, anon, http.MethodGet, missing.URL+"/api/v1/platform/configuration", nil, true)
	if !strings.Contains(string(body), "missing_credentials") {
		t.Fatalf("missing key status: %s", body)
	}
	status, body = call(t, anon, http.MethodPost, missing.URL+"/api/v1/ai/assist", map[string]string{
		"mode": "describe", "industrySlug": "healthcare", "problem": "Follow-ups get lost between the front desk and the nurse.",
	}, true)
	if status != http.StatusServiceUnavailable || strings.Contains(strings.ToLower(string(body)), "as an ai") {
		t.Fatalf("fake assist %d %s", status, body)
	}
}

func TestAnalyticsConsentAndDemoGuard(t *testing.T) {
	ts, client, _, _ := testServer(t, nil, config.Config{})
	status, _ := call(t, client, http.MethodPost, ts.URL+"/api/v1/analytics/events", map[string]any{
		"consent": false, "events": []map[string]string{{"eventType": "page_view"}},
	}, true)
	if status != http.StatusBadRequest {
		t.Fatalf("consent %d", status)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/analytics/events", map[string]any{
		"consent": true, "events": []map[string]any{{"eventType": "not_real"}},
	}, true)
	if status != http.StatusBadRequest {
		t.Fatalf("event %d", status)
	}
	status, _ = call(t, client, http.MethodPost, ts.URL+"/api/v1/demo-sessions", map[string]string{
		"industrySlug": "healthcare", "solutionSlug": "robotics",
	}, true)
	if status != http.StatusNotFound {
		t.Fatalf("unsupported demo %d", status)
	}
	status, body := call(t, client, http.MethodPost, ts.URL+"/api/v1/demo-sessions", map[string]string{
		"industrySlug": "healthcare", "solutionSlug": "scheduling",
	}, true)
	if status != http.StatusOK || !strings.Contains(string(body), `"state":null`) {
		t.Fatalf("demo %d %s", status, body)
	}
}

func TestRateLimit(t *testing.T) {
	ts, client, _, _ := testServer(t, nil, config.Config{RateAuth: 2, RateGeneral: 2, RateAI: 2})
	for i := 0; i < 2; i++ {
		status, _ := call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "a@example.com", "password": "nope"}, true)
		if status == http.StatusTooManyRequests {
			t.Fatalf("limited too early on %d", i)
		}
	}
	status, _ := call(t, client, http.MethodPost, ts.URL+"/api/v1/auth/login", map[string]string{"email": "a@example.com", "password": "nope"}, true)
	if status != http.StatusTooManyRequests {
		t.Fatalf("expected rate limit, got %d", status)
	}
}

func mustHash(t *testing.T) string {
	t.Helper()
	hash, err := auth.HashPassword("Triunder-admin-1", bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	return hash
}
