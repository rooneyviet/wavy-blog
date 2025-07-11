package utils

import (
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/domain"
)

// GenerateAccessToken generates a JWT access token for a user
func GenerateAccessToken(user *domain.User, cfg *config.Config) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID":   user.UserID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(cfg.JWTAccessTokenExpiration).Unix(),
	})

	return token.SignedString([]byte(cfg.JWTSecret))
}

// GenerateRefreshToken generates a secure random refresh token
func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// GetRefreshTokenExpiration returns the expiration time for refresh tokens
func GetRefreshTokenExpiration(cfg *config.Config) time.Time {
	return time.Now().Add(cfg.JWTRefreshTokenExpiration)
}