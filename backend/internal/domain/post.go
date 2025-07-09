package domain

import "time"

type Post struct {
	PK           string    `json:"-" dynamodbav:"PK"`
	SK           string    `json:"-" dynamodbav:"SK"`
	Slug         string    `json:"slug" dynamodbav:"Slug"`
	Title        string    `json:"title" dynamodbav:"Title"`
	Content      string    `json:"content" dynamodbav:"Content"`
	AuthorID     string    `json:"authorID" dynamodbav:"AuthorID"` // This will be the username
	Category     string    `json:"category" dynamodbav:"Category"`
	ThumbnailURL string    `json:"thumbnailURL" dynamodbav:"ThumbnailURL"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"CreatedAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"UpdatedAt"`
	EntityType   string    `json:"-" dynamodbav:"EntityType"`

	// GSIs for different access patterns
	GSI1PK string `json:"-" dynamodbav:"GSI1PK,omitempty"` // For posts by user
	GSI1SK string `json:"-" dynamodbav:"GSI1SK,omitempty"`
	GSI2PK string `json:"-" dynamodbav:"GSI2PK,omitempty"` // For posts by category
	GSI2SK string `json:"-" dynamodbav:"GSI2SK,omitempty"`
}
type SlugUniqueness struct {
	PK string `dynamodbav:"PK"` // SLUG#<slug>
	SK string `dynamodbav:"SK"` // SLUG#<slug>
}