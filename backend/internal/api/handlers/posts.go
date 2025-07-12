package handlers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
)

type PostHandler struct {
	repo         repository.PostRepository
	userRepo     repository.UserRepository
	categoryRepo repository.CategoryRepository
}

// PostResponse defines the structure for post data returned to the client.
type PostResponse struct {
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	AuthorID     string    `json:"authorID"`
	AuthorName   string    `json:"authorName"`
	Category     string    `json:"category"`
	ThumbnailURL string    `json:"thumbnailURL"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// toPostResponse converts a domain.Post to a PostResponse.
func (h *PostHandler) toPostResponse(c *gin.Context, post *domain.Post) PostResponse {
	authorName := post.AuthorID // Default to username if user lookup fails
	
	// Try to fetch the full user details to get the username
	if user, err := h.userRepo.GetUserByUsername(c.Request.Context(), post.AuthorID); err == nil && user != nil {
		authorName = user.Username
	}
	
	return PostResponse{
		Slug:         post.Slug,
		Title:        post.Title,
		Content:      post.Content,
		AuthorID:     post.AuthorID,
		AuthorName:   authorName,
		Category:     post.Category,
		ThumbnailURL: post.ThumbnailURL,
		Status:       post.Status,
		CreatedAt:    post.CreatedAt,
		UpdatedAt:    post.UpdatedAt,
	}
}

// toPostListResponse converts a slice of domain.Post to a slice of PostResponse.
func (h *PostHandler) toPostListResponse(c *gin.Context, posts []*domain.Post) []PostResponse {
	res := make([]PostResponse, len(posts))
	for i, p := range posts {
		res[i] = h.toPostResponse(c, p)
	}
	return res
}

func NewPostHandler(repo repository.PostRepository, userRepo repository.UserRepository, categoryRepo repository.CategoryRepository) *PostHandler {
	return &PostHandler{repo: repo, userRepo: userRepo, categoryRepo: categoryRepo}
}

type CreatePostInput struct {
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content" binding:"required"`
	CategorySlug string `json:"categorySlug" binding:"required"`
	ThumbnailURL string `json:"thumbnailURL"`
	Status       string `json:"status"` // "published" or "draft", defaults to "draft"
}

type UpdatePostInput struct {
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content" binding:"required"`
	CategorySlug string `json:"categorySlug" binding:"required"`
	ThumbnailURL string `json:"thumbnailURL"`
	Status       string `json:"status"` // "published" or "draft"
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	username := c.GetString("username")
	if username == "" {
		Unauthorized(c, "Username not found in context. Please log in.")
		return
	}

	// Validate that the category exists
	category, err := h.categoryRepo.GetCategoryBySlug(c.Request.Context(), input.CategorySlug)
	if err != nil {
		InternalServerError(c, "Failed to validate category: "+err.Error())
		return
	}
	if category == nil {
		BadRequest(c, "Category with slug '"+input.CategorySlug+"' does not exist")
		return
	}

	// Set default status to "draft" if not provided or invalid
	status := input.Status
	if status != "published" && status != "draft" {
		status = "draft"
	}

	post := &domain.Post{
		Title:        input.Title,
		Content:      input.Content,
		AuthorID:     username, // Use username from token
		Category:     input.CategorySlug, // Use category slug
		ThumbnailURL: input.ThumbnailURL,
		Status:       status,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreatePost(c.Request.Context(), post); err != nil {
		InternalServerError(c, "Failed to create the new post: "+err.Error())
		return
	}

	c.JSON(http.StatusCreated, h.toPostResponse(c, post))
}

func (h *PostHandler) GetPost(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	post, err := h.repo.GetPostBySlug(c.Request.Context(), slug)
	if err != nil {
		NotFound(c, "Post")
		return
	}
	c.JSON(http.StatusOK, h.toPostResponse(c, post))
}

func (h *PostHandler) GetPosts(c *gin.Context) {
	postName := c.Query("postName")
	posts, err := h.repo.GetAllPosts(c.Request.Context(), &postName)
	if err != nil {
		InternalServerError(c, "Failed to retrieve posts.")
		return
	}
	c.JSON(http.StatusOK, h.toPostListResponse(c, posts))
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	log.Printf("Attempting to update post with slug: '%s'", slug)

	username := c.GetString("username")
	userRole := c.GetString("role")

	existingPost, err := h.repo.GetPostBySlug(c.Request.Context(), slug)
	if err != nil {
		NotFound(c, "Post")
		return
	}

	if userRole != "admin" && existingPost.AuthorID != username {
		Forbidden(c, "You are not authorized to update this post.")
		return
	}

	var input UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	// Validate that the category exists
	category, err := h.categoryRepo.GetCategoryBySlug(c.Request.Context(), input.CategorySlug)
	if err != nil {
		InternalServerError(c, "Failed to validate category: "+err.Error())
		return
	}
	if category == nil {
		BadRequest(c, "Category with slug '"+input.CategorySlug+"' does not exist")
		return
	}

	// Keep a copy of the old slug before updating the post
	oldSlug := existingPost.Slug

	// Set status, default to existing status if not provided or invalid
	status := input.Status
	if status != "published" && status != "draft" {
		status = existingPost.Status // Keep existing status if invalid input
	}

	existingPost.Title = input.Title
	existingPost.Content = input.Content
	existingPost.Category = input.CategorySlug // Use category slug
	existingPost.ThumbnailURL = input.ThumbnailURL
	existingPost.Status = status
	existingPost.UpdatedAt = time.Now()

	if err := h.repo.UpdatePost(c.Request.Context(), oldSlug, existingPost); err != nil {
		InternalServerError(c, "Failed to update the post: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, h.toPostResponse(c, existingPost))
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))

	username := c.GetString("username")
	userRole := c.GetString("role")

	existingPost, err := h.repo.GetPostBySlug(c.Request.Context(), slug)
	if err != nil {
		NotFound(c, "Post")
		return
	}

	if userRole != "admin" && existingPost.AuthorID != username {
		Forbidden(c, "You are not authorized to delete this post.")
		return
	}

	if err := h.repo.DeletePost(c.Request.Context(), slug); err != nil {
		InternalServerError(c, "Failed to delete the post.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully."})
}