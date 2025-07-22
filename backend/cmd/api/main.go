package main

import (
	"context"
	"log"

	"github.com/wavy-blog/backend/internal/api"
	"github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/repository/dynamodb"
	"github.com/wavy-blog/backend/internal/service"
)

func main() {
	cfg := config.Load()
	repo := dynamodb.New(cfg)

	// Initialize storage service
	storageFactory := service.NewStorageFactory(cfg)
	storageService, err := storageFactory.CreateStorageService()
	if err != nil {
		log.Fatalf("Failed to create storage service: %v", err)
	}

	// Initialize storage bucket
	ctx := context.Background()
	if err := storageService.InitializeBucket(ctx); err != nil {
		log.Fatalf("Failed to initialize storage bucket: %v", err)
	}

	router := api.SetupRouter(repo, cfg, storageService)

	log.Printf("Server starting on port %s", cfg.Port)
	router.Run(":" + cfg.Port)
}