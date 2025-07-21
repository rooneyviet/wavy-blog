package service

import (
	"context"
	"io"
	"time"
)

type ImageMetadata struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	OriginalName string   `json:"originalName"`
	Size        int64     `json:"size"`
	ContentType string    `json:"contentType"`
	UploadedBy  string    `json:"uploadedBy"`
	UploadedAt  time.Time `json:"uploadedAt"`
	URL         string    `json:"url"`
	Path        string    `json:"path"`
}

type PaginatedImages struct {
	Images    []ImageMetadata `json:"images"`
	Total     int             `json:"total"`
	PageIndex int             `json:"pageIndex"`
	PageSize  int             `json:"pageSize"`
	HasMore   bool            `json:"hasMore"`
}

type StorageService interface {
	// UploadImage uploads an image and returns metadata
	UploadImage(ctx context.Context, userEmail string, filename string, data io.Reader, size int64, contentType string) (*ImageMetadata, error)
	
	// DeleteImage deletes an image by path (for author - checks ownership)
	DeleteImage(ctx context.Context, userEmail string, imagePath string) error
	
	// DeleteImageAdmin deletes any image by path (for admin - no ownership check)
	DeleteImageAdmin(ctx context.Context, imagePath string) error
	
	// GetImages returns paginated list of images for a user
	GetImages(ctx context.Context, userEmail string, pageIndex, pageSize int) (*PaginatedImages, error)
	
	// GetAllImages returns paginated list of all images (for admin)
	GetAllImages(ctx context.Context, pageIndex, pageSize int) (*PaginatedImages, error)
	
	// GetImageURL returns a presigned URL for an image
	GetImageURL(ctx context.Context, userEmail string, imagePath string) (string, error)
	
	// InitializeBucket creates the bucket if it doesn't exist
	InitializeBucket(ctx context.Context) error
}