package api

import (
	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/api/handlers"
	"github.com/wavy-blog/backend/internal/api/middleware"
	"github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/repository"
)

func SetupRouter(repo repository.Repository, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// Share JWT secret with handlers
	r.Use(func(c *gin.Context) {
		c.Set("jwt_secret", cfg.JWTSecret)
		c.Next()
	})

	userHandler := handlers.NewUserHandler(repo, cfg)
	postHandler := handlers.NewPostHandler(repo)
	categoryHandler := handlers.NewCategoryHandler(repo)

	api := r.Group("/api")
	{
		users := api.Group("/users")
		{
			users.POST("/register", userHandler.Register)
			users.POST("/login", userHandler.Login)
			users.POST("/refresh", userHandler.Refresh)

			protected := users.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret))
			{
				protected.GET("/:username", userHandler.GetUser)
				protected.PUT("/:username", userHandler.UpdateUser)
				protected.DELETE("/:username", userHandler.DeleteUser)
			}

			// Admin routes
			admin := users.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret), middleware.AdminMiddleware())
			{
				admin.GET("", userHandler.GetUsers)
			}
		}

		posts := api.Group("/posts")
		{
			posts.GET("/:slug", postHandler.GetPost)
			posts.GET("", postHandler.GetPosts)

			// Protected routes
			protected := posts.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret))
			protected.POST("", postHandler.CreatePost)
			protected.PUT("/:slug", postHandler.UpdatePost)
			protected.DELETE("/:slug", postHandler.DeletePost)
		}

		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:categorySlug/posts", categoryHandler.GetPostsByCategory)

			// Protected routes
			protected := categories.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret))
			protected.POST("", middleware.AdminMiddleware(), categoryHandler.CreateCategory)
		}
	}

	return r
}