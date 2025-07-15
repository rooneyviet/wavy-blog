package handlers

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
	"github.com/wavy-blog/backend/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	repo     repository.UserRepository
	postRepo repository.PostRepository
	cfg      *config.Config
}

// UserResponse defines the structure for user data returned to the client.
type UserResponse struct {
	UserID    string    `json:"userID"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// toUserResponse converts a domain.User to a UserResponse.
func toUserResponse(user *domain.User) UserResponse {
	return UserResponse{
		UserID:    user.UserID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}

// toUserListResponse converts a slice of domain.User to a slice of UserResponse.
func toUserListResponse(users []*domain.User) []UserResponse {
	res := make([]UserResponse, len(users))
	for i, u := range users {
		res[i] = toUserResponse(u)
	}
	return res
}


func NewUserHandler(repo repository.UserRepository, postRepo repository.PostRepository, cfg *config.Config) *UserHandler {
	return &UserHandler{repo: repo, postRepo: postRepo, cfg: cfg}
}

type RegisterUserInput struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *UserHandler) Register(c *gin.Context) {
	var input RegisterUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[ERROR] Failed to hash password for user '%s': %v", input.Username, err)
		InternalServerError(c, "Failed to secure password.")
		return
	}

	user := &domain.User{
		UserID:       uuid.New().String(),
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Role:         "author", // Default role
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreateUser(c.Request.Context(), user); err != nil {
		if strings.Contains(err.Error(), "username or email already exists") {
			log.Printf("[ERROR] User creation failed - username or email already exists: %s, %s", input.Username, input.Email)
			Conflict(c, "A user with this username or email already exists.")
			return
		}
		log.Printf("[ERROR] Failed to create user '%s': %v", input.Username, err)
		InternalServerError(c, "Failed to create user account: "+err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User account created successfully."})
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *UserHandler) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	log.Printf("[LOGIN] Attempting login for email: %s", input.Email)

	user, err := h.repo.GetUserByEmail(c.Request.Context(), input.Email)
	if err != nil || user == nil {
		log.Printf("[LOGIN] User not found for email: %s", input.Email)
		Unauthorized(c, "The email address or password you entered is incorrect.")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		log.Printf("[LOGIN] Password mismatch for user: %s", user.Username)
		Unauthorized(c, "The email address or password you entered is incorrect.")
		return
	}

	// Generate access token
	accessToken, err := utils.GenerateAccessToken(user, h.cfg)
	if err != nil {
		log.Printf("[LOGIN] Failed to generate access token for user: %s, error: %v", user.Username, err)
		InternalServerError(c, "Could not generate authentication token.")
		return
	}

	// Generate refresh token
	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		log.Printf("[LOGIN] Failed to generate refresh token for user: %s, error: %v", user.Username, err)
		InternalServerError(c, "Could not generate refresh token.")
		return
	}

	// Store refresh token in database
	refreshTokenExpiration := utils.GetRefreshTokenExpiration(h.cfg)
	if err := h.repo.UpdateUserRefreshToken(c.Request.Context(), user.Username, refreshToken, refreshTokenExpiration); err != nil {
		log.Printf("[LOGIN] Failed to store refresh token for user: %s, error: %v", user.Username, err)
		InternalServerError(c, "Could not store refresh token.")
		return
	}

	// Set refresh token as HTTP-only cookie
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", refreshToken, int(h.cfg.JWTRefreshTokenExpiration.Seconds()), "/", "", false, true)

	log.Printf("[LOGIN] Successfully logged in user: %s, refresh token expires at: %v", user.Username, refreshTokenExpiration)
	log.Printf("[LOGIN] Setting refresh_token cookie with value: %s", refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user": toUserResponse(user),
	})
}

func (h *UserHandler) Refresh(c *gin.Context) {
	log.Printf("[REFRESH] Starting refresh token validation")
	
	// Log all cookies received
	allCookies := c.Request.Header.Get("Cookie")
	log.Printf("[REFRESH] All cookies received: %s", allCookies)
	
	// Get refresh token from HTTP-only cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		log.Printf("[REFRESH] Refresh token not found in cookies, error: %v", err)
		log.Printf("[REFRESH] Available cookies: %v", c.Request.Cookies())
		Unauthorized(c, "Refresh token not found.")
		return
	}
	
	log.Printf("[REFRESH] Raw refresh token from cookie: %s (first 10 chars)", refreshToken[:min(10, len(refreshToken))])
	
	// URL decode the refresh token to handle any encoding issues
	decodedRefreshToken, err := url.QueryUnescape(refreshToken)
	if err != nil {
		log.Printf("[REFRESH] Failed to URL decode refresh token: %v", err)
		Unauthorized(c, "Invalid refresh token format.")
		return
	}
	refreshToken = decodedRefreshToken
	log.Printf("[REFRESH] Decoded refresh token: %s (first 10 chars)", refreshToken[:min(10, len(refreshToken))])

	// Find user by refresh token
	user, err := h.repo.GetUserByRefreshToken(c.Request.Context(), refreshToken)
	if err != nil || user == nil {
		log.Printf("[REFRESH] User not found for refresh token, error: %v", err)
		if user == nil {
			log.Printf("[REFRESH] User is nil - refresh token not found in database")
		}
		Unauthorized(c, "Invalid refresh token.")
		return
	}

	log.Printf("[REFRESH] Found user: %s, token expires at: %v", user.Username, user.RefreshTokenExpiresAt)

	// Check if refresh token has expired
	if time.Now().After(user.RefreshTokenExpiresAt) {
		log.Printf("[REFRESH] Refresh token has expired for user: %s, expired at: %v, current time: %v", 
			user.Username, user.RefreshTokenExpiresAt, time.Now())
		Unauthorized(c, "Refresh token has expired.")
		return
	}

	// Generate new access token
	newAccessToken, err := utils.GenerateAccessToken(user, h.cfg)
	if err != nil {
		log.Printf("[REFRESH] Failed to generate new access token for user: %s, error: %v", user.Username, err)
		InternalServerError(c, "Could not generate new access token.")
		return
	}

	// Optionally rotate refresh token for enhanced security
	newRefreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		InternalServerError(c, "Could not generate new refresh token.")
		return
	}
	log.Printf("[REFRESH] newRefreshToken value: %s", newRefreshToken)

	// Update refresh token in database
	refreshTokenExpiration := utils.GetRefreshTokenExpiration(h.cfg)
	if err := h.repo.UpdateUserRefreshToken(c.Request.Context(), user.Username, newRefreshToken, refreshTokenExpiration); err != nil {
		InternalServerError(c, "Could not update refresh token.")
		return
	}

	// Set new refresh token as HTTP-only cookie
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", newRefreshToken, int(h.cfg.JWTRefreshTokenExpiration.Seconds()), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
		"user": toUserResponse(user),
	})
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

type UpdateUserInput struct {
	Username string `json:"username"`
	Email    string `json:"email" binding:"email"`
	Role     string `json:"role"`
}

func (h *UserHandler) GetUser(c *gin.Context) {
	username := c.Param("username")
	user, err := h.repo.GetUserByUsername(c.Request.Context(), username)
	if err != nil || user == nil {
		log.Printf("[ERROR] Failed to get user by username '%s': %v", username, err)
		NotFound(c, "User")
		return
	}
	c.JSON(http.StatusOK, toUserResponse(user))
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.repo.GetAllUsers(c.Request.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to retrieve all users: %v", err)
		InternalServerError(c, "Failed to retrieve users.")
		return
	}
	c.JSON(http.StatusOK, toUserListResponse(users))
}


func (h *UserHandler) UpdateUser(c *gin.Context) {
	username := c.Param("username")
	var input UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	// Auth check
	requestingUser := c.GetString("username")
	requestingRole := c.GetString("role")
	if requestingRole != "admin" && requestingUser != username {
		Forbidden(c, "You are not authorized to update this user.")
		return
	}

	user, err := h.repo.GetUserByUsername(c.Request.Context(), username)
	if err != nil || user == nil {
		log.Printf("[ERROR] Failed to get user by username '%s' for update: %v", username, err)
		NotFound(c, "User")
		return
	}

	// Admins can update roles
	if input.Role != "" && requestingRole == "admin" {
		user.Role = input.Role
	}

	// Note: Changing username or email would require more complex logic
	// to handle uniqueness constraints, which is not implemented here.
	user.UpdatedAt = time.Now()

	if err := h.repo.UpdateUser(c.Request.Context(), user); err != nil {
		log.Printf("[ERROR] Failed to update user '%s': %v", username, err)
		InternalServerError(c, "Failed to update user account.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User account updated successfully."})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	username := c.Param("username")

	// Auth check
	requestingUser := c.GetString("username")
	requestingRole := c.GetString("role")
	if requestingRole != "admin" && requestingUser != username {
		Forbidden(c, "You are not authorized to delete this user.")
		return
	}

	// New constraint: Users cannot delete their own account
	if requestingUser == username {
		BadRequest(c, "You cannot delete your own account.")
		return
	}

	// New constraint: Cannot delete user that has posts
	posts, err := h.postRepo.GetPostsByUser(c.Request.Context(), username, nil)
	if err != nil {
		log.Printf("[ERROR] Failed to check posts for user '%s': %v", username, err)
		InternalServerError(c, "Failed to check user's posts: "+err.Error())
		return
	}
	if len(posts) > 0 {
		BadRequest(c, fmt.Sprintf("Cannot delete user '%s' because they have %d posts. Please delete or reassign their posts first.", username, len(posts)))
		return
	}

	if err := h.repo.DeleteUser(c.Request.Context(), username); err != nil {
		log.Printf("[ERROR] Failed to delete user '%s': %v", username, err)
		InternalServerError(c, "Failed to delete user account: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User account deleted successfully."})
}