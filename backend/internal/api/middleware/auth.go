package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/wavy-blog/backend/internal/api/handlers"
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

		username, ok := claims["username"].(string)
		if !ok {
			handlers.Unauthorized(c, "The authentication token has an invalid username.")
			c.Abort()
			return
		}

		// We fetch the user to ensure they still exist and have the correct role.
		user, err := repo.GetUserByUsername(c.Request.Context(), username)
		if err != nil || user == nil {
			handlers.Unauthorized(c, "The user associated with the token was not found.")
			c.Abort()
			return
		}

		c.Set("userID", user.UserID)
		c.Set("username", user.Username)
		c.Set("email", user.Email)
		c.Set("role", user.Role)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != "admin" {
			handlers.Forbidden(c, "You must be an administrator to perform this action.")
			c.Abort()
			return
		}
		c.Next()
	}
}