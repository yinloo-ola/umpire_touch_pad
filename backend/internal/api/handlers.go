package api

import (
	"encoding/json"
	"net/http"

	"umpire-backend/internal/service"
)

// maxRequestBodySize is 1 MB — more than enough for match data.
const maxRequestBodySize int64 = 1 << 20

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

	history := r.URL.Query().Get("history") == "true"
	sessionID := r.Header.Get("X-Session-ID")
	matches, err := h.svc.GetTodayMatches(r.Context(), sessionID, history)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(matches)
}

func (h *APIHandler) handleGetMatchState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Match ID required", http.StatusBadRequest)
		return
	}

	state, err := h.svc.GetMatchState(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(state)
}

func (h *APIHandler) handleCreateMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var match service.Match
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBodySize)).Decode(&match); err != nil {
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

func (h *APIHandler) handleSyncMatch(w http.ResponseWriter, r *http.Request) {
	// Standard library ServeMux since 1.22 handles method matching in registration,
	// but we'll check it here too for double safety if registered with HandleFunc.
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Match ID required", http.StatusBadRequest)
		return
	}

	var req service.SyncMatchRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBodySize)).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.MatchID = id // Ensure ID from path is used

	sessionID := r.Header.Get("X-Session-ID")

	if err := h.svc.SyncMatch(r.Context(), sessionID, req); err != nil {
		if err == service.ErrMatchLocked {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) handleReleaseMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Match ID required", http.StatusBadRequest)
		return
	}

	sessionID := r.Header.Get("X-Session-ID")
	if err := h.svc.ReleaseMatchLock(r.Context(), id, sessionID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) handleAdminUpdateMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Match ID required", http.StatusBadRequest)
		return
	}

	var req service.AdminMatchUpdateRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBodySize)).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.AdminUpdateMatch(r.Context(), id, req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) handleDeleteMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Match ID required", http.StatusBadRequest)
		return
	}

	if err := h.svc.DeleteMatch(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) handleBulkDeleteMatches(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBodySize)).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req.IDs) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err := h.svc.DeleteMatches(r.Context(), req.IDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// SetupRoutes registers the API routes to the given mux.
// Open routes: POST /api/login, POST /api/logout, GET /api/public/matches
// Auth-guarded: GET /api/matches (any auth), POST /api/match (admin only), PUT /api/matches/{id}/sync (any auth)
func SetupRoutes(mux *http.ServeMux, svc *service.MatchService, authSvc *service.AuthService) {
	handler := NewAPIHandler(svc, authSvc)

	// Open auth endpoints
	mux.HandleFunc("/api/login", handleLogin(authSvc))
	mux.HandleFunc("/api/logout", handleLogout())
	mux.HandleFunc("/api/me", handleMe(authSvc))

	// Public endpoints (no auth required)
	mux.HandleFunc("GET /api/public/matches", handler.handleGetPublicMatches)

	// Protected endpoints
	mux.HandleFunc("/api/matches", RequireAuth(authSvc, "", handler.handleGetMatches))
	mux.HandleFunc("GET /api/matches/{id}", RequireAuth(authSvc, "", handler.handleGetMatchState))
	mux.HandleFunc("/api/match", RequireAuth(authSvc, "admin", handler.handleCreateMatch))
	mux.HandleFunc("PUT /api/matches/{id}/sync", RequireAuth(authSvc, "", handler.handleSyncMatch))
	mux.HandleFunc("POST /api/matches/{id}/release", RequireAuth(authSvc, "", handler.handleReleaseMatch))
	mux.HandleFunc("PUT /api/admin/matches/{id}", RequireAuth(authSvc, "admin", handler.handleAdminUpdateMatch))
	mux.HandleFunc("DELETE /api/matches/{id}", RequireAuth(authSvc, "admin", handler.handleDeleteMatch))
	mux.HandleFunc("POST /api/matches/bulk-delete", RequireAuth(authSvc, "admin", handler.handleBulkDeleteMatches))
}
