package api

import (
	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/api/handlers"
	"github.com/wavy-blog/backend/internal/api/middleware"
	"github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/repository"
	"github.com/wavy-blog/backend/internal/service"
)

func SetupRouter(repo repository.Repository, cfg *config.Config, storageService service.StorageService) *gin.Engine {
	r := gin.Default()

	// Share JWT secret with handlers
	r.Use(func(c *gin.Context) {
		c.Set("jwt_secret", cfg.JWTSecret)
		c.Next()
	})

	userHandler := handlers.NewUserHandler(repo, repo, cfg)
	postHandler := handlers.NewPostHandler(repo, repo, repo)
	categoryHandler := handlers.NewCategoryHandler(repo, repo)
	imageHandler := handlers.NewImageHandler(storageService)

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
			posts.GET("/category/:categorySlug", categoryHandler.GetPostsByCategory)

			// Protected routes
			protected := posts.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret))
			{
				protected.POST("", postHandler.CreatePost)
				protected.PUT("/:slug", postHandler.UpdatePost)
				protected.DELETE("/:slug", postHandler.DeletePost)
				protected.DELETE("", postHandler.DeletePosts)
			}
		}

		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:slug", categoryHandler.GetCategory)

			// Protected routes
			protected := categories.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret))
			protected.POST("", middleware.AdminMiddleware(), categoryHandler.CreateCategory)
			protected.PUT("/:slug", middleware.AdminMiddleware(), categoryHandler.UpdateCategory)
			protected.DELETE("", middleware.AdminMiddleware(), categoryHandler.DeleteCategories)
		}

		images := api.Group("/images")
		{
			// All image routes require authentication and admin/author role
			protected := images.Group("").Use(middleware.AuthMiddleware(repo, cfg.JWTSecret), middleware.AdminOrAuthorMiddleware())
			{
				protected.POST("/upload", imageHandler.UploadImage)
				protected.GET("", imageHandler.GetImages)
				protected.DELETE("", imageHandler.DeleteImage)
				protected.GET("/url", imageHandler.GetImageURL)
			}
		}
	}

	return r
}