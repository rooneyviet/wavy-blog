package main

import (
	"github.com/wavy-blog/backend/internal/api"
	"github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/repository/dynamodb"
)

func main() {
	cfg := config.Load()
	repo := dynamodb.New(cfg)

	router := api.SetupRouter(repo, cfg)

	router.Run(":" + cfg.Port)
}