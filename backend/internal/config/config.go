package config

import (
    "log"
    "os"
    "strconv"

    "github.com/joho/godotenv"
)

type Config struct {
	Port              string
	AWSRegion         string
	DynamoDBEndpoint  string
	DynamoDBTableName string
	JWTSecret         string
	JWTExpirationHours int
	RefreshTokenExpirationHours int
}

func Load() *Config {
    err := godotenv.Load(".env.dev")
    if err != nil {
        log.Println("No .env.dev file found, using environment variables")
    }

    return &Config{
        Port:              getEnv("PORT", "8080"),
        AWSRegion:         getEnv("AWS_REGION", "us-east-1"),
        DynamoDBEndpoint:  getEnv("DYNAMODB_ENDPOINT", "http://localhost:4566"),
        DynamoDBTableName: getEnv("DYNAMODB_TABLE", "WavyBlog"),
        JWTSecret:         getEnv("JWT_SECRET", "default-secret"),
        JWTExpirationHours: getEnvInt("JWT_EXPIRATION_HOURS", 240), // 10 days as requested
        RefreshTokenExpirationHours: getEnvInt("REFRESH_TOKEN_EXPIRATION_HOURS", 168), // 7 days
       }
      }

func getEnv(key, fallback string) string {
    if value, ok := os.LookupEnv(key); ok {
        return value
    }
    return fallback
}

func getEnvInt(key string, fallback int) int {
    if value, ok := os.LookupEnv(key); ok {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return fallback
}