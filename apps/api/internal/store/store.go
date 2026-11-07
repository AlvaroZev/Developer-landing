// Package store is the persistence boundary for the showroom.
// HTTP handlers depend on this interface. Memory is the implementation used
// when DATABASE_URL is empty (tests and browser checks). Postgres is the
// implementation used in Docker and production. Do not add a second database
// access path beside this package.
package store

import (
	"context"
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflict")
)

type User struct {
	ID            string
	Email         string
	PasswordHash  string
	Role          string
	EmailVerified bool
	CreatedAt     time.Time
}

type Profile struct {
	FirstName         string `json:"firstName"`
	LastName          string `json:"lastName"`
	Company           string `json:"company"`
	JobTitle          string `json:"jobTitle"`
	Industry          string `json:"industry"`
	Country           string `json:"country"`
	City              string `json:"city"`
	Phone             string `json:"phone"`
	Website           string `json:"website"`
	CompanySize       string `json:"companySize"`
	Description       string `json:"description"`
	AvatarURL         string `json:"avatarUrl"`
	PreferredLanguage string `json:"preferredLanguage"`
}

func EmptyProfile() Profile {
	return Profile{PreferredLanguage: "en"}
}

type Guest struct {
	ID        string
	UserID    string
	CreatedAt time.Time
}

type Owner struct {
	UserID  string
	GuestID string
}

type DemoSession struct {
	ID        string
	UserID    string
	GuestID   string
	Industry  string
	Solution  string
	State     json.RawMessage
	UpdatedAt time.Time
}

type SavedDemo struct {
	ID        string    `json:"id"`
	Industry  string    `json:"industrySlug"`
	Solution  string    `json:"solutionSlug"`
	CreatedAt time.Time `json:"createdAt"`
}

type Inquiry struct {
	ID             string    `json:"id"`
	UserID         string    `json:"-"`
	GuestID        string    `json:"-"`
	IndustrySlug   string    `json:"industrySlug"`
	SolutionSlug   string    `json:"solutionSlug"`
	CustomIndustry string    `json:"customIndustry"`
	Problem        string    `json:"problem"`
	Desired        string    `json:"desired"`
	Details        string    `json:"details"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Company        string    `json:"company"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type Note struct {
	ID        string    `json:"id"`
	AuthorID  string    `json:"authorId"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

type Event struct {
	Type     string
	UserID   string
	GuestID  string
	Metadata map[string]string
}

type Pair struct {
	Industry string `json:"industry"`
	Solution string `json:"solution"`
}

type Copy struct {
	Headline string `json:"headline,omitempty"`
	Support  string `json:"support,omitempty"`
}

type Settings struct {
	AIEnabled              bool            `json:"aiEnabled"`
	ProjectDescription     bool            `json:"projectDescription"`
	RequirementsAssistance bool            `json:"requirementsAssistance"`
	Featured               []Pair          `json:"featuredDemos"`
	Hidden                 []string        `json:"hiddenCaseStudies"`
	Copy                   map[string]Copy `json:"copyOverrides"`
}

func DefaultSettings() Settings {
	return Settings{
		AIEnabled:          true,
		ProjectDescription: true,
		Featured:           []Pair{},
		Hidden:             []string{},
		Copy:               map[string]Copy{},
	}
}

type Count struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type Analytics struct {
	Visitors    int
	DemoStarted int
	Funnel      map[string]int
	Industries  []Count
	Solutions   []Count
}

// Store is the complete persistence contract. A new capability belongs here
// before it belongs in a handler. MigrateGuest is the only guest-to-account
// path: it is transactional in Postgres and locked in memory, and a conflict
// leaves the guest rows where they were.
type Store interface {
	CreateUser(ctx context.Context, email, passwordHash, role string, verified bool) (User, error)
	UserByEmail(ctx context.Context, email string) (User, error)
	UserByID(ctx context.Context, id string) (User, error)
	ListUsers(ctx context.Context) ([]User, error)
	SetRole(ctx context.Context, id, role string) error
	SetPassword(ctx context.Context, id, passwordHash string) error
	SetEmailVerified(ctx context.Context, id string) error
	CountUsers(ctx context.Context, role string) (int, error)
	EnsureAdmin(ctx context.Context, email, passwordHash string) error

	UpsertProfile(ctx context.Context, userID string, profile Profile) error
	Profile(ctx context.Context, userID string) (Profile, error)

	CreateGuest(ctx context.Context, tokenHash string) (Guest, error)
	GuestByToken(ctx context.Context, tokenHash string) (Guest, error)
	MigrateGuest(ctx context.Context, guestID, userID string) (string, error)

	CreateSession(ctx context.Context, tokenHash, userID string, expires time.Time) error
	UserBySession(ctx context.Context, tokenHash string) (User, error)
	DeleteSession(ctx context.Context, tokenHash string) error

	CreateEmailToken(ctx context.Context, userID, purpose, tokenHash string, expires time.Time) error
	ConsumeEmailToken(ctx context.Context, purpose, tokenHash string) (string, error)

	UpsertDemo(ctx context.Context, owner Owner, industry, solution string, state json.RawMessage) (DemoSession, error)
	GetDemo(ctx context.Context, owner Owner, industry, solution string) (DemoSession, error)
	ListDemos(ctx context.Context, userID string) ([]DemoSession, error)

	SaveDemo(ctx context.Context, userID, industry, solution string) (SavedDemo, error)
	ListSaved(ctx context.Context, userID string) ([]SavedDemo, error)

	CreateInquiry(ctx context.Context, inquiry Inquiry) (Inquiry, error)
	ListInquiries(ctx context.Context, userID string) ([]Inquiry, error)
	ClaimInquiry(ctx context.Context, inquiryID, userID, guestID string) error
	AdminInquiries(ctx context.Context, status, industry, solution string) ([]Inquiry, error)
	UpdateInquiryStatus(ctx context.Context, id, status string) error
	AddNote(ctx context.Context, inquiryID, authorID, body string) (Note, error)
	Notes(ctx context.Context, inquiryID string) ([]Note, error)

	RecordEvents(ctx context.Context, events []Event) error
	Analytics(ctx context.Context) (Analytics, error)

	LoadSettings(ctx context.Context) (Settings, error)
	SaveSettings(ctx context.Context, settings Settings) error
	AddAudit(ctx context.Context, actorID, action, target string) error
}
