package api

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

// StaticFS will be injected from main.go
var StaticFS embed.FS

func RegisterStaticRoutes(mux *http.ServeMux) {
	// Sub-folder "dist" from the embedded FS
	subFS, err := fs.Sub(StaticFS, "dist")
	if err != nil {
		// If dist is missing, we might be in dev mode without embed
		return
	}

	server := http.FileServer(http.FS(subFS))

	// Catch-all for SPA routing (send to index.html if file doesn't exist)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Check if it's an API route - if so, let it fall through (it shouldn't get here though)
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Try to serve the file
		f, err := subFS.Open(strings.TrimPrefix(r.URL.Path, "/"))
		if err == nil {
			f.Close()
			server.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html for SPA
		r.URL.Path = "/"
		server.ServeHTTP(w, r)
	})
}
