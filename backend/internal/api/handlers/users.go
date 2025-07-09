package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	repo repository.UserRepository
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

// toUserResponse converts a domain.User to a UserResponse, stripping the prefix from the UserID.
func toUserResponse(user *domain.User) UserResponse {
	return UserResponse{
		UserID:    strings.TrimPrefix(user.UserID, "USER#"),
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


func NewUserHandler(repo repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
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

	// Check for existing user with the same email
	existingUser, err := h.repo.GetUserByEmail(c.Request.Context(), input.Email)
	if err != nil {
		InternalServerError(c, "Failed to check for existing user: "+err.Error())
		return
	}
	if existingUser != nil {
		Conflict(c, "A user with this email address already exists.")
		return
	}

	// Check for existing user with the same username
	existingUser, err = h.repo.GetUserByUsername(c.Request.Context(), input.Username)
	if err != nil {
		InternalServerError(c, "Failed to check for existing user: "+err.Error())
		return
	}
	if existingUser != nil {
		Conflict(c, "This username is already taken. Please choose a different one.")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		InternalServerError(c, "Failed to secure password.")
		return
	}

	user := &domain.User{
		UserID:       uuid.New().String(), // Generate clean UUID; repo will add prefix
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreateUser(c.Request.Context(), user); err != nil {
		InternalServerError(c, "Failed to create user account.")
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
	if err != nil {
		Unauthorized(c, "The email address or password you entered is incorrect.")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		Unauthorized(c, "The email address or password you entered is incorrect.")
		return
	}

	// Extract just the UUID part from the UserID (remove "USER#" prefix)
	userIDWithoutPrefix := strings.TrimPrefix(user.UserID, "USER#")
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": userIDWithoutPrefix,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})

	secret := c.MustGet("jwt_secret").(string)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		InternalServerError(c, "Could not generate authentication token.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
	c.Next()
}

type UpdateUserInput struct {
	Username string `json:"username"`
	Email    string `json:"email" binding:"email"`
}

func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
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
	userID := c.Param("id")
	var input UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		NotFound(c, "User")
		return
	}

	if input.Username != "" {
		user.Username = input.Username
	}
	if input.Email != "" {
		user.Email = input.Email
	}
	user.UpdatedAt = time.Now()

	if err := h.repo.UpdateUser(c.Request.Context(), user); err != nil {
		InternalServerError(c, "Failed to update user account.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User account updated successfully."})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	if err := h.repo.DeleteUser(c.Request.Context(), userID); err != nil {
		InternalServerError(c, "Failed to delete user account.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User account deleted successfully."})
}