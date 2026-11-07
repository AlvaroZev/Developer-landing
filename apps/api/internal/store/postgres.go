package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"triunder/apps/api/internal/auth"
)

// Postgres is the production store. Every method uses placeholders.
// MigrateGuest runs in one transaction: a conflict returns before any update,
// and a later statement error rolls the whole migration back.
type Postgres struct {
	pool *pgxpool.Pool
}

func OpenPostgres(ctx context.Context, databaseURL, migrationsPath string) (*Postgres, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("postgres: %w", err)
	}
	store := &Postgres{pool: pool}
	if err := store.migrate(ctx, migrationsPath); err != nil {
		pool.Close()
		return nil, err
	}
	return store, nil
}

func (p *Postgres) Close() { p.pool.Close() }

func (p *Postgres) migrate(ctx context.Context, dir string) error {
	if _, err := p.pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version text PRIMARY KEY,
		applied_at timestamptz NOT NULL DEFAULT now()
	)`); err != nil {
		return fmt.Errorf("schema_migrations: %w", err)
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("migrations: %w", err)
	}
	names := []string{}
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)
	for _, name := range names {
		var exists int
		if err := p.pool.QueryRow(ctx, `SELECT COUNT(*) FROM schema_migrations WHERE version = $1`, name).Scan(&exists); err != nil {
			return err
		}
		if exists > 0 {
			continue
		}
		body, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			return err
		}
		tx, err := p.pool.Begin(ctx)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, string(body)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("apply %s: %w", name, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, name); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
	}
	return nil
}

func conflict(err error) error {
	var pg *pgconn.PgError
	if errors.As(err, &pg) && pg.Code == "23505" {
		return ErrConflict
	}
	return err
}

func (p *Postgres) CreateUser(ctx context.Context, email, passwordHash, role string, verified bool) (User, error) {
	user := User{ID: auth.NewID(), Email: strings.ToLower(strings.TrimSpace(email)), PasswordHash: passwordHash, Role: role, EmailVerified: verified, CreatedAt: time.Now().UTC()}
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return User{}, err
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `INSERT INTO users (id, email, password_hash, role, email_verified, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
		user.ID, user.Email, user.PasswordHash, user.Role, user.EmailVerified, user.CreatedAt)
	if err != nil {
		return User{}, conflict(err)
	}
	_, err = tx.Exec(ctx, `INSERT INTO user_profiles (user_id) VALUES ($1)`, user.ID)
	if err != nil {
		return User{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, err
	}
	return user, nil
}

const userCols = `id, email, password_hash, role, email_verified, created_at`

func scanUser(row pgx.Row) (User, error) {
	var user User
	err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.EmailVerified, &user.CreatedAt)
	return user, err
}

func (p *Postgres) UserByEmail(ctx context.Context, email string) (User, error) {
	user, err := scanUser(p.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE email = $1`, strings.ToLower(strings.TrimSpace(email))))
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return user, err
}

func (p *Postgres) UserByID(ctx context.Context, id string) (User, error) {
	user, err := scanUser(p.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return user, err
}

func (p *Postgres) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := p.pool.Query(ctx, `SELECT `+userCols+` FROM users ORDER BY created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []User{}
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, user)
	}
	return out, rows.Err()
}

func (p *Postgres) SetRole(ctx context.Context, id, role string) error {
	tag, err := p.pool.Exec(ctx, `UPDATE users SET role = $2 WHERE id = $1`, id, role)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) SetPassword(ctx context.Context, id, passwordHash string) error {
	tag, err := p.pool.Exec(ctx, `UPDATE users SET password_hash = $2 WHERE id = $1`, id, passwordHash)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) SetEmailVerified(ctx context.Context, id string) error {
	tag, err := p.pool.Exec(ctx, `UPDATE users SET email_verified = true WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) CountUsers(ctx context.Context, role string) (int, error) {
	var count int
	err := p.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = $1`, role).Scan(&count)
	return count, err
}

func (p *Postgres) EnsureAdmin(ctx context.Context, email, passwordHash string) error {
	if _, err := p.UserByEmail(ctx, email); err == nil {
		return nil
	} else if err != ErrNotFound {
		return err
	}
	_, err := p.CreateUser(ctx, email, passwordHash, "admin", true)
	if errors.Is(err, ErrConflict) {
		return nil
	}
	return err
}

func (p *Postgres) UpsertProfile(ctx context.Context, userID string, profile Profile) error {
	if profile.PreferredLanguage == "" {
		profile.PreferredLanguage = "en"
	}
	tag, err := p.pool.Exec(ctx, `UPDATE user_profiles SET
		first_name=$2, last_name=$3, company=$4, job_title=$5, industry=$6, country=$7, city=$8,
		phone=$9, website=$10, company_size=$11, description=$12, avatar_url=$13, preferred_language=$14
		WHERE user_id=$1`,
		userID, profile.FirstName, profile.LastName, profile.Company, profile.JobTitle, profile.Industry,
		profile.Country, profile.City, profile.Phone, profile.Website, profile.CompanySize, profile.Description,
		profile.AvatarURL, profile.PreferredLanguage)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) Profile(ctx context.Context, userID string) (Profile, error) {
	var profile Profile
	err := p.pool.QueryRow(ctx, `SELECT first_name, last_name, company, job_title, industry, country, city, phone, website, company_size, description, avatar_url, preferred_language FROM user_profiles WHERE user_id=$1`, userID).
		Scan(&profile.FirstName, &profile.LastName, &profile.Company, &profile.JobTitle, &profile.Industry, &profile.Country, &profile.City, &profile.Phone, &profile.Website, &profile.CompanySize, &profile.Description, &profile.AvatarURL, &profile.PreferredLanguage)
	if errors.Is(err, pgx.ErrNoRows) {
		return EmptyProfile(), ErrNotFound
	}
	return profile, err
}

func (p *Postgres) CreateGuest(ctx context.Context, tokenHash string) (Guest, error) {
	guest := Guest{ID: auth.NewID(), CreatedAt: time.Now().UTC()}
	_, err := p.pool.Exec(ctx, `INSERT INTO guest_sessions (id, token_hash, created_at) VALUES ($1,$2,$3)`, guest.ID, tokenHash, guest.CreatedAt)
	return guest, err
}

func (p *Postgres) GuestByToken(ctx context.Context, tokenHash string) (Guest, error) {
	var guest Guest
	err := p.pool.QueryRow(ctx, `SELECT id, COALESCE(user_id, ''), created_at FROM guest_sessions WHERE token_hash=$1`, tokenHash).Scan(&guest.ID, &guest.UserID, &guest.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Guest{}, ErrNotFound
	}
	return guest, err
}

func (p *Postgres) MigrateGuest(ctx context.Context, guestID, userID string) (string, error) {
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)
	var current string
	err = tx.QueryRow(ctx, `SELECT COALESCE(user_id, '') FROM guest_sessions WHERE id=$1 FOR UPDATE`, guestID).Scan(&current)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	if current != "" && current != userID {
		return "conflict", nil
	}
	if current == userID {
		return "already-attached", nil
	}
	if _, err := tx.Exec(ctx, `UPDATE guest_sessions SET user_id=$2 WHERE id=$1`, guestID, userID); err != nil {
		return "", err
	}
	rows, err := tx.Query(ctx, `SELECT id, industry_slug, solution_slug FROM demo_sessions WHERE guest_id=$1 AND user_id IS NULL`, guestID)
	if err != nil {
		return "", err
	}
	type pair struct{ id, industry, solution string }
	pending := []pair{}
	for rows.Next() {
		var item pair
		if err := rows.Scan(&item.id, &item.industry, &item.solution); err != nil {
			rows.Close()
			return "", err
		}
		pending = append(pending, item)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return "", err
	}
	for _, item := range pending {
		var existing string
		err := tx.QueryRow(ctx, `SELECT id FROM demo_sessions WHERE user_id=$1 AND industry_slug=$2 AND solution_slug=$3`, userID, item.industry, item.solution).Scan(&existing)
		if err == nil {
			if _, err := tx.Exec(ctx, `DELETE FROM demo_sessions WHERE id=$1`, item.id); err != nil {
				return "", err
			}
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return "", err
		}
		if _, err := tx.Exec(ctx, `UPDATE demo_sessions SET user_id=$2 WHERE id=$1`, item.id, userID); err != nil {
			return "", err
		}
	}
	if _, err := tx.Exec(ctx, `UPDATE inquiries SET user_id=$2, updated_at=now() WHERE guest_id=$1 AND user_id IS NULL`, guestID, userID); err != nil {
		return "", err
	}
	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return "attach", nil
}

func (p *Postgres) CreateSession(ctx context.Context, tokenHash, userID string, expires time.Time) error {
	_, err := p.pool.Exec(ctx, `INSERT INTO sessions (id, token_hash, user_id, expires_at) VALUES ($1,$2,$3,$4)`, auth.NewID(), tokenHash, userID, expires)
	return err
}

func (p *Postgres) UserBySession(ctx context.Context, tokenHash string) (User, error) {
	_, _ = p.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash=$1 AND expires_at <= now()`, tokenHash)
	user, err := scanUser(p.pool.QueryRow(ctx, `SELECT u.id, u.email, u.password_hash, u.role, u.email_verified, u.created_at
		FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()`, tokenHash))
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return user, err
}

func (p *Postgres) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := p.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash=$1`, tokenHash)
	return err
}

func (p *Postgres) CreateEmailToken(ctx context.Context, userID, purpose, tokenHash string, expires time.Time) error {
	_, err := p.pool.Exec(ctx, `INSERT INTO email_tokens (id, user_id, purpose, token_hash, expires_at) VALUES ($1,$2,$3,$4,$5)`,
		auth.NewID(), userID, purpose, tokenHash, expires)
	return err
}

func (p *Postgres) ConsumeEmailToken(ctx context.Context, purpose, tokenHash string) (string, error) {
	var userID string
	err := p.pool.QueryRow(ctx, `UPDATE email_tokens SET used_at=now()
		WHERE token_hash=$1 AND purpose=$2 AND used_at IS NULL AND expires_at > now() RETURNING user_id`, tokenHash, purpose).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return userID, err
}

func (p *Postgres) UpsertDemo(ctx context.Context, owner Owner, industry, solution string, state json.RawMessage) (DemoSession, error) {
	current, err := p.GetDemo(ctx, owner, industry, solution)
	if err == nil {
		_, err = p.pool.Exec(ctx, `UPDATE demo_sessions SET state=$2, updated_at=now() WHERE id=$1`, current.ID, state)
		current.State = state
		current.UpdatedAt = time.Now().UTC()
		return current, err
	}
	if !errors.Is(err, ErrNotFound) {
		return DemoSession{}, err
	}
	demo := DemoSession{ID: auth.NewID(), Industry: industry, Solution: solution, State: state, UpdatedAt: time.Now().UTC()}
	var userID, guestID any
	if owner.UserID != "" {
		demo.UserID = owner.UserID
		userID = owner.UserID
	}
	if owner.UserID == "" {
		demo.GuestID = owner.GuestID
		guestID = owner.GuestID
	}
	_, err = p.pool.Exec(ctx, `INSERT INTO demo_sessions (id, user_id, guest_id, industry_slug, solution_slug, state, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		demo.ID, userID, guestID, industry, solution, state, demo.UpdatedAt)
	return demo, err
}

func (p *Postgres) GetDemo(ctx context.Context, owner Owner, industry, solution string) (DemoSession, error) {
	query := `SELECT id, COALESCE(user_id,''), COALESCE(guest_id,''), industry_slug, solution_slug, state, updated_at FROM demo_sessions WHERE industry_slug=$1 AND solution_slug=$2 AND `
	var row pgx.Row
	if owner.UserID != "" {
		row = p.pool.QueryRow(ctx, query+`user_id=$3`, industry, solution, owner.UserID)
	} else {
		row = p.pool.QueryRow(ctx, query+`user_id IS NULL AND guest_id=$3`, industry, solution, owner.GuestID)
	}
	var demo DemoSession
	err := row.Scan(&demo.ID, &demo.UserID, &demo.GuestID, &demo.Industry, &demo.Solution, &demo.State, &demo.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return DemoSession{}, ErrNotFound
	}
	return demo, err
}

func (p *Postgres) ListDemos(ctx context.Context, userID string) ([]DemoSession, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, COALESCE(user_id,''), COALESCE(guest_id,''), industry_slug, solution_slug, state, updated_at FROM demo_sessions WHERE user_id=$1 ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []DemoSession{}
	for rows.Next() {
		var demo DemoSession
		if err := rows.Scan(&demo.ID, &demo.UserID, &demo.GuestID, &demo.Industry, &demo.Solution, &demo.State, &demo.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, demo)
	}
	return out, rows.Err()
}

func (p *Postgres) SaveDemo(ctx context.Context, userID, industry, solution string) (SavedDemo, error) {
	var saved SavedDemo
	err := p.pool.QueryRow(ctx, `SELECT id, industry_slug, solution_slug, created_at FROM saved_demonstrations WHERE user_id=$1 AND industry_slug=$2 AND solution_slug=$3`, userID, industry, solution).
		Scan(&saved.ID, &saved.Industry, &saved.Solution, &saved.CreatedAt)
	if err == nil {
		return saved, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return SavedDemo{}, err
	}
	saved = SavedDemo{ID: auth.NewID(), Industry: industry, Solution: solution, CreatedAt: time.Now().UTC()}
	_, err = p.pool.Exec(ctx, `INSERT INTO saved_demonstrations (id, user_id, industry_slug, solution_slug, created_at) VALUES ($1,$2,$3,$4,$5)`,
		saved.ID, userID, industry, solution, saved.CreatedAt)
	return saved, conflict(err)
}

func (p *Postgres) ListSaved(ctx context.Context, userID string) ([]SavedDemo, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, industry_slug, solution_slug, created_at FROM saved_demonstrations WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SavedDemo{}
	for rows.Next() {
		var saved SavedDemo
		if err := rows.Scan(&saved.ID, &saved.Industry, &saved.Solution, &saved.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, saved)
	}
	return out, rows.Err()
}

func (p *Postgres) CreateInquiry(ctx context.Context, inquiry Inquiry) (Inquiry, error) {
	now := time.Now().UTC()
	inquiry.ID = auth.NewID()
	inquiry.Status = "submitted"
	inquiry.CreatedAt = now
	inquiry.UpdatedAt = now
	var userID, guestID any
	if inquiry.UserID != "" {
		userID = inquiry.UserID
	}
	if inquiry.GuestID != "" {
		guestID = inquiry.GuestID
	}
	_, err := p.pool.Exec(ctx, `INSERT INTO inquiries
		(id, user_id, guest_id, industry_slug, solution_slug, custom_industry, problem, desired, details, name, email, company, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
		inquiry.ID, userID, guestID, inquiry.IndustrySlug, inquiry.SolutionSlug, inquiry.CustomIndustry, inquiry.Problem, inquiry.Desired, inquiry.Details, inquiry.Name, inquiry.Email, inquiry.Company, inquiry.Status, inquiry.CreatedAt, inquiry.UpdatedAt)
	return inquiry, err
}

const inquiryCols = `id, COALESCE(user_id,''), COALESCE(guest_id,''), industry_slug, solution_slug, custom_industry, problem, desired, details, name, email, company, status, created_at, updated_at`

func scanInquiry(row pgx.Row) (Inquiry, error) {
	var inquiry Inquiry
	err := row.Scan(&inquiry.ID, &inquiry.UserID, &inquiry.GuestID, &inquiry.IndustrySlug, &inquiry.SolutionSlug, &inquiry.CustomIndustry, &inquiry.Problem, &inquiry.Desired, &inquiry.Details, &inquiry.Name, &inquiry.Email, &inquiry.Company, &inquiry.Status, &inquiry.CreatedAt, &inquiry.UpdatedAt)
	return inquiry, err
}

func (p *Postgres) ListInquiries(ctx context.Context, userID string) ([]Inquiry, error) {
	rows, err := p.pool.Query(ctx, `SELECT `+inquiryCols+` FROM inquiries WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectInquiries(rows)
}

func (p *Postgres) ClaimInquiry(ctx context.Context, inquiryID, userID, guestID string) error {
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var owner, guest string
	err = tx.QueryRow(ctx, `SELECT COALESCE(user_id,''), COALESCE(guest_id,'') FROM inquiries WHERE id=$1 FOR UPDATE`, inquiryID).Scan(&owner, &guest)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if owner == userID {
		return nil
	}
	if owner != "" || (guest != "" && guest != guestID) {
		return ErrConflict
	}
	if _, err := tx.Exec(ctx, `UPDATE inquiries SET user_id=$2, updated_at=now() WHERE id=$1`, inquiryID, userID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (p *Postgres) AdminInquiries(ctx context.Context, status, industry, solution string) ([]Inquiry, error) {
	rows, err := p.pool.Query(ctx, `SELECT `+inquiryCols+` FROM inquiries
		WHERE ($1='' OR status=$1) AND ($2='' OR industry_slug=$2) AND ($3='' OR solution_slug=$3)
		ORDER BY created_at DESC LIMIT 200`, status, industry, solution)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectInquiries(rows)
}

func collectInquiries(rows pgx.Rows) ([]Inquiry, error) {
	out := []Inquiry{}
	for rows.Next() {
		inquiry, err := scanInquiry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, inquiry)
	}
	return out, rows.Err()
}

func (p *Postgres) UpdateInquiryStatus(ctx context.Context, id, status string) error {
	tag, err := p.pool.Exec(ctx, `UPDATE inquiries SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) AddNote(ctx context.Context, inquiryID, authorID, body string) (Note, error) {
	note := Note{ID: auth.NewID(), AuthorID: authorID, Body: body, CreatedAt: time.Now().UTC()}
	_, err := p.pool.Exec(ctx, `INSERT INTO inquiry_notes (id, inquiry_id, author_id, body, created_at) VALUES ($1,$2,$3,$4,$5)`,
		note.ID, inquiryID, authorID, body, note.CreatedAt)
	if err != nil {
		var pg *pgconn.PgError
		if errors.As(err, &pg) && pg.Code == "23503" {
			return Note{}, ErrNotFound
		}
		return Note{}, err
	}
	return note, nil
}

func (p *Postgres) Notes(ctx context.Context, inquiryID string) ([]Note, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, author_id, body, created_at FROM inquiry_notes WHERE inquiry_id=$1 ORDER BY created_at`, inquiryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Note{}
	for rows.Next() {
		var note Note
		if err := rows.Scan(&note.ID, &note.AuthorID, &note.Body, &note.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, note)
	}
	return out, rows.Err()
}

func (p *Postgres) RecordEvents(ctx context.Context, events []Event) error {
	for _, event := range events {
		meta, err := json.Marshal(event.Metadata)
		if err != nil {
			return err
		}
		var userID, guestID any
		if event.UserID != "" {
			userID = event.UserID
		}
		if event.GuestID != "" {
			guestID = event.GuestID
		}
		if _, err := p.pool.Exec(ctx, `INSERT INTO analytics_events (id, event_type, user_id, guest_id, metadata) VALUES ($1,$2,$3,$4,$5)`,
			auth.NewID(), event.Type, userID, guestID, meta); err != nil {
			return err
		}
	}
	return nil
}

func (p *Postgres) Analytics(ctx context.Context) (Analytics, error) {
	result := Analytics{Funnel: map[string]int{}, Industries: []Count{}, Solutions: []Count{}}
	if err := p.pool.QueryRow(ctx, `SELECT COUNT(*) FROM (
		SELECT DISTINCT COALESCE(NULLIF(user_id,''), NULLIF(guest_id,''), id) AS visitor
		FROM analytics_events WHERE event_type='page_view'
	) visitors`).Scan(&result.Visitors); err != nil {
		return result, err
	}
	rows, err := p.pool.Query(ctx, `SELECT event_type, COUNT(*) FROM analytics_events GROUP BY event_type`)
	if err != nil {
		return result, err
	}
	for rows.Next() {
		var name string
		var count int
		if err := rows.Scan(&name, &count); err != nil {
			rows.Close()
			return result, err
		}
		result.Funnel[name] = count
		if name == "demo_started" {
			result.DemoStarted = count
		}
	}
	rows.Close()
	result.Industries, err = p.grouped(ctx, "industry_selected", "industry")
	if err != nil {
		return result, err
	}
	result.Solutions, err = p.grouped(ctx, "solution_selected", "solution")
	return result, err
}

func (p *Postgres) grouped(ctx context.Context, eventType, key string) ([]Count, error) {
	rows, err := p.pool.Query(ctx, `SELECT metadata->>$2 AS name, COUNT(*) FROM analytics_events
		WHERE event_type=$1 AND COALESCE(metadata->>$2, '') <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 12`, eventType, key)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Count{}
	for rows.Next() {
		var item Count
		if err := rows.Scan(&item.Name, &item.Count); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (p *Postgres) LoadSettings(ctx context.Context) (Settings, error) {
	var raw []byte
	err := p.pool.QueryRow(ctx, `SELECT value FROM platform_settings WHERE key='showroom'`).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return DefaultSettings(), nil
	}
	if err != nil {
		return Settings{}, err
	}
	settings := DefaultSettings()
	if err := json.Unmarshal(raw, &settings); err != nil {
		return Settings{}, err
	}
	return settings, nil
}

func (p *Postgres) SaveSettings(ctx context.Context, settings Settings) error {
	if settings.Featured == nil {
		settings.Featured = []Pair{}
	}
	if settings.Hidden == nil {
		settings.Hidden = []string{}
	}
	if settings.Copy == nil {
		settings.Copy = map[string]Copy{}
	}
	raw, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	_, err = p.pool.Exec(ctx, `INSERT INTO platform_settings (key, value) VALUES ('showroom', $1)
		ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`, raw)
	return err
}

func (p *Postgres) AddAudit(ctx context.Context, actorID, action, target string) error {
	var actor any
	if actorID != "" {
		actor = actorID
	}
	_, err := p.pool.Exec(ctx, `INSERT INTO audit_logs (id, actor_id, action, target) VALUES ($1,$2,$3,$4)`, auth.NewID(), actor, action, target)
	return err
}
