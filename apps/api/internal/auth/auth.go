// Package auth owns password hashing and session-token derivation.
// The raw token is what the cookie carries. The database stores only
// sha256(secret + token), so a copied database cannot be replayed as a session
// and the secret never has to be a password itself.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string, cost int) (string, error) {
	if cost < bcrypt.MinCost {
		cost = bcrypt.DefaultCost
	}
	sum, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(sum), nil
}

func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// ValidPassword is the same policy as packages/contracts passwordSchema:
// 10 to 200 characters, with at least one letter and one digit.
func ValidPassword(password string) bool {
	if len(password) < 10 || len(password) > 200 {
		return false
	}
	letter, digit := false, false
	for _, r := range password {
		if unicode.IsLetter(r) {
			letter = true
		}
		if unicode.IsDigit(r) {
			digit = true
		}
	}
	return letter && digit
}

func ValidEmail(email string) bool {
	if len(email) < 6 || len(email) > 180 {
		return false
	}
	at := -1
	for i, r := range email {
		if r == ' ' || r == '\t' {
			return false
		}
		if r == '@' {
			at = i
		}
	}
	if at <= 0 || at >= len(email)-1 {
		return false
	}
	domain := email[at+1:]
	dot := false
	for _, r := range domain {
		if r == '.' {
			dot = true
		}
	}
	return dot
}

func NewID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic("crypto/rand unavailable")
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// NewToken returns the cookie value and the hash that may be stored.
func NewToken(secret string) (raw, hash string) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic("crypto/rand unavailable")
	}
	raw = hex.EncodeToString(b[:])
	return raw, HashToken(secret, raw)
}

func HashToken(secret, raw string) string {
	sum := sha256.Sum256([]byte(secret + "\x00" + raw))
	return hex.EncodeToString(sum[:])
}
