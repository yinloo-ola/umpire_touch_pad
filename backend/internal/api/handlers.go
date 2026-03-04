package api

import (
	"encoding/json"
	"net/http"

	"umpire-backend/internal/service"
)

type APIHandler struct {
	svc     *service.MatchService
	authSvc *service.AuthService
}

func NewAPIHandler(svc *service.MatchService, authSvc *service.AuthService) *APIHandler {
	return &APIHandler{svc: svc, authSvc: authSvc}
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

// SetupRoutes registers the API routes to the given mux.
// Open routes: POST /api/login, POST /api/logout
// Auth-guarded: GET /api/matches (any auth), POST /api/match (admin only)
func SetupRoutes(mux *http.ServeMux, svc *service.MatchService, authSvc *service.AuthService) {
	handler := NewAPIHandler(svc, authSvc)

	// Open auth endpoints
	mux.HandleFunc("/api/login", handleLogin(authSvc))
	mux.HandleFunc("/api/logout", handleLogout())
	mux.HandleFunc("/api/me", handleMe(authSvc))

	// Protected endpoints
	mux.HandleFunc("/api/matches", RequireAuth(authSvc, "", handler.handleGetMatches))
	mux.HandleFunc("/api/match", RequireAuth(authSvc, "admin", handler.handleCreateMatch))
}
