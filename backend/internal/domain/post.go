package domain

import "time"

type Post struct {
    PostID       string    `json:"postID" dynamodbav:"PK"`
    Title        string    `json:"title" dynamodbav:"Title"`
    Content      string    `json:"content" dynamodbav:"Content"`
    AuthorID     string    `json:"authorID" dynamodbav:"AuthorID"`
    Category     string    `json:"category" dynamodbav:"Category"`
    ThumbnailURL string    `json:"thumbnailURL" dynamodbav:"ThumbnailURL"`
    CreatedAt    time.Time `json:"createdAt" dynamodbav:"CreatedAt"`
    UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"UpdatedAt"`
}