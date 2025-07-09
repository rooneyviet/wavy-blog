package domain

import "time"

type User struct {
	PK           string    `json:"-" dynamodbav:"PK"`
	SK           string    `json:"-" dynamodbav:"SK"`
	UserID       string    `json:"userID" dynamodbav:"UserID"`
	Username     string    `json:"username" dynamodbav:"Username"`
	Email        string    `json:"email" dynamodbav:"Email"`
	PasswordHash string    `json:"-" dynamodbav:"PasswordHash"`
	Role         string    `json:"role" dynamodbav:"Role"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"CreatedAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"UpdatedAt"`
	EntityType   string    `json:"-" dynamodbav:"EntityType"`
}

// UserEmail is a separate struct used for enforcing email uniqueness and looking up a user by email.
type UserEmail struct {
	PK       string `dynamodbav:"PK"`
	SK       string `dynamodbav:"SK"`
	Username string `dynamodbav:"Username"`
}