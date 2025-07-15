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
	repo     repository.Repository
	userRepo repository.UserRepository
}

type CategoryResponse struct {
	Slug        string    `json:"slug"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func toCategoryResponse(category *domain.Category) CategoryResponse {
	return CategoryResponse{
		Slug:        category.Slug,
		Name:        category.Name,
		Description: category.Description,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
	}
}

func toCategoryListResponse(categories []*domain.Category) []CategoryResponse {
	res := make([]CategoryResponse, len(categories))
	for i, c := range categories {
		res[i] = toCategoryResponse(c)
	}
	return res
}

// toPostResponse converts a domain.Post to a PostResponse for CategoryHandler.
func (h *CategoryHandler) toPostResponse(c *gin.Context, post *domain.Post) PostResponse {
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

// toPostListResponse converts a slice of domain.Post to a slice of PostResponse for CategoryHandler.
func (h *CategoryHandler) toPostListResponse(c *gin.Context, posts []*domain.Post) []PostResponse {
	res := make([]PostResponse, len(posts))
	for i, p := range posts {
		res[i] = h.toPostResponse(c, p)
	}
	return res
}

func NewCategoryHandler(repo repository.Repository, userRepo repository.UserRepository) *CategoryHandler {
	return &CategoryHandler{repo: repo, userRepo: userRepo}
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	category := &domain.Category{
		Name:        input.Name,
		Description: input.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
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
	c.JSON(http.StatusOK, h.toPostListResponse(c, posts))
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.repo.GetAllCategories(c.Request.Context())
	if err != nil {
		InternalServerError(c, "Failed to retrieve categories.")
		return
	}
	c.JSON(http.StatusOK, toCategoryListResponse(categories))
}

func (h *CategoryHandler) GetCategory(c *gin.Context) {
	slug := c.Param("slug")
	category, err := h.repo.GetCategoryBySlug(c.Request.Context(), slug)
	if err != nil {
		InternalServerError(c, "Failed to retrieve category.")
		return
	}
	if category == nil {
		NotFound(c, "Category not found.")
		return
	}
	c.JSON(http.StatusOK, toCategoryResponse(category))
}

func (h *CategoryHandler) DeleteCategories(c *gin.Context) {
	var input struct {
		Slugs []string `json:"slugs" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	// Use single category delete for single item, batch delete for multiple
	if len(input.Slugs) == 1 {
		if err := h.repo.DeleteCategory(c.Request.Context(), input.Slugs[0]); err != nil {
			if strings.Contains(err.Error(), "cannot delete") {
				BadRequest(c, err.Error())
				return
			}
			if strings.Contains(err.Error(), "not found") {
				NotFound(c, err.Error())
				return
			}
			InternalServerError(c, "Failed to delete category: "+err.Error())
			return
		}
	} else {
		if err := h.repo.DeleteCategories(c.Request.Context(), input.Slugs); err != nil {
			if strings.Contains(err.Error(), "cannot delete") || strings.Contains(err.Error(), "not found") {
				BadRequest(c, err.Error())
				return
			}
			InternalServerError(c, "Failed to delete categories: "+err.Error())
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Categories deleted successfully"})
}