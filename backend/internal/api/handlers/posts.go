package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
)

type PostHandler struct {
	repo repository.PostRepository
}

// PostResponse defines the structure for post data returned to the client.
type PostResponse struct {
	PostID       string    `json:"postID"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	AuthorID     string    `json:"authorID"`
	Category     string    `json:"category"`
	ThumbnailURL string    `json:"thumbnailURL"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// toPostResponse converts a domain.Post to a PostResponse.
func toPostResponse(post *domain.Post) PostResponse {
	return PostResponse{
		PostID:       strings.TrimPrefix(post.PostID, "POST#"),
		Title:        post.Title,
		Content:      post.Content,
		AuthorID:     strings.TrimPrefix(post.AuthorID, "USER#"),
		Category:     post.Category,
		ThumbnailURL: post.ThumbnailURL,
		CreatedAt:    post.CreatedAt,
		UpdatedAt:    post.UpdatedAt,
	}
}

// toPostListResponse converts a slice of domain.Post to a slice of PostResponse.
func toPostListResponse(posts []*domain.Post) []PostResponse {
	res := make([]PostResponse, len(posts))
	for i, p := range posts {
		res[i] = toPostResponse(p)
	}
	return res
}

func NewPostHandler(repo repository.PostRepository) *PostHandler {
	return &PostHandler{repo: repo}
}

type CreatePostInput struct {
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content" binding:"required"`
	Category     string `json:"category" binding:"required"`
	ThumbnailURL string `json:"thumbnailURL"`
}

type UpdatePostInput struct {
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content" binding:"required"`
	Category     string `json:"category" binding:"required"`
	ThumbnailURL string `json:"thumbnailURL"`
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	userIDValue, exists := c.Get("userID")
	if !exists {
		Unauthorized(c, "User ID not found in context. Please log in.")
		return
	}
	userID, ok := userIDValue.(string)
	if !ok {
		InternalServerError(c, "Invalid user ID format in context.")
		return
	}

	post := &domain.Post{
		PostID:       uuid.New().String(), // Generate clean UUID
		Title:        input.Title,
		Content:      input.Content,
		AuthorID:     userID, // Clean userID from auth middleware
		Category:     input.Category,
		ThumbnailURL: input.ThumbnailURL,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreatePost(c.Request.Context(), post); err != nil {
		InternalServerError(c, "Failed to create the new post.")
		return
	}

	// To return the response with the correct prefixed ID stripped, we fetch it back.
	// A more optimized way might be to have CreatePost return the created object.
	createdPost, err := h.repo.GetPostByID(c.Request.Context(), post.PostID)
	if err != nil {
		InternalServerError(c, "Failed to retrieve created post.")
		return
	}

	c.JSON(http.StatusCreated, toPostResponse(createdPost))
}

func (h *PostHandler) GetPost(c *gin.Context) {
	postID := c.Param("id")
	post, err := h.repo.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		NotFound(c, "Post")
		return
	}
	c.JSON(http.StatusOK, toPostResponse(post))
}

func (h *PostHandler) GetPosts(c *gin.Context) {
	postName := c.Query("postName")
	posts, err := h.repo.GetAllPosts(c.Request.Context(), &postName)
	if err != nil {
		InternalServerError(c, "Failed to retrieve posts.")
		return
	}
	c.JSON(http.StatusOK, toPostListResponse(posts))
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	postID := c.Param("id")

	userIDValue, exists := c.Get("userID")
	if !exists {
		Unauthorized(c, "User ID not found in context. Please log in.")
		return
	}
	userID, ok := userIDValue.(string)
	if !ok {
		InternalServerError(c, "Invalid user ID format in context.")
		return
	}
	userRole := c.GetString("userRole")

	existingPost, err := h.repo.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		NotFound(c, "Post")
		return
	}

	// AuthorID in existingPost is clean, so this comparison is correct.
	if userRole != "admin" && existingPost.AuthorID != userID {
		Forbidden(c, "You are not authorized to update this post.")
		return
	}

	var input UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	existingPost.Title = input.Title
	existingPost.Content = input.Content
	existingPost.Category = input.Category
	existingPost.ThumbnailURL = input.ThumbnailURL
	existingPost.UpdatedAt = time.Now()

	if err := h.repo.UpdatePost(c.Request.Context(), existingPost); err != nil {
		InternalServerError(c, "Failed to update the post.")
		return
	}

	c.JSON(http.StatusOK, toPostResponse(existingPost))
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	postID := c.Param("id")

	userIDValue, exists := c.Get("userID")
	if !exists {
		Unauthorized(c, "User ID not found in context. Please log in.")
		return
	}
	userID, ok := userIDValue.(string)
	if !ok {
		InternalServerError(c, "Invalid user ID format in context.")
		return
	}
	userRole := c.GetString("userRole")

	// We must fetch the post to check for ownership before deleting.
	existingPost, err := h.repo.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		NotFound(c, "Post")
		return
	}

	if userRole != "admin" && existingPost.AuthorID != userID {
		Forbidden(c, "You are not authorized to delete this post.")
		return
	}

	if err := h.repo.DeletePost(c.Request.Context(), postID); err != nil {
		InternalServerError(c, "Failed to delete the post.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully."})
}