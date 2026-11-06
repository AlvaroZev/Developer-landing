package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Provider abstracts AI backends so Triunder is not tightly coupled to OpenAI.
// Keep this interface minimal — do not invent multi-provider infrastructure yet.
type Provider interface {
	Name() string
	Configured() bool
	Status() Status
	HealthCheck(ctx context.Context) error
	GenerateRequirements(ctx context.Context, input RequirementsInput) (*RequirementsDocument, error)
}

type Status string

const (
	StatusConfigured        Status = "configured"
	StatusMissingCredentials Status = "missing_credentials"
	StatusConnectionError   Status = "connection_error"
	StatusDisabled          Status = "disabled"
)

type RequirementsInput struct {
	Industry           string            `json:"industry"`
	Solution           string            `json:"solution"`
	Complexity         string            `json:"complexity"`
	Modules            []string          `json:"modules"`
	BusinessDescription string           `json:"businessDescription"`
	Locale             string            `json:"locale"`
	Extra              map[string]string `json:"extra,omitempty"`
}

type RequirementsDocument struct {
	BusinessContext         string   `json:"businessContext"`
	ProblemStatement        string   `json:"problemStatement"`
	Objectives              []string `json:"objectives"`
	ProposedSolution        string   `json:"proposedSolution"`
	SelectedModules         []string `json:"selectedModules"`
	FunctionalRequirements  []string `json:"functionalRequirements"`
	NonFunctionalRequirements []string `json:"nonFunctionalRequirements"`
	UserRoles               []string `json:"userRoles"`
	MainWorkflows           []string `json:"mainWorkflows"`
	DataEntities            []string `json:"dataEntities"`
	RequiredIntegrations    []string `json:"requiredIntegrations"`
	HardwareRequirements    []string `json:"hardwareRequirements"`
	TechnicalConsiderations []string `json:"technicalConsiderations"`
	Assumptions             []string `json:"assumptions"`
	OpenQuestions           []string `json:"openQuestions"`
	RecommendedNextSteps    []string `json:"recommendedNextSteps"`
	GeneratedBy             string   `json:"generatedBy"`
}

type OpenAIProvider struct {
	apiKey     string
	model      string
	httpClient *http.Client
	lastError  string
	lastOKAt   *time.Time
}

func NewOpenAIProvider(apiKey, model string) *OpenAIProvider {
	if model == "" {
		model = "gpt-4o-mini"
	}
	return &OpenAIProvider{
		apiKey: strings.TrimSpace(apiKey),
		model:  model,
		httpClient: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

func (p *OpenAIProvider) Name() string { return "openai" }

func (p *OpenAIProvider) Configured() bool { return p.apiKey != "" }

func (p *OpenAIProvider) Status() Status {
	if !p.Configured() {
		return StatusMissingCredentials
	}
	if p.lastError != "" && p.lastOKAt == nil {
		return StatusConnectionError
	}
	return StatusConfigured
}

func (p *OpenAIProvider) Model() string { return p.model }

func (p *OpenAIProvider) LastErrorCategory() string {
	// Never return raw provider payloads that might contain secrets.
	return p.lastError
}

func (p *OpenAIProvider) LastSuccessfulHealthCheck() *time.Time {
	return p.lastOKAt
}

func (p *OpenAIProvider) HealthCheck(ctx context.Context) error {
	if !p.Configured() {
		return errors.New("OPENAI_API_KEY is not configured")
	}
	// Lightweight models list call — validates credentials without generating content.
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.openai.com/v1/models", nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	res, err := p.httpClient.Do(req)
	if err != nil {
		p.lastError = "connection_error"
		return err
	}
	defer res.Body.Close()
	io.Copy(io.Discard, res.Body)
	if res.StatusCode >= 400 {
		p.lastError = "auth_or_provider_error"
		return fmt.Errorf("openai health check failed with status %d", res.StatusCode)
	}
	now := time.Now().UTC()
	p.lastOKAt = &now
	p.lastError = ""
	return nil
}

func (p *OpenAIProvider) GenerateRequirements(ctx context.Context, input RequirementsInput) (*RequirementsDocument, error) {
	if !p.Configured() {
		return nil, errors.New("OPENAI_API_KEY is not configured")
	}

	system := `You are Triunder's requirements assistant. Produce a preliminary requirements document as JSON with keys:
businessContext, problemStatement, objectives, proposedSolution, selectedModules, functionalRequirements,
nonFunctionalRequirements, userRoles, mainWorkflows, dataEntities, requiredIntegrations, hardwareRequirements,
technicalConsiderations, assumptions, openQuestions, recommendedNextSteps.
Never invent pricing, delivery dates, or contractual commitments. Mark content as preliminary.`

	userPayload, _ := json.Marshal(input)
	body := map[string]any{
		"model": p.model,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": string(userPayload)},
		},
		"response_format": map[string]string{"type": "json_object"},
		"temperature":     0.2,
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := p.httpClient.Do(req)
	if err != nil {
		p.lastError = "connection_error"
		return nil, err
	}
	defer res.Body.Close()
	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		p.lastError = "provider_error"
		// Do not echo response body — may contain sensitive details.
		return nil, fmt.Errorf("openai request failed with status %d", res.StatusCode)
	}

	var completion struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &completion); err != nil {
		return nil, err
	}
	if len(completion.Choices) == 0 {
		return nil, errors.New("empty openai response")
	}

	var doc RequirementsDocument
	if err := json.Unmarshal([]byte(completion.Choices[0].Message.Content), &doc); err != nil {
		return nil, fmt.Errorf("invalid structured output: %w", err)
	}
	doc.GeneratedBy = "openai"
	doc.SelectedModules = input.Modules
	now := time.Now().UTC()
	p.lastOKAt = &now
	p.lastError = ""
	return &doc, nil
}

// TemplateFallback generates a clearly non-AI requirements draft.
// Never label this as AI-generated.
func TemplateFallback(input RequirementsInput) RequirementsDocument {
	return RequirementsDocument{
		BusinessContext:  fmt.Sprintf("Preliminary context for %s / %s", input.Industry, input.Solution),
		ProblemStatement: input.BusinessDescription,
		Objectives:       []string{"Clarify operational needs", "Validate solution fit", "Prepare consultation"},
		ProposedSolution: fmt.Sprintf("%s configured at %s complexity", input.Solution, input.Complexity),
		SelectedModules:  input.Modules,
		FunctionalRequirements: []string{
			"Core CRUD workflows for primary entities",
			"Role-appropriate dashboards and navigation",
		},
		NonFunctionalRequirements: []string{"Responsive web access", "Auditable demo configuration"},
		UserRoles:                 []string{"Operator", "Manager"},
		MainWorkflows:             []string{"Explore", "Configure", "Review requirements"},
		DataEntities:              []string{"Primary entity", "Secondary entity"},
		RequiredIntegrations:      []string{},
		HardwareRequirements:      []string{},
		TechnicalConsiderations:   []string{"This draft is template-generated, not AI-generated."},
		Assumptions:               []string{"Scope remains preliminary until reviewed."},
		OpenQuestions:             []string{"Which modules are mandatory for launch?"},
		RecommendedNextSteps:      []string{"Review this draft", "Submit a project inquiry"},
		GeneratedBy:               "template",
	}
}
