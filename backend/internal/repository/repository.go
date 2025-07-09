package repository

import (
    "context"
    "github.com/wavy-blog/backend/internal/domain"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)
	GetAllUsers(ctx context.Context) ([]*domain.User, error)
	UpdateUser(ctx context.Context, user *domain.User) error
	DeleteUser(ctx context.Context, userID string) error
}

type PostRepository interface {
	CreatePost(ctx context.Context, post *domain.Post) error
	GetPostByID(ctx context.Context, postID string) (*domain.Post, error)
	GetPostsByUser(ctx context.Context, username string, postName *string) ([]*domain.Post, error)
	GetAllPosts(ctx context.Context, postName *string) ([]*domain.Post, error)
	GetPostsByCategory(ctx context.Context, category string) ([]*domain.Post, error)
	UpdatePost(ctx context.Context, post *domain.Post) error
	DeletePost(ctx context.Context, postID string) error
}

type CategoryRepository interface {
	CreateCategory(ctx context.Context, category *domain.Category) error
	GetAllCategories(ctx context.Context) ([]*domain.Category, error)
}

type Repository interface {
	UserRepository
	PostRepository
	CategoryRepository
}