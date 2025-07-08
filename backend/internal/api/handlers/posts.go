package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
)

type PostHandler struct {
	repo repository.PostRepository
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")

	post := &domain.Post{
		PostID:       "POST#" + uuid.New().String(),
		Title:        input.Title,
		Content:      input.Content,
		AuthorID:     userID.(string),
		Category:     input.Category,
		ThumbnailURL: input.ThumbnailURL,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreatePost(c.Request.Context(), post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (h *PostHandler) GetPost(c *gin.Context) {
	postID := c.Param("id")
	post, err := h.repo.GetPostByID(c.Request.Context(), "POST#"+postID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) GetPosts(c *gin.Context) {
	userRole := c.GetString("userRole")
	if userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to view all posts"})
		return
	}
	postName := c.Query("postName")
	posts, err := h.repo.GetAllPosts(c.Request.Context(), &postName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get posts"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	postID := "POST#" + c.Param("id")

	userID := c.GetString("userID")
	userRole := c.GetString("userRole")

	existingPost, err := h.repo.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	if userRole != "admin" && existingPost.AuthorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to update this post"})
		return
	}

	var input UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingPost.Title = input.Title
	existingPost.Content = input.Content
	existingPost.Category = input.Category
	existingPost.ThumbnailURL = input.ThumbnailURL
	existingPost.UpdatedAt = time.Now()

	if err := h.repo.UpdatePost(c.Request.Context(), existingPost); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, existingPost)
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	postID := "POST#" + c.Param("id")

	userID := c.GetString("userID")
	userRole := c.GetString("userRole")

	existingPost, err := h.repo.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	if userRole != "admin" && existingPost.AuthorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to delete this post"})
		return
	}

	if err := h.repo.DeletePost(c.Request.Context(), postID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}