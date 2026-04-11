package api

import (
	"encoding/json"
	"net/http"
)

// handleGetPublicMatches returns all matches grouped by status (completed, scheduled, live)
// This endpoint is public - no authentication required
func (h *APIHandler) handleGetPublicMatches(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response, err := h.svc.GetPublicMatches(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
