package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/wavy-blog/backend/internal/api/handlers"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
)

func AuthMiddleware(repo repository.UserRepository, secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			handlers.Unauthorized(c, "Authorization header is missing.")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			handlers.Unauthorized(c, "Authorization token must be a Bearer token.")
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			handlers.Unauthorized(c, "The provided authentication token is invalid or has expired.")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			handlers.Unauthorized(c, "The authentication token contains invalid claims.")
			c.Abort()
			return
		}

		userID, ok := claims["userID"].(string)
		if !ok {
			handlers.Unauthorized(c, "The authentication token has an invalid user ID.")
			c.Abort()
			return
		}

		user, err := repo.GetUserByID(c.Request.Context(), userID)
		if err != nil {
			handlers.Unauthorized(c, "The user associated with the token was not found.")
			c.Abort()
			return
		}

		c.Set("userID", strings.TrimPrefix(user.UserID, "USER#"))
		c.Set("userRole", user.Role)
		c.Set("user", user)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			handlers.Unauthorized(c, "User information not found in context. Please log in.")
			c.Abort()
			return
		}

		domainUser, ok := user.(*domain.User)
		if !ok {
			handlers.InternalServerError(c, "Invalid user type in context.")
			c.Abort()
			return
		}

		if domainUser.Role != "admin" {
			handlers.Forbidden(c, "You must be an administrator to perform this action.")
			c.Abort()
			return
		}

		c.Next()
	}
}