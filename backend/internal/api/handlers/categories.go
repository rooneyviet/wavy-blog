package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/repository"
)

type CategoryHandler struct {
	repo repository.PostRepository
}

func NewCategoryHandler(repo repository.PostRepository) *CategoryHandler {
	return &CategoryHandler{repo: repo}
}

func (h *CategoryHandler) GetPostsByCategory(c *gin.Context) {
	category := c.Param("category")
	posts, err := h.repo.GetPostsByCategory(c.Request.Context(), category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get posts by category"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.repo.GetUniqueCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}