// Package ai is the only place that talks to a model provider.
// The API key is a field on the provider. Callers pass prompts and receive text.
// They never receive the key, and this package does not log request headers.
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

const DefaultModel = "gpt-4o-mini"

// UpstreamError carries a category safe to show an administrator.
// The category is a short token such as "timeout" or "unauthorized", never a body or a key.
type UpstreamError struct {
	Category string
}

func (e UpstreamError) Error() string { return e.Category }

type Provider interface {
	Configured() bool
	Complete(ctx context.Context, model, system, user string) (string, error)
	Health(ctx context.Context) error
}

type OpenAI struct {
	key    string
	base   string
	client *http.Client
}

func NewOpenAI(key, baseURL string) *OpenAI {
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	return &OpenAI{
		key:  strings.TrimSpace(key),
		base: strings.TrimRight(baseURL, "/"),
		client: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (o *OpenAI) Configured() bool { return o.key != "" }

func (o *OpenAI) Health(ctx context.Context) error {
	if !o.Configured() {
		return UpstreamError{Category: "missing_credentials"}
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, o.base+"/models", nil)
	if err != nil {
		return UpstreamError{Category: "request"}
	}
	req.Header.Set("Authorization", "Bearer "+o.key)
	res, err := o.client.Do(req)
	if err != nil {
		return categoryFrom(err)
	}
	defer res.Body.Close()
	_, _ = io.Copy(io.Discard, res.Body)
	if res.StatusCode == http.StatusOK {
		return nil
	}
	return UpstreamError{Category: statusCategory(res.StatusCode)}
}

func (o *OpenAI) Complete(ctx context.Context, model, system, user string) (string, error) {
	if !o.Configured() {
		return "", UpstreamError{Category: "missing_credentials"}
	}
	if model == "" {
		model = DefaultModel
	}
	payload := map[string]any{
		"model":           model,
		"temperature":     0.2,
		"response_format": map[string]string{"type": "json_object"},
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": user},
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, o.base+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", UpstreamError{Category: "request"}
	}
	req.Header.Set("Authorization", "Bearer "+o.key)
	req.Header.Set("Content-Type", "application/json")
	res, err := o.client.Do(req)
	if err != nil {
		return "", categoryFrom(err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if res.StatusCode != http.StatusOK {
		return "", UpstreamError{Category: statusCategory(res.StatusCode)}
	}
	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil || len(parsed.Choices) == 0 {
		return "", UpstreamError{Category: "invalid_response"}
	}
	return parsed.Choices[0].Message.Content, nil
}

func categoryFrom(err error) error {
	if errors.Is(err, context.DeadlineExceeded) {
		return UpstreamError{Category: "timeout"}
	}
	var net interface{ Timeout() bool }
	if errors.As(err, &net) && net.Timeout() {
		return UpstreamError{Category: "timeout"}
	}
	return UpstreamError{Category: "unreachable"}
}

func statusCategory(code int) string {
	switch code {
	case http.StatusUnauthorized, http.StatusForbidden:
		return "unauthorized"
	case http.StatusTooManyRequests:
		return "rate_limited"
	default:
		return fmt.Sprintf("upstream_%d", code)
	}
}
