//go:build integration

package store

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestPostgresMigrationAndGuestAttach(t *testing.T) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL is not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	db, err := OpenPostgres(ctx, url, "database/migrations")
	if err != nil {
		// The test is started from the module root. Retry the repo-relative path
		// used by `go test` from the repository root.
		db, err = OpenPostgres(ctx, url, "../../../../database/migrations")
	}
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)

	email := "integration-" + time.Now().UTC().Format("20060102150405.000") + "@example.com"
	user, err := db.CreateUser(ctx, email, "hash", "user", false)
	if err != nil {
		t.Fatal(err)
	}
	guest, err := db.CreateGuest(ctx, "token-"+user.ID)
	if err != nil {
		t.Fatal(err)
	}
	inquiry, err := db.CreateInquiry(ctx, Inquiry{
		GuestID: guest.ID, IndustrySlug: "healthcare", SolutionSlug: "scheduling",
		Problem: "Integration coverage for a guest inquiry.", Name: "Test", Email: email,
	})
	if err != nil {
		t.Fatal(err)
	}
	result, err := db.MigrateGuest(ctx, guest.ID, user.ID)
	if err != nil || result != "attach" {
		t.Fatalf("migrate %s %v", result, err)
	}
	rows, err := db.ListInquiries(ctx, user.ID)
	if err != nil || len(rows) == 0 || rows[0].ID != inquiry.ID {
		t.Fatalf("inquiry not attached: %+v %v", rows, err)
	}
	other, err := db.CreateUser(ctx, "other-"+email, "hash", "user", false)
	if err != nil {
		t.Fatal(err)
	}
	result, err = db.MigrateGuest(ctx, guest.ID, other.ID)
	if err != nil || result != "conflict" {
		t.Fatalf("conflict %s %v", result, err)
	}
	still, err := db.ListInquiries(ctx, user.ID)
	if err != nil || len(still) != 1 {
		t.Fatalf("conflict moved data: %+v %v", still, err)
	}
}
