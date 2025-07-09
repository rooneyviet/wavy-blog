package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
)

type CategoryHandler struct {
	repo repository.Repository
}

func NewCategoryHandler(repo repository.Repository) *CategoryHandler {
	return &CategoryHandler{repo: repo}
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var category domain.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	category.ID = uuid.New().String()
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	if err := h.repo.CreateCategory(c.Request.Context(), &category); err != nil {
		InternalServerError(c, "Failed to create the new category.")
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) GetPostsByCategory(c *gin.Context) {
	category := c.Param("category")
	posts, err := h.repo.GetPostsByCategory(c.Request.Context(), category)
	if err != nil {
		InternalServerError(c, "Failed to retrieve posts for the specified category.")
		return
	}
	c.JSON(http.StatusOK, posts)
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.repo.GetUniqueCategories(c.Request.Context())
	if err != nil {
		InternalServerError(c, "Failed to retrieve categories.")
		return
	}
	c.JSON(http.StatusOK, categories)
}