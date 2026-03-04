package api

import (
	"encoding/json"
	"net/http"

	"umpire-backend/internal/service"
)

type APIHandler struct {
	svc *service.MatchService
}

func NewAPIHandler(svc *service.MatchService) *APIHandler {
	return &APIHandler{svc: svc}
}

func (h *APIHandler) handleGetMatches(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	matches, err := h.svc.GetTodayUnstartedMatches(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(matches)
}

func (h *APIHandler) handleCreateMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var match service.Match
	if err := json.NewDecoder(r.Body).Decode(&match); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.svc.CreateMatch(r.Context(), match)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

// SetupRoutes registers the API routes to the given mux
func SetupRoutes(mux *http.ServeMux, svc *service.MatchService) {
	handler := NewAPIHandler(svc)
	mux.HandleFunc("/api/matches", handler.handleGetMatches)
	mux.HandleFunc("/api/match", handler.handleCreateMatch)
}
