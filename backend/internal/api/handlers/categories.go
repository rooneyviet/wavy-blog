package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/repository"
)

type CategoryHandler struct {
	repo repository.Repository
}

type CategoryResponse struct {
	Slug      string    `json:"slug"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func toCategoryResponse(category *domain.Category) CategoryResponse {
	return CategoryResponse{
		Slug:      category.Slug,
		Name:      category.Name,
		CreatedAt: category.CreatedAt,
		UpdatedAt: category.UpdatedAt,
	}
}

func toCategoryListResponse(categories []*domain.Category) []CategoryResponse {
	res := make([]CategoryResponse, len(categories))
	for i, c := range categories {
		res[i] = toCategoryResponse(c)
	}
	return res
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
		Name:      input.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.repo.CreateCategory(c.Request.Context(), category); err != nil {
		if strings.Contains(err.Error(), "category with this slug already exists") {
			Conflict(c, "A category with this name already exists.")
			return
		}
		InternalServerError(c, "Failed to create the new category: "+err.Error())
		return
	}

	c.JSON(http.StatusCreated, toCategoryResponse(category))
}

func (h *CategoryHandler) GetPostsByCategory(c *gin.Context) {
	categorySlug := c.Param("categorySlug")
	posts, err := h.repo.GetPostsByCategory(c.Request.Context(), categorySlug)
	if err != nil {
		InternalServerError(c, "Failed to retrieve posts for the specified category.")
		return
	}
	c.JSON(http.StatusOK, toPostListResponse(posts))
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.repo.GetAllCategories(c.Request.Context())
	if err != nil {
		InternalServerError(c, "Failed to retrieve categories.")
		return
	}
	c.JSON(http.StatusOK, toCategoryListResponse(categories))
}