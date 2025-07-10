package handlers

import (
	"net/http"
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
	repo repository.UserRepository
	cfg  *config.Config
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


func NewUserHandler(repo repository.UserRepository, cfg *config.Config) *UserHandler {
	return &UserHandler{repo: repo, cfg: cfg}
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
			Conflict(c, "A user with this username or email already exists.")
			return
		}
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

	user, err := h.repo.GetUserByEmail(c.Request.Context(), input.Email)
	if err != nil || user == nil {
		Unauthorized(c, "The email address or password you entered is incorrect.")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		Unauthorized(c, "The email address or password you entered is incorrect.")
		return
	}

	// Generate access token
	accessToken, err := utils.GenerateAccessToken(user, h.cfg)
	if err != nil {
		InternalServerError(c, "Could not generate authentication token.")
		return
	}

	// Generate refresh token
	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		InternalServerError(c, "Could not generate refresh token.")
		return
	}

	// Store refresh token in database
	refreshTokenExpiration := utils.GetRefreshTokenExpiration(h.cfg)
	if err := h.repo.UpdateUserRefreshToken(c.Request.Context(), user.Username, refreshToken, refreshTokenExpiration); err != nil {
		InternalServerError(c, "Could not store refresh token.")
		return
	}

	// Set refresh token as HTTP-only cookie
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", refreshToken, int(h.cfg.RefreshTokenExpirationHours*3600), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user": toUserResponse(user),
	})
}

func (h *UserHandler) Refresh(c *gin.Context) {
	// Get refresh token from HTTP-only cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		Unauthorized(c, "Refresh token not found.")
		return
	}

	// Find user by refresh token
	user, err := h.repo.GetUserByRefreshToken(c.Request.Context(), refreshToken)
	if err != nil || user == nil {
		Unauthorized(c, "Invalid refresh token.")
		return
	}

	// Check if refresh token has expired
	if time.Now().After(user.RefreshTokenExpiresAt) {
		Unauthorized(c, "Refresh token has expired.")
		return
	}

	// Generate new access token
	newAccessToken, err := utils.GenerateAccessToken(user, h.cfg)
	if err != nil {
		InternalServerError(c, "Could not generate new access token.")
		return
	}

	// Optionally rotate refresh token for enhanced security
	newRefreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		InternalServerError(c, "Could not generate new refresh token.")
		return
	}

	// Update refresh token in database
	refreshTokenExpiration := utils.GetRefreshTokenExpiration(h.cfg)
	if err := h.repo.UpdateUserRefreshToken(c.Request.Context(), user.Username, newRefreshToken, refreshTokenExpiration); err != nil {
		InternalServerError(c, "Could not update refresh token.")
		return
	}

	// Set new refresh token as HTTP-only cookie
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", newRefreshToken, int(h.cfg.RefreshTokenExpirationHours*3600), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
		"user": toUserResponse(user),
	})
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
		NotFound(c, "User")
		return
	}
	c.JSON(http.StatusOK, toUserResponse(user))
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.repo.GetAllUsers(c.Request.Context())
	if err != nil {
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

	if err := h.repo.DeleteUser(c.Request.Context(), username); err != nil {
		InternalServerError(c, "Failed to delete user account: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User account deleted successfully."})
}