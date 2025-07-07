package repository

import (
    "context"
    "github.com/wavy-blog/backend/internal/domain"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)
	GetAllUsers(ctx context.Context) ([]*domain.User, error)
	UpdateUser(ctx context.Context, user *domain.User) error
	DeleteUser(ctx context.Context, userID string) error
}

type PostRepository interface {
	CreatePost(ctx context.Context, post *domain.Post) error
	GetPostByID(ctx context.Context, postID string) (*domain.Post, error)
	GetPostsByUser(ctx context.Context, userID string, postName *string) ([]*domain.Post, error)
	GetAllPosts(ctx context.Context, postName *string) ([]*domain.Post, error)
	GetPostsByCategory(ctx context.Context, category string) ([]*domain.Post, error)
	GetUniqueCategories(ctx context.Context) ([]string, error)
	UpdatePost(ctx context.Context, post *domain.Post) error
	DeletePost(ctx context.Context, postID string) error
}

type Repository interface {
    UserRepository
    PostRepository
}