package httpapi

import (
	"strings"
	"unicode/utf8"

	"triunder/apps/api/internal/auth"
	"triunder/apps/api/internal/catalog"
)

// Field limits mirror packages/contracts. If a limit changes there, change it here.
func field(fields map[string]string, key, message string) {
	if _, exists := fields[key]; !exists {
		fields[key] = message
	}
}

func clip(value string, max int) (string, bool) {
	value = strings.TrimSpace(value)
	if utf8.RuneCountInString(value) > max {
		return value, false
	}
	return value, true
}

type inquiryInput struct {
	IndustrySlug   string
	SolutionSlug   string
	CustomIndustry string
	Problem        string
	Desired        string
	Details        string
	Name           string
	Email          string
	Company        string
}

func validateInquiry(body map[string]string, cat *catalog.Catalog) (inquiryInput, map[string]string) {
	fields := map[string]string{}
	out := inquiryInput{}
	var ok bool
	out.IndustrySlug, ok = clip(body["industrySlug"], 80)
	if !ok || out.IndustrySlug == "" {
		field(fields, "industrySlug", "invalid")
	} else if !cat.HasIndustry(out.IndustrySlug) {
		field(fields, "industrySlug", "unknown_industry")
	}
	out.SolutionSlug, ok = clip(body["solutionSlug"], 80)
	if !ok {
		field(fields, "solutionSlug", "invalid")
	}
	out.CustomIndustry, ok = clip(body["customIndustry"], 160)
	if !ok {
		field(fields, "customIndustry", "invalid")
	}
	out.Problem, ok = clip(body["problem"], 4000)
	if !ok || utf8.RuneCountInString(out.Problem) < 20 {
		field(fields, "problem", "invalid")
	}
	out.Desired, ok = clip(body["desired"], 4000)
	if !ok {
		field(fields, "desired", "invalid")
	}
	out.Details, ok = clip(body["details"], 4000)
	if !ok {
		field(fields, "details", "invalid")
	}
	out.Name, ok = clip(body["name"], 120)
	if !ok || utf8.RuneCountInString(out.Name) < 2 {
		field(fields, "name", "invalid")
	}
	out.Email, ok = clip(body["email"], 180)
	if !ok || !auth.ValidEmail(out.Email) {
		field(fields, "email", "invalid")
	}
	out.Company, ok = clip(body["company"], 160)
	if !ok {
		field(fields, "company", "invalid")
	}
	if fields["industrySlug"] == "" {
		if out.IndustrySlug == "custom" {
			if out.CustomIndustry == "" {
				field(fields, "customIndustry", "required")
			}
		} else if out.SolutionSlug == "" || !cat.Compatible(out.IndustrySlug, out.SolutionSlug) {
			field(fields, "solutionSlug", "incompatible_solution")
		}
	}
	return out, fields
}

var analyticsEvents = map[string]struct{}{
	"page_view": {}, "industry_selected": {}, "solution_selected": {}, "demo_started": {},
	"demo_interaction": {}, "demo_completed": {}, "inquiry_started": {}, "inquiry_submitted": {},
	"account_registered": {},
}

var metadataKeys = []string{"industry", "solution", "path", "demoId", "status"}

var inquiryStatuses = map[string]struct{}{
	"draft": {}, "submitted": {}, "in_discussion": {}, "completed": {}, "archived": {},
}
