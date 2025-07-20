package repository

import (
    "context"
    "time"
    "github.com/wavy-blog/backend/internal/domain"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)
	GetUserByRefreshToken(ctx context.Context, refreshToken string) (*domain.User, error)
	GetAllUsers(ctx context.Context) ([]*domain.User, error)
	UpdateUser(ctx context.Context, user *domain.User) error
	UpdateUserRefreshToken(ctx context.Context, userID string, refreshToken string, expiresAt time.Time) error
	DeleteUser(ctx context.Context, userID string) error
}

type PostRepository interface {
	CreatePost(ctx context.Context, post *domain.Post) error
	GetPostBySlug(ctx context.Context, slug string) (*domain.Post, error)
	GetPostsByUser(ctx context.Context, username string, postName *string) ([]*domain.Post, error)
	GetAllPosts(ctx context.Context, postName *string, pageSize int, pageIndex int) ([]*domain.Post, bool, error)
	GetPostsByCategory(ctx context.Context, categorySlug string) ([]*domain.Post, error)
	UpdatePost(ctx context.Context, oldSlug string, post *domain.Post) error
	DeletePost(ctx context.Context, slug string) error
	DeletePosts(ctx context.Context, slugs []string) error
}

type CategoryRepository interface {
	CreateCategory(ctx context.Context, category *domain.Category) error
	GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error)
	GetAllCategories(ctx context.Context) ([]*domain.Category, error)
	UpdateCategory(ctx context.Context, category *domain.Category) error
	DeleteCategory(ctx context.Context, slug string) error
	DeleteCategories(ctx context.Context, slugs []string) error
}

type Repository interface {
	UserRepository
	PostRepository
	CategoryRepository
}