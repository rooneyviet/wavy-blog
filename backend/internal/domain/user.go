package domain

import "time"

type User struct {
	UserID       string    `json:"userID" dynamodbav:"PK"`
	Username     string    `json:"username" dynamodbav:"Username"`
	Email        string    `json:"email" dynamodbav:"Email"`
	PasswordHash string    `json:"-" dynamodbav:"PasswordHash"`
	Role         string    `json:"role" dynamodbav:"Role"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"CreatedAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"UpdatedAt"`
}