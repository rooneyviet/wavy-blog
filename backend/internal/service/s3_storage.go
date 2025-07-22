package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type S3Storage struct {
	client *s3.Client
	bucket string
	region string
}

func NewS3Storage(client *s3.Client, bucket, region string) *S3Storage {
	return &S3Storage{
		client: client,
		bucket: bucket,
		region: region,
	}
}

func (s *S3Storage) InitializeBucket(ctx context.Context) error {
	// Check if bucket exists
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})
	
	if err != nil {
		// Try to create the bucket
		_, err = s.client.CreateBucket(ctx, &s3.CreateBucketInput{
			Bucket: aws.String(s.bucket),
		})
		if err != nil {
			return fmt.Errorf("failed to create S3 bucket: %w", err)
		}
	}

	return nil
}

func (s *S3Storage) UploadImage(ctx context.Context, userEmail, filename string, data io.Reader, size int64, contentType string) (*ImageMetadata, error) {
	// Generate unique ID for the image
	imageID := uuid.New().String()
	
	// Create path: userEmail/imageID-filename
	path := fmt.Sprintf("%s/%s-%s", userEmail, imageID, filename)

	// Upload the file
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(path),
		Body:        data,
		ContentType: aws.String(contentType),
		Metadata: map[string]string{
			"uploaded-by":   userEmail,
			"image-id":      imageID,
			"original-name": filename,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload image to S3: %w", err)
	}

	// Generate URL
	imageURL, err := s.GetImageURL(ctx, userEmail, path)
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

func (s *S3Storage) DeleteImage(ctx context.Context, userEmail, imagePath string) error {
	// Verify the path belongs to the user
	if !strings.HasPrefix(imagePath, userEmail+"/") {
		return fmt.Errorf("unauthorized: image does not belong to user")
	}

	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(imagePath),
	})
	if err != nil {
		return fmt.Errorf("failed to delete image from S3: %w", err)
	}

	return nil
}

func (s *S3Storage) DeleteImageAdmin(ctx context.Context, imagePath string) error {
	// Admin can delete any image - no ownership check
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(imagePath),
	})
	if err != nil {
		return fmt.Errorf("failed to delete image from S3: %w", err)
	}

	return nil
}

func (s *S3Storage) GetImages(ctx context.Context, userEmail string, pageIndex, pageSize int) (*PaginatedImages, error) {
	prefix := userEmail + "/"
	
	// List objects with pagination
	result, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucket),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list S3 objects: %w", err)
	}

	var images []ImageMetadata
	startIndex := pageIndex * pageSize
	endIndex := startIndex + pageSize

	for i, object := range result.Contents {
		if i >= startIndex && i < endIndex {
			// Get object metadata
			objOutput, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
				Bucket: aws.String(s.bucket),
				Key:    object.Key,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to get S3 object metadata: %w", err)
			}

			// Extract image ID and original name from metadata or path
			imageID := objOutput.Metadata["image-id"]
			originalName := objOutput.Metadata["original-name"]
			
			// Fallback to parsing from path if metadata is not available
			if imageID == "" || originalName == "" {
				pathParts := strings.Split(filepath.Base(*object.Key), "-")
				if len(pathParts) >= 2 {
					imageID = pathParts[0]
					originalName = strings.Join(pathParts[1:], "-")
				}
			}

			// Generate URL
			imageURL, err := s.GetImageURL(ctx, userEmail, *object.Key)
			if err != nil {
				return nil, fmt.Errorf("failed to generate image URL: %w", err)
			}

			images = append(images, ImageMetadata{
				ID:          imageID,
				Name:        filepath.Base(*object.Key),
				OriginalName: originalName,
				Size:        *object.Size,
				ContentType: aws.ToString(objOutput.ContentType),
				UploadedBy:  userEmail,
				UploadedAt:  *object.LastModified,
				URL:         imageURL,
				Path:        *object.Key,
			})
		}
	}

	total := len(result.Contents)
	return &PaginatedImages{
		Images:    images,
		Total:     total,
		PageIndex: pageIndex,
		PageSize:  pageSize,
		HasMore:   total > endIndex,
	}, nil
}

func (s *S3Storage) GetAllImages(ctx context.Context, pageIndex, pageSize int) (*PaginatedImages, error) {
	// Admin can get all images - no prefix filtering
	result, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucket),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list S3 objects: %w", err)
	}

	var images []ImageMetadata
	startIndex := pageIndex * pageSize
	endIndex := startIndex + pageSize

	for i, object := range result.Contents {
		if i >= startIndex && i < endIndex {
			// Get object metadata
			objOutput, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
				Bucket: aws.String(s.bucket),
				Key:    object.Key,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to get S3 object metadata: %w", err)
			}

			// Extract image ID and original name from metadata or path
			imageID := objOutput.Metadata["image-id"]
			originalName := objOutput.Metadata["original-name"]
			uploadedBy := objOutput.Metadata["uploaded-by"]
			
			// Fallback to parsing from path if metadata is not available
			if imageID == "" || originalName == "" || uploadedBy == "" {
				pathParts := strings.Split(*object.Key, "/")
				if len(pathParts) >= 2 {
					uploadedBy = pathParts[0] // First part is user email
					fileParts := strings.Split(filepath.Base(*object.Key), "-")
					if len(fileParts) >= 2 {
						imageID = fileParts[0]
						originalName = strings.Join(fileParts[1:], "-")
					}
				}
			}

			// For admin, generate presigned URL without user check
			var imageURL string
			if uploadedBy != "" {
				presignClient := s3.NewPresignClient(s.client)
				presignResult, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
					Bucket: aws.String(s.bucket),
					Key:    object.Key,
				}, func(opts *s3.PresignOptions) {
					opts.Expires = time.Hour // URL expires in 1 hour
				})
				if err != nil {
					return nil, fmt.Errorf("failed to generate presigned S3 URL: %w", err)
				}
				imageURL = presignResult.URL
			}

			images = append(images, ImageMetadata{
				ID:          imageID,
				Name:        filepath.Base(*object.Key),
				OriginalName: originalName,
				Size:        *object.Size,
				ContentType: aws.ToString(objOutput.ContentType),
				UploadedBy:  uploadedBy,
				UploadedAt:  *object.LastModified,
				URL:         imageURL,
				Path:        *object.Key,
			})
		}
	}

	total := len(result.Contents)
	return &PaginatedImages{
		Images:    images,
		Total:     total,
		PageIndex: pageIndex,
		PageSize:  pageSize,
		HasMore:   total > endIndex,
	}, nil
}

func (s *S3Storage) GetImageURL(ctx context.Context, userEmail, imagePath string) (string, error) {
	// Verify the path belongs to the user
	if !strings.HasPrefix(imagePath, userEmail+"/") {
		return "", fmt.Errorf("unauthorized: image does not belong to user")
	}

	// For S3, we can generate a presigned URL
	presignClient := s3.NewPresignClient(s.client)
	presignResult, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(imagePath),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Hour // URL expires in 1 hour
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned S3 URL: %w", err)
	}

	return presignResult.URL, nil
}