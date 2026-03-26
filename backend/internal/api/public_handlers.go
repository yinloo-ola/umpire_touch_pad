package api

import (
	"encoding/json"
	"log"
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
		log.Printf("[handleGetPublicMatches] Error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("[handleGetPublicMatches] GET /api/public/matches - completed=%d, scheduled=%d, live=%d",
		len(response.Completed), len(response.Scheduled), len(response.Live))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response)
}
