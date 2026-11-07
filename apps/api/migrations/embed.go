// Package migrations embeds SQL files into the API binary so production
// containers do not depend on a working-directory-relative MIGRATIONS_PATH.
package migrations

import "embed"

//go:embed *.sql
var Files embed.FS
