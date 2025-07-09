package api

import (
	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/api/handlers"
	"github.com/wavy-blog/backend/internal/api/middleware"
	"github.com/wavy-blog/backend/internal/repository"
)

func SetupRouter(repo repository.Repository, jwtSecret string) *gin.Engine {
	r := gin.Default()

	// Share JWT secret with handlers
	r.Use(func(c *gin.Context) {
		c.Set("jwt_secret", jwtSecret)
		c.Next()
	})

	userHandler := handlers.NewUserHandler(repo)
	postHandler := handlers.NewPostHandler(repo)
	categoryHandler := handlers.NewCategoryHandler(repo)

	api := r.Group("/api")
	{
		users := api.Group("/users")
		{
			users.POST("/register", userHandler.Register)
			users.POST("/login", userHandler.Login)

			protected := users.Group("").Use(middleware.AuthMiddleware(repo, jwtSecret))
			{
				protected.GET("/:id", userHandler.GetUser)
				protected.PUT("/:id", userHandler.UpdateUser)
				protected.DELETE("/:id", userHandler.DeleteUser)
			}

			// Admin routes
			admin := users.Group("").Use(middleware.AuthMiddleware(repo, jwtSecret), middleware.AdminMiddleware())
			{
				admin.GET("", userHandler.GetUsers)
			}
		}

		posts := api.Group("/posts")
		{
			posts.GET("/:id", postHandler.GetPost)
			posts.GET("", postHandler.GetPosts)

			// Protected routes
			protected := posts.Group("").Use(middleware.AuthMiddleware(repo, jwtSecret))
			protected.POST("", postHandler.CreatePost)
			protected.PUT("/:id", postHandler.UpdatePost)
			protected.DELETE("/:id", postHandler.DeletePost)
		}

		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:category/posts", categoryHandler.GetPostsByCategory)

			// Protected routes
			protected := categories.Group("").Use(middleware.AuthMiddleware(repo, jwtSecret))
			protected.POST("", middleware.AdminMiddleware(), categoryHandler.CreateCategory)
		}
	}

	return r
}