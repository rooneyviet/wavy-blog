package service

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioStorage struct {
	client    *minio.Client
	bucket    string
	endpoint  string
	useSSL    bool
}

func NewMinioStorage(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*MinioStorage, error) {
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	return &MinioStorage{
		client:   minioClient,
		bucket:   bucket,
		endpoint: endpoint,
		useSSL:   useSSL,
	}, nil
}

func (m *MinioStorage) InitializeBucket(ctx context.Context) error {
	exists, err := m.client.BucketExists(ctx, m.bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = m.client.MakeBucket(ctx, m.bucket, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	return nil
}

func (m *MinioStorage) UploadImage(ctx context.Context, userEmail, filename string, data io.Reader, size int64, contentType string) (*ImageMetadata, error) {
	// Generate unique ID for the image
	imageID := uuid.New().String()
	
	// Create path: userEmail/imageID-filename
	path := fmt.Sprintf("%s/%s-%s", userEmail, imageID, filename)

	// Upload the file
	_, err := m.client.PutObject(ctx, m.bucket, path, data, size, minio.PutObjectOptions{
		ContentType: contentType,
		UserMetadata: map[string]string{
			"uploaded-by": userEmail,
			"image-id":    imageID,
			"original-name": filename,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload image: %w", err)
	}

	// Generate URL
	imageURL, err := m.GetImageURL(ctx, userEmail, path)
	if err != nil {
		return nil, fmt.Errorf("failed to generate image URL: %w", err)
	}

	return &ImageMetadata{
		ID:          imageID,
		Name:        fmt.Sprintf("%s-%s", imageID, filename),
		OriginalName: filename,
		Size:        size,
		ContentType: contentType,
		UploadedBy:  userEmail,
		UploadedAt:  time.Now(),
		URL:         imageURL,
		Path:        path,
	}, nil
}

func (m *MinioStorage) DeleteImage(ctx context.Context, userEmail, imagePath string) error {
	// Verify the path belongs to the user
	if !strings.HasPrefix(imagePath, userEmail+"/") {
		return fmt.Errorf("unauthorized: image does not belong to user")
	}

	err := m.client.RemoveObject(ctx, m.bucket, imagePath, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete image: %w", err)
	}

	return nil
}

func (m *MinioStorage) DeleteImageAdmin(ctx context.Context, imagePath string) error {
	// Admin can delete any image - no ownership check
	err := m.client.RemoveObject(ctx, m.bucket, imagePath, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete image: %w", err)
	}

	return nil
}

func (m *MinioStorage) GetImages(ctx context.Context, userEmail string, pageIndex, pageSize int) (*PaginatedImages, error) {
	prefix := userEmail + "/"
	
	// List objects with pagination
	objectCh := m.client.ListObjects(ctx, m.bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})

	var images []ImageMetadata
	count := 0
	startIndex := pageIndex * pageSize
	endIndex := startIndex + pageSize

	for object := range objectCh {
		if object.Err != nil {
			return nil, fmt.Errorf("failed to list objects: %w", object.Err)
		}

		if count >= startIndex && count < endIndex {
			// Get object metadata
			objInfo, err := m.client.StatObject(ctx, m.bucket, object.Key, minio.StatObjectOptions{})
			if err != nil {
				return nil, fmt.Errorf("failed to get object metadata: %w", err)
			}

			// Extract image ID and original name from metadata or path
			imageID := objInfo.UserMetadata["X-Amz-Meta-Image-Id"]
			originalName := objInfo.UserMetadata["X-Amz-Meta-Original-Name"]
			
			// Fallback to parsing from path if metadata is not available
			if imageID == "" || originalName == "" {
				pathParts := strings.Split(filepath.Base(object.Key), "-")
				if len(pathParts) >= 2 {
					imageID = pathParts[0]
					originalName = strings.Join(pathParts[1:], "-")
				}
			}

			// Generate URL
			imageURL, err := m.GetImageURL(ctx, userEmail, object.Key)
			if err != nil {
				return nil, fmt.Errorf("failed to generate image URL: %w", err)
			}

			images = append(images, ImageMetadata{
				ID:          imageID,
				Name:        filepath.Base(object.Key),
				OriginalName: originalName,
				Size:        object.Size,
				ContentType: objInfo.ContentType,
				UploadedBy:  userEmail,
				UploadedAt:  object.LastModified,
				URL:         imageURL,
				Path:        object.Key,
			})
		}

		count++
		if count >= endIndex+100 { // Stop early if we have more than needed
			break
		}
	}

	return &PaginatedImages{
		Images:    images,
		Total:     count,
		PageIndex: pageIndex,
		PageSize:  pageSize,
		HasMore:   count > endIndex,
	}, nil
}

func (m *MinioStorage) GetAllImages(ctx context.Context, pageIndex, pageSize int) (*PaginatedImages, error) {
	// Admin can get all images - no prefix filtering
	objectCh := m.client.ListObjects(ctx, m.bucket, minio.ListObjectsOptions{
		Recursive: true,
	})

	var images []ImageMetadata
	count := 0
	startIndex := pageIndex * pageSize
	endIndex := startIndex + pageSize

	for object := range objectCh {
		if object.Err != nil {
			return nil, fmt.Errorf("failed to list objects: %w", object.Err)
		}

		if count >= startIndex && count < endIndex {
			// Get object metadata
			objInfo, err := m.client.StatObject(ctx, m.bucket, object.Key, minio.StatObjectOptions{})
			if err != nil {
				return nil, fmt.Errorf("failed to get object metadata: %w", err)
			}

			// Extract image ID and original name from metadata or path
			imageID := objInfo.UserMetadata["X-Amz-Meta-Image-Id"]
			originalName := objInfo.UserMetadata["X-Amz-Meta-Original-Name"]
			uploadedBy := objInfo.UserMetadata["X-Amz-Meta-Uploaded-By"]
			
			// Fallback to parsing from path if metadata is not available
			if imageID == "" || originalName == "" || uploadedBy == "" {
				pathParts := strings.Split(object.Key, "/")
				if len(pathParts) >= 2 {
					uploadedBy = pathParts[0] // First part is user email
					fileParts := strings.Split(filepath.Base(object.Key), "-")
					if len(fileParts) >= 2 {
						imageID = fileParts[0]
						originalName = strings.Join(fileParts[1:], "-")
					}
				}
			}

			// For admin, we need to generate URL differently since userEmail might not match
			// We'll use the uploadedBy from metadata or extracted from path
			var imageURL string
			if uploadedBy != "" {
				var err error
				// Generate presigned URL without user check (admin privilege)
				presignedURL, err := m.client.PresignedGetObject(ctx, m.bucket, object.Key, time.Hour, nil)
				if err != nil {
					return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
				}
				imageURL = presignedURL.String()
			}

			images = append(images, ImageMetadata{
				ID:          imageID,
				Name:        filepath.Base(object.Key),
				OriginalName: originalName,
				Size:        object.Size,
				ContentType: objInfo.ContentType,
				UploadedBy:  uploadedBy,
				UploadedAt:  object.LastModified,
				URL:         imageURL,
				Path:        object.Key,
			})
		}

		count++
		if count >= endIndex+100 { // Stop early if we have more than needed
			break
		}
	}

	return &PaginatedImages{
		Images:    images,
		Total:     count,
		PageIndex: pageIndex,
		PageSize:  pageSize,
		HasMore:   count > endIndex,
	}, nil
}

func (m *MinioStorage) GetImageURL(ctx context.Context, userEmail, imagePath string) (string, error) {
	// Verify the path belongs to the user
	if !strings.HasPrefix(imagePath, userEmail+"/") {
		return "", fmt.Errorf("unauthorized: image does not belong to user")
	}

	// Generate presigned URL (expires in 1 hour)
	presignedURL, err := m.client.PresignedGetObject(ctx, m.bucket, imagePath, time.Hour, url.Values{})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}