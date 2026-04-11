package api

import (
	"net/http"
	"strings"

	"umpire-backend/internal/service"
)

func extractToken(r *http.Request) string {
	if header := r.Header.Get("Authorization"); header != "" {
		if strings.HasPrefix(header, "Bearer ") {
			return strings.TrimPrefix(header, "Bearer ")
		}
		return header
	}
	if cookie, err := r.Cookie("jwt"); err == nil {
		return cookie.Value
	}
	return ""
}

// RequireAuth wraps an http.HandlerFunc and enforces JWT authentication.
// If requiredRole is non-empty, it also checks that the token's role matches.
func RequireAuth(authSvc *service.AuthService, requiredRole string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := extractToken(r)
		if tokenStr == "" {
			http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
			return
		}

		claims, err := authSvc.ValidateToken(tokenStr)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		if requiredRole != "" {
			role, ok := claims["role"].(string)
			if !ok || role != requiredRole {
				http.Error(w, "Forbidden: insufficient permissions", http.StatusForbidden)
				return
			}
		}

		next(w, r)
	}
}
