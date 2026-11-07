package store

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"triunder/apps/api/internal/auth"
)

// Memory is the process-local store. It is not a production database.
// It exists so the API, the unit tests, and the browser suite can run without
// Postgres. The integration tests run the same handler paths against Postgres.
type Memory struct {
	mu        sync.Mutex
	users     map[string]User
	byEmail   map[string]string
	profiles  map[string]Profile
	guests    map[string]Guest
	guestHash map[string]string
	sessions  map[string]sessionRow
	tokens    map[string]emailToken
	demos     map[string]DemoSession
	saved     []savedRow
	inquiries map[string]Inquiry
	notes     map[string][]Note
	events    []storedEvent
	settings  Settings
}

type sessionRow struct {
	UserID  string
	Expires time.Time
}

type emailToken struct {
	UserID  string
	Purpose string
	Expires time.Time
	Used    bool
}

type savedRow struct {
	userID string
	demo   SavedDemo
}

type storedEvent struct {
	ID       string
	Type     string
	UserID   string
	GuestID  string
	Metadata map[string]string
}

func NewMemory() *Memory {
	return &Memory{
		users:     map[string]User{},
		byEmail:   map[string]string{},
		profiles:  map[string]Profile{},
		guests:    map[string]Guest{},
		guestHash: map[string]string{},
		sessions:  map[string]sessionRow{},
		tokens:    map[string]emailToken{},
		demos:     map[string]DemoSession{},
		inquiries: map[string]Inquiry{},
		notes:     map[string][]Note{},
		settings:  DefaultSettings(),
	}
}

func (m *Memory) CreateUser(_ context.Context, email, passwordHash, role string, verified bool) (User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	key := strings.ToLower(strings.TrimSpace(email))
	if _, ok := m.byEmail[key]; ok {
		return User{}, ErrConflict
	}
	user := User{ID: auth.NewID(), Email: key, PasswordHash: passwordHash, Role: role, EmailVerified: verified, CreatedAt: time.Now().UTC()}
	m.users[user.ID] = user
	m.byEmail[key] = user.ID
	m.profiles[user.ID] = EmptyProfile()
	return user, nil
}

func (m *Memory) UserByEmail(_ context.Context, email string) (User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	id, ok := m.byEmail[strings.ToLower(strings.TrimSpace(email))]
	if !ok {
		return User{}, ErrNotFound
	}
	return m.users[id], nil
}

func (m *Memory) UserByID(_ context.Context, id string) (User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	user, ok := m.users[id]
	if !ok {
		return User{}, ErrNotFound
	}
	return user, nil
}

func (m *Memory) ListUsers(_ context.Context) ([]User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]User, 0, len(m.users))
	for _, user := range m.users {
		out = append(out, user)
	}
	return out, nil
}

func (m *Memory) SetRole(_ context.Context, id, role string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	user, ok := m.users[id]
	if !ok {
		return ErrNotFound
	}
	user.Role = role
	m.users[id] = user
	return nil
}

func (m *Memory) SetPassword(_ context.Context, id, passwordHash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	user, ok := m.users[id]
	if !ok {
		return ErrNotFound
	}
	user.PasswordHash = passwordHash
	m.users[id] = user
	return nil
}

func (m *Memory) SetEmailVerified(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	user, ok := m.users[id]
	if !ok {
		return ErrNotFound
	}
	user.EmailVerified = true
	m.users[id] = user
	return nil
}

func (m *Memory) CountUsers(_ context.Context, role string) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	count := 0
	for _, user := range m.users {
		if user.Role == role {
			count++
		}
	}
	return count, nil
}

func (m *Memory) EnsureAdmin(ctx context.Context, email, passwordHash string) error {
	if _, err := m.UserByEmail(ctx, email); err == nil {
		return nil
	} else if err != ErrNotFound {
		return err
	}
	_, err := m.CreateUser(ctx, email, passwordHash, "admin", true)
	return err
}

func (m *Memory) UpsertProfile(_ context.Context, userID string, profile Profile) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.users[userID]; !ok {
		return ErrNotFound
	}
	if profile.PreferredLanguage == "" {
		profile.PreferredLanguage = "en"
	}
	m.profiles[userID] = profile
	return nil
}

func (m *Memory) Profile(_ context.Context, userID string) (Profile, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	profile, ok := m.profiles[userID]
	if !ok {
		return EmptyProfile(), ErrNotFound
	}
	return profile, nil
}

func (m *Memory) CreateGuest(_ context.Context, tokenHash string) (Guest, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	guest := Guest{ID: auth.NewID(), CreatedAt: time.Now().UTC()}
	m.guests[guest.ID] = guest
	m.guestHash[tokenHash] = guest.ID
	return guest, nil
}

func (m *Memory) GuestByToken(_ context.Context, tokenHash string) (Guest, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	id, ok := m.guestHash[tokenHash]
	if !ok {
		return Guest{}, ErrNotFound
	}
	return m.guests[id], nil
}

// MigrateGuest decides from the stored guest row. A conflict returns before any
// row is rewritten, which is the in-memory equivalent of a rolled-back transaction.
func (m *Memory) MigrateGuest(_ context.Context, guestID, userID string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	guest, ok := m.guests[guestID]
	if !ok {
		return "", ErrNotFound
	}
	if guest.UserID != "" && guest.UserID != userID {
		return "conflict", nil
	}
	if guest.UserID == userID {
		return "already-attached", nil
	}
	guest.UserID = userID
	m.guests[guestID] = guest
	for id, demo := range m.demos {
		if demo.GuestID != guestID || demo.UserID != "" {
			continue
		}
		if m.hasUserDemo(userID, demo.Industry, demo.Solution) {
			delete(m.demos, id)
			continue
		}
		demo.UserID = userID
		m.demos[id] = demo
	}
	for id, inquiry := range m.inquiries {
		if inquiry.GuestID == guestID && inquiry.UserID == "" {
			inquiry.UserID = userID
			inquiry.UpdatedAt = time.Now().UTC()
			m.inquiries[id] = inquiry
		}
	}
	return "attach", nil
}

func (m *Memory) hasUserDemo(userID, industry, solution string) bool {
	for _, demo := range m.demos {
		if demo.UserID == userID && demo.Industry == industry && demo.Solution == solution {
			return true
		}
	}
	return false
}

func (m *Memory) CreateSession(_ context.Context, tokenHash, userID string, expires time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[tokenHash] = sessionRow{UserID: userID, Expires: expires}
	return nil
}

func (m *Memory) UserBySession(_ context.Context, tokenHash string) (User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	row, ok := m.sessions[tokenHash]
	if !ok || !row.Expires.After(time.Now()) {
		delete(m.sessions, tokenHash)
		return User{}, ErrNotFound
	}
	user, ok := m.users[row.UserID]
	if !ok {
		return User{}, ErrNotFound
	}
	return user, nil
}

func (m *Memory) DeleteSession(_ context.Context, tokenHash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, tokenHash)
	return nil
}

func (m *Memory) CreateEmailToken(_ context.Context, userID, purpose, tokenHash string, expires time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.tokens[tokenHash] = emailToken{UserID: userID, Purpose: purpose, Expires: expires}
	return nil
}

func (m *Memory) ConsumeEmailToken(_ context.Context, purpose, tokenHash string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	token, ok := m.tokens[tokenHash]
	if !ok || token.Used || token.Purpose != purpose || !token.Expires.After(time.Now()) {
		return "", ErrNotFound
	}
	token.Used = true
	m.tokens[tokenHash] = token
	return token.UserID, nil
}

func (m *Memory) UpsertDemo(_ context.Context, owner Owner, industry, solution string, state json.RawMessage) (DemoSession, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if found, ok := m.findDemo(owner, industry, solution); ok {
		found.State = state
		found.UpdatedAt = time.Now().UTC()
		m.demos[found.ID] = found
		return found, nil
	}
	demo := DemoSession{ID: auth.NewID(), Industry: industry, Solution: solution, State: append(json.RawMessage(nil), state...), UpdatedAt: time.Now().UTC()}
	if owner.UserID != "" {
		demo.UserID = owner.UserID
	} else {
		demo.GuestID = owner.GuestID
	}
	m.demos[demo.ID] = demo
	return demo, nil
}

func (m *Memory) GetDemo(_ context.Context, owner Owner, industry, solution string) (DemoSession, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if found, ok := m.findDemo(owner, industry, solution); ok {
		return found, nil
	}
	return DemoSession{}, ErrNotFound
}

func (m *Memory) findDemo(owner Owner, industry, solution string) (DemoSession, bool) {
	for _, demo := range m.demos {
		if demo.Industry != industry || demo.Solution != solution {
			continue
		}
		if owner.UserID != "" && demo.UserID == owner.UserID {
			return demo, true
		}
		if owner.UserID == "" && demo.UserID == "" && demo.GuestID == owner.GuestID {
			return demo, true
		}
	}
	return DemoSession{}, false
}

func (m *Memory) ListDemos(_ context.Context, userID string) ([]DemoSession, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []DemoSession{}
	for _, demo := range m.demos {
		if demo.UserID == userID {
			out = append(out, demo)
		}
	}
	return out, nil
}

func (m *Memory) SaveDemo(_ context.Context, userID, industry, solution string) (SavedDemo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, item := range m.saved {
		if item.userID == userID && item.demo.Industry == industry && item.demo.Solution == solution {
			return item.demo, nil
		}
	}
	item := savedRow{userID: userID, demo: SavedDemo{ID: auth.NewID(), Industry: industry, Solution: solution, CreatedAt: time.Now().UTC()}}
	m.saved = append(m.saved, item)
	return item.demo, nil
}

func (m *Memory) ListSaved(_ context.Context, userID string) ([]SavedDemo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []SavedDemo{}
	for _, item := range m.saved {
		if item.userID == userID {
			out = append(out, item.demo)
		}
	}
	return out, nil
}

func (m *Memory) CreateInquiry(_ context.Context, inquiry Inquiry) (Inquiry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	now := time.Now().UTC()
	inquiry.ID = auth.NewID()
	inquiry.Status = "submitted"
	inquiry.CreatedAt = now
	inquiry.UpdatedAt = now
	m.inquiries[inquiry.ID] = inquiry
	return inquiry, nil
}

func (m *Memory) ListInquiries(_ context.Context, userID string) ([]Inquiry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []Inquiry{}
	for _, inquiry := range m.inquiries {
		if inquiry.UserID == userID {
			out = append(out, inquiry)
		}
	}
	return out, nil
}

func (m *Memory) ClaimInquiry(_ context.Context, inquiryID, userID, guestID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	inquiry, ok := m.inquiries[inquiryID]
	if !ok {
		return ErrNotFound
	}
	if inquiry.UserID == userID {
		return nil
	}
	if inquiry.UserID != "" {
		return ErrConflict
	}
	if inquiry.GuestID != "" && inquiry.GuestID != guestID {
		return ErrConflict
	}
	inquiry.UserID = userID
	inquiry.UpdatedAt = time.Now().UTC()
	m.inquiries[inquiryID] = inquiry
	return nil
}

func (m *Memory) AdminInquiries(_ context.Context, status, industry, solution string) ([]Inquiry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []Inquiry{}
	for _, inquiry := range m.inquiries {
		if status != "" && inquiry.Status != status {
			continue
		}
		if industry != "" && inquiry.IndustrySlug != industry {
			continue
		}
		if solution != "" && inquiry.SolutionSlug != solution {
			continue
		}
		out = append(out, inquiry)
	}
	return out, nil
}

func (m *Memory) UpdateInquiryStatus(_ context.Context, id, status string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	inquiry, ok := m.inquiries[id]
	if !ok {
		return ErrNotFound
	}
	inquiry.Status = status
	inquiry.UpdatedAt = time.Now().UTC()
	m.inquiries[id] = inquiry
	return nil
}

func (m *Memory) AddNote(_ context.Context, inquiryID, authorID, body string) (Note, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.inquiries[inquiryID]; !ok {
		return Note{}, ErrNotFound
	}
	note := Note{ID: auth.NewID(), AuthorID: authorID, Body: body, CreatedAt: time.Now().UTC()}
	m.notes[inquiryID] = append(m.notes[inquiryID], note)
	return note, nil
}

func (m *Memory) Notes(_ context.Context, inquiryID string) ([]Note, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := append([]Note{}, m.notes[inquiryID]...)
	if out == nil {
		out = []Note{}
	}
	return out, nil
}

func (m *Memory) RecordEvents(_ context.Context, events []Event) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, event := range events {
		meta := map[string]string{}
		for key, value := range event.Metadata {
			meta[key] = value
		}
		m.events = append(m.events, storedEvent{ID: auth.NewID(), Type: event.Type, UserID: event.UserID, GuestID: event.GuestID, Metadata: meta})
	}
	return nil
}

func (m *Memory) Analytics(_ context.Context) (Analytics, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	result := Analytics{Funnel: map[string]int{}, Industries: []Count{}, Solutions: []Count{}}
	seen := map[string]struct{}{}
	industries := map[string]int{}
	solutions := map[string]int{}
	for _, event := range m.events {
		result.Funnel[event.Type]++
		if event.Type == "demo_started" {
			result.DemoStarted++
		}
		if event.Type == "page_view" {
			key := event.UserID
			if key == "" {
				key = event.GuestID
			}
			if key == "" {
				key = event.ID
			}
			seen[key] = struct{}{}
		}
		if event.Type == "industry_selected" && event.Metadata["industry"] != "" {
			industries[event.Metadata["industry"]]++
		}
		if event.Type == "solution_selected" && event.Metadata["solution"] != "" {
			solutions[event.Metadata["solution"]]++
		}
	}
	result.Visitors = len(seen)
	result.Industries = counts(industries)
	result.Solutions = counts(solutions)
	return result, nil
}

func counts(values map[string]int) []Count {
	out := []Count{}
	for name, count := range values {
		out = append(out, Count{Name: name, Count: count})
	}
	return out
}

func (m *Memory) LoadSettings(_ context.Context) (Settings, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.settings, nil
}

func (m *Memory) SaveSettings(_ context.Context, settings Settings) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if settings.Featured == nil {
		settings.Featured = []Pair{}
	}
	if settings.Hidden == nil {
		settings.Hidden = []string{}
	}
	if settings.Copy == nil {
		settings.Copy = map[string]Copy{}
	}
	m.settings = settings
	return nil
}

func (m *Memory) AddAudit(context.Context, string, string, string) error { return nil }
