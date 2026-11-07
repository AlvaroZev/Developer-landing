// Package catalog is the Go copy of the industry/solution matrix.
// The TypeScript registries remain the source of truth. scripts/export-catalog.mjs
// writes catalog.json, and a Vitest assertion fails if the two diverge.
// Handlers use this file to reject an industry or solution the selectors cannot offer.
package catalog

import (
	_ "embed"
	"encoding/json"
	"fmt"
)

//go:embed catalog.json
var raw []byte

type Pair struct {
	Industry string `json:"industry"`
	Solution string `json:"solution"`
}

type Catalog struct {
	Industries    []string            `json:"industries"`
	Solutions     []string            `json:"solutions"`
	Compatibility map[string][]string `json:"compatibility"`
	Featured      []Pair              `json:"featured"`
}

func Load() (*Catalog, error) {
	var catalog Catalog
	if err := json.Unmarshal(raw, &catalog); err != nil {
		return nil, fmt.Errorf("catalog: %w", err)
	}
	if len(catalog.Industries) == 0 || len(catalog.Solutions) == 0 {
		return nil, fmt.Errorf("catalog is empty")
	}
	return &catalog, nil
}

func (c *Catalog) HasIndustry(slug string) bool {
	for _, item := range c.Industries {
		if item == slug {
			return true
		}
	}
	return false
}

func (c *Catalog) Compatible(industry, solution string) bool {
	for _, item := range c.Compatibility[industry] {
		if item == solution {
			return true
		}
	}
	return false
}
