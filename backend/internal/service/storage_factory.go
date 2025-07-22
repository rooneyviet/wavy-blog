package service

import (
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/wavy-blog/backend/internal/config"
)

type StorageFactory struct {
	config *config.Config
}

func NewStorageFactory(config *config.Config) *StorageFactory {
	return &StorageFactory{
		config: config,
	}
}

func (f *StorageFactory) CreateStorageService() (StorageService, error) {
	switch f.config.StorageType {
	case "minio":
		return NewMinioStorage(
			f.config.StorageEndpoint,
			f.config.StorageAccessKey,
			f.config.StorageSecretKey,
			f.config.StorageBucket,
			f.config.StorageUseSSL,
		)
	case "s3":
		// For AWS S3, we would need an AWS config and S3 client
		// This is a placeholder for future implementation
		// You would need to create an AWS config and S3 client first
		return nil, fmt.Errorf("S3 storage not yet implemented")
	default:
		return nil, fmt.Errorf("unsupported storage type: %s", f.config.StorageType)
	}
}

// CreateS3StorageService creates an S3 storage service with provided client
// This would be used when AWS S3 is configured
func (f *StorageFactory) CreateS3StorageService(s3Client *s3.Client) StorageService {
	return NewS3Storage(s3Client, f.config.StorageBucket, f.config.AWSRegion)
}