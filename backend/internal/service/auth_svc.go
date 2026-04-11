package service

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// AuthService validates credentials and issues JWTs.
type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

// jwtSecret returns the signing key from env, with a fallback for local dev.
func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-me-in-production"
	}
	return []byte(secret)
}

// ValidateCredentials checks username/password against env vars.
// Returns the role ("admin" or "umpire") or an error.
func (a *AuthService) ValidateCredentials(username, password string) (string, error) {
	adminUser := envOrDefault("ADMIN_USERNAME", "admin")
	adminPass := envOrDefault("ADMIN_PASSWORD", "admin123")
	umpireUser := envOrDefault("UMPIRE_USERNAME", "umpire")
	umpirePass := envOrDefault("UMPIRE_PASSWORD", "umpire123")

	if username == adminUser && password == adminPass {
		return "admin", nil
	}
	if username == umpireUser && password == umpirePass {
		return "umpire", nil
	}
	return "", errors.New("invalid credentials")
}

// GenerateToken creates a signed JWT for the given role.
func (a *AuthService) GenerateToken(role string) (string, error) {
	claims := jwt.MapClaims{
		"role": role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

// ValidateToken parses and validates a JWT string, returning its claims.
func (a *AuthService) ValidateToken(tokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	return claims, nil
}
