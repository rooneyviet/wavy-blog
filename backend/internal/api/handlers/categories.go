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

type CategoryHandler struct {
	repo repository.Repository
}

func NewCategoryHandler(repo repository.Repository) *CategoryHandler {
	return &CategoryHandler{repo: repo}
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	category := &domain.Category{
		CategoryID: uuid.New().String(),
		Name:       input.Name,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := h.repo.CreateCategory(c.Request.Context(), category); err != nil {
		if strings.Contains(err.Error(), "category already exists") {
			Conflict(c, "A category with this name already exists.")
			return
		}
		InternalServerError(c, "Failed to create the new category: "+err.Error())
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) GetPostsByCategory(c *gin.Context) {
	categoryName := c.Param("categoryName")
	posts, err := h.repo.GetPostsByCategory(c.Request.Context(), categoryName)
	if err != nil {
		InternalServerError(c, "Failed to retrieve posts for the specified category.")
		return
	}
	// We need to convert posts to the response format
	c.JSON(http.StatusOK, toPostListResponse(posts))
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.repo.GetAllCategories(c.Request.Context())
	if err != nil {
		InternalServerError(c, "Failed to retrieve categories.")
		return
	}
	c.JSON(http.StatusOK, categories)
}