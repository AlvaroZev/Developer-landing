package httpapi

import (
	"errors"
	"net/http"
	"time"

	"triunder/apps/api/internal/ai"
	"triunder/apps/api/internal/store"
)

var funnelOrder = []string{
	"page_view", "industry_selected", "solution_selected", "demo_started",
	"demo_interaction", "demo_completed", "inquiry_started", "inquiry_submitted", "account_registered",
}

func (s *Server) adminInquiries(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	rows, err := s.store.AdminInquiries(r.Context(), r.URL.Query().Get("status"), r.URL.Query().Get("industry"), r.URL.Query().Get("solution"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not load inquiries.", nil)
		return
	}
	out := []map[string]any{}
	for _, inquiry := range rows {
		notes, _ := s.store.Notes(r.Context(), inquiry.ID)
		if notes == nil {
			notes = []store.Note{}
		}
		out = append(out, map[string]any{
			"id": inquiry.ID, "industrySlug": inquiry.IndustrySlug, "solutionSlug": inquiry.SolutionSlug,
			"customIndustry": inquiry.CustomIndustry, "problem": inquiry.Problem, "desired": inquiry.Desired,
			"details": inquiry.Details, "name": inquiry.Name, "email": inquiry.Email, "company": inquiry.Company,
			"status": inquiry.Status, "createdAt": inquiry.CreatedAt, "updatedAt": inquiry.UpdatedAt, "notes": notes,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"inquiries": out})
}

func (s *Server) adminInquiryStatus(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if !decode(w, r, &body) {
		return
	}
	if _, known := inquiryStatuses[body.Status]; !known {
		writeError(w, http.StatusBadRequest, "invalid", "Unknown inquiry status.", nil)
		return
	}
	id := r.PathValue("id")
	if err := s.store.UpdateInquiryStatus(r.Context(), id, body.Status); err != nil {
		writeError(w, http.StatusNotFound, "not_found", "Inquiry not found.", nil)
		return
	}
	_ = s.store.AddAudit(r.Context(), admin.ID, "inquiry.status", id+":"+body.Status)
	writeJSON(w, http.StatusOK, map[string]string{"status": body.Status})
}

func (s *Server) adminNote(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}
	var body struct {
		Body string `json:"body"`
	}
	if !decode(w, r, &body) {
		return
	}
	if len(body.Body) == 0 || len(body.Body) > 4000 {
		writeError(w, http.StatusBadRequest, "invalid", "Write a note.", map[string]string{"body": "invalid"})
		return
	}
	note, err := s.store.AddNote(r.Context(), r.PathValue("id"), admin.ID, body.Body)
	if err != nil {
		writeError(w, http.StatusNotFound, "not_found", "Inquiry not found.", nil)
		return
	}
	_ = s.store.AddAudit(r.Context(), admin.ID, "inquiry.note", note.ID)
	writeJSON(w, http.StatusCreated, note)
}

func (s *Server) adminUsers(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	users, err := s.store.ListUsers(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not load users.", nil)
		return
	}
	out := []map[string]string{}
	for _, user := range users {
		out = append(out, map[string]string{"id": user.ID, "email": user.Email, "role": user.Role})
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": out})
}

func (s *Server) adminRole(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}
	var body struct {
		Role string `json:"role"`
	}
	if !decode(w, r, &body) {
		return
	}
	if body.Role != "user" && body.Role != "admin" {
		writeError(w, http.StatusBadRequest, "invalid", "Unknown role.", nil)
		return
	}
	id := r.PathValue("id")
	if id == admin.ID && body.Role != "admin" {
		writeError(w, http.StatusBadRequest, "invalid", "You cannot remove your own admin access.", nil)
		return
	}
	if err := s.store.SetRole(r.Context(), id, body.Role); err != nil {
		writeError(w, http.StatusNotFound, "not_found", "User not found.", nil)
		return
	}
	_ = s.store.AddAudit(r.Context(), admin.ID, "user.role", id+":"+body.Role)
	writeJSON(w, http.StatusOK, map[string]string{"role": body.Role})
}

func (s *Server) adminAnalytics(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	snapshot, err := s.store.Analytics(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not load analytics.", nil)
		return
	}
	registrations, err := s.store.CountUsers(r.Context(), "user")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not load analytics.", nil)
		return
	}
	inquiries, _ := s.store.AdminInquiries(r.Context(), "", "", "")
	funnel := []map[string]any{}
	for _, event := range funnelOrder {
		funnel = append(funnel, map[string]any{"event": event, "count": snapshot.Funnel[event]})
	}
	if snapshot.Industries == nil {
		snapshot.Industries = []store.Count{}
	}
	if snapshot.Solutions == nil {
		snapshot.Solutions = []store.Count{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"visitors": snapshot.Visitors, "registrations": registrations, "inquiries": len(inquiries),
		"conversion": conversion(snapshot.DemoStarted, len(inquiries)),
		"industries": snapshot.Industries, "solutions": snapshot.Solutions, "funnel": funnel,
	})
}

func conversion(demoStarted, inquiries int) float64 {
	if demoStarted <= 0 {
		return 0
	}
	value := float64(inquiries) / float64(demoStarted)
	return float64(int(value*1000+0.5)) / 1000
}

func (s *Server) adminOpenAI(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.describeAI(r.Context()))
}

func (s *Server) adminOpenAIHealth(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	err := s.ai.Health(ctx)
	category := ""
	s.aiMu.Lock()
	s.lastCheck = time.Now().UTC()
	if err != nil {
		s.aiFailed = true
		var upstream ai.UpstreamError
		if errors.As(err, &upstream) {
			category = upstream.Category
		} else {
			category = "connection_error"
		}
		s.lastErr = category
	} else {
		s.aiFailed = false
		s.lastErr = ""
	}
	s.aiMu.Unlock()
	_ = s.store.AddAudit(ctx, "", "ai.health", category)
	writeJSON(w, http.StatusOK, s.describeAI(ctx))
}

func (s *Server) adminSettings(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	settings, err := s.store.LoadSettings(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not load settings.", nil)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (s *Server) adminSaveSettings(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}
	current, err := s.store.LoadSettings(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not load settings.", nil)
		return
	}
	var patch struct {
		AIEnabled              *bool                  `json:"aiEnabled"`
		ProjectDescription     *bool                  `json:"projectDescription"`
		RequirementsAssistance *bool                  `json:"requirementsAssistance"`
		Featured               *[]store.Pair          `json:"featuredDemos"`
		Hidden                 *[]string              `json:"hiddenCaseStudies"`
		Copy                   *map[string]store.Copy `json:"copyOverrides"`
	}
	if !decode(w, r, &patch) {
		return
	}
	if patch.AIEnabled != nil {
		current.AIEnabled = *patch.AIEnabled
	}
	if patch.ProjectDescription != nil {
		current.ProjectDescription = *patch.ProjectDescription
	}
	if patch.RequirementsAssistance != nil {
		current.RequirementsAssistance = *patch.RequirementsAssistance
	}
	if patch.Featured != nil {
		for _, pair := range *patch.Featured {
			if !s.catalog.Compatible(pair.Industry, pair.Solution) {
				writeError(w, http.StatusBadRequest, "invalid", "Featured work must be a real demonstration.", nil)
				return
			}
		}
		current.Featured = *patch.Featured
	}
	if patch.Hidden != nil {
		current.Hidden = *patch.Hidden
	}
	if patch.Copy != nil {
		current.Copy = *patch.Copy
	}
	if err := s.store.SaveSettings(r.Context(), current); err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "Could not save settings.", nil)
		return
	}
	_ = s.store.AddAudit(r.Context(), admin.ID, "settings.update", "showroom")
	writeJSON(w, http.StatusOK, current)
}
