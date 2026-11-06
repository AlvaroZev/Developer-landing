package ai

import (
	"testing"
)

func TestOpenAIProviderMissingKey(t *testing.T) {
	p := NewOpenAIProvider("", "gpt-4o-mini")
	if p.Configured() {
		t.Fatal("expected unconfigured provider")
	}
	if p.Status() != StatusMissingCredentials {
		t.Fatalf("status=%s", p.Status())
	}
}

func TestTemplateFallbackNeverClaimsAI(t *testing.T) {
	doc := TemplateFallback(RequirementsInput{
		Industry:            "healthcare",
		Solution:            "crm",
		Complexity:          "professional",
		BusinessDescription: "Need patient scheduling",
		Modules:             []string{"appointments"},
	})
	if doc.GeneratedBy != "template" {
		t.Fatalf("generatedBy=%s", doc.GeneratedBy)
	}
	if len(doc.TechnicalConsiderations) == 0 {
		t.Fatal("expected technical considerations noting template mode")
	}
}
