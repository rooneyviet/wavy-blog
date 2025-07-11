package domain

import "time"

type Category struct {
	PK         string    `json:"-" dynamodbav:"PK"`
	SK         string    `json:"-" dynamodbav:"SK"`
	Slug       string    `json:"slug" dynamodbav:"Slug"`
	Name       string    `json:"name" dynamodbav:"Name"`
	EntityType string    `json:"-" dynamodbav:"EntityType"`
	CreatedAt  time.Time `json:"created_at" dynamodbav:"CreatedAt"`
	UpdatedAt  time.Time `json:"updated_at" dynamodbav:"UpdatedAt"`
}