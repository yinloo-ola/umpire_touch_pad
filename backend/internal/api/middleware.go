package api

import (
	"net/http"
	"umpire-backend/internal/service"
)

// RequireAuth wraps an http.HandlerFunc and enforces JWT authentication.
// If requiredRole is non-empty, it also checks that the token's role matches.
func RequireAuth(authSvc *service.AuthService, requiredRole string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("jwt")
		if err != nil {
			http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
			return
		}

		claims, err := authSvc.ValidateToken(cookie.Value)
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
