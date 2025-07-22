package handlers

import (
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/wavy-blog/backend/internal/service"
)

type ImageHandler struct {
	storageService service.StorageService
}

func NewImageHandler(storageService service.StorageService) *ImageHandler {
	return &ImageHandler{
		storageService: storageService,
	}
}

type UploadImageResponse struct {
	Image *service.ImageMetadata `json:"image"`
}

type GetImagesResponse struct {
	PageIndex int                     `json:"pageIndex"`
	PageSize  int                     `json:"pageSize"`
	Total     int                     `json:"total"`
	Images    []service.ImageMetadata `json:"images"`
}

type DeleteImageInput struct {
	ImagePath string `json:"imagePath" binding:"required"`
}

// UploadImage handles single image upload
func (h *ImageHandler) UploadImage(c *gin.Context) {
	email := c.GetString("email")

	// Parse multipart form
	err := c.Request.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		BadRequest(c, "Failed to parse multipart form: "+err.Error())
		return
	}

	// Get the file from form data
	fileHeader, err := c.FormFile("image")
	if err != nil {
		BadRequest(c, "No image file provided or invalid file: "+err.Error())
		return
	}

	// Validate file type
	if !isValidImageType(fileHeader) {
		BadRequest(c, "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.")
		return
	}

	// Validate file size (10 MB max)
	if fileHeader.Size > 10<<20 {
		BadRequest(c, "File size too large. Maximum allowed size is 10 MB.")
		return
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		InternalServerError(c, "Failed to open uploaded file: "+err.Error())
		return
	}
	defer file.Close()

	// Upload to storage
	imageMetadata, err := h.storageService.UploadImage(
		c.Request.Context(),
		email,
		fileHeader.Filename,
		file,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
	)
	if err != nil {
		log.Printf("[ERROR] Failed to upload image for user '%s': %v", email, err)
		InternalServerError(c, "Failed to upload image: "+err.Error())
		return
	}

	response := UploadImageResponse{
		Image: imageMetadata,
	}

	c.JSON(http.StatusCreated, response)
}

// GetImages returns paginated list of images - admin sees all images, author sees only their own
func (h *ImageHandler) GetImages(c *gin.Context) {
	email := c.GetString("email")
	userRole := c.GetString("role")

	// Parse pagination parameters
	pageSize := 20 // default
	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if parsed, err := strconv.Atoi(pageSizeStr); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	// Parse pageIndex parameter (1-based indexing)
	pageIndex := 1 // default changed from 0 to 1 (1-based)
	if pageIndexStr := c.Query("pageIndex"); pageIndexStr != "" {
		if parsed, err := strconv.Atoi(pageIndexStr); err == nil && parsed >= 1 {
			pageIndex = parsed
		}
	}
	
	// Convert 1-based pageIndex to 0-based for storage service calls
	zeroBasedPageIndex := pageIndex - 1

	// Role-based image retrieval
	var paginatedImages *service.PaginatedImages
	var err error

	if userRole == "admin" {
		// Admin can see all images
		paginatedImages, err = h.storageService.GetAllImages(c.Request.Context(), zeroBasedPageIndex, pageSize)
		if err != nil {
			log.Printf("[ERROR] Failed to get all images for admin: %v", err)
			InternalServerError(c, "Failed to retrieve images: "+err.Error())
			return
		}
	} else {
		// Author can only see their own images
		paginatedImages, err = h.storageService.GetImages(c.Request.Context(), email, zeroBasedPageIndex, pageSize)
		if err != nil {
			log.Printf("[ERROR] Failed to get images for user '%s': %v", email, err)
			InternalServerError(c, "Failed to retrieve images: "+err.Error())
			return
		}
	}

	response := GetImagesResponse{
		PageIndex: pageIndex,  // Return 1-based pageIndex
		PageSize:  paginatedImages.PageSize,
		Total:     paginatedImages.Total,
		Images:    paginatedImages.Images,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteImage deletes a specific image - admin can delete any image, author can only delete their own
func (h *ImageHandler) DeleteImage(c *gin.Context) {
	email := c.GetString("email")
	userRole := c.GetString("role")

	var input DeleteImageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	// Role-based image deletion
	var err error
	if userRole == "admin" {
		// Admin can delete any image
		err = h.storageService.DeleteImageAdmin(c.Request.Context(), input.ImagePath)
		if err != nil {
			log.Printf("[ERROR] Failed to delete image '%s' as admin: %v", input.ImagePath, err)
			InternalServerError(c, "Failed to delete image: "+err.Error())
			return
		}
	} else {
		// Author can only delete their own images
		err = h.storageService.DeleteImage(c.Request.Context(), email, input.ImagePath)
		if err != nil {
			log.Printf("[ERROR] Failed to delete image '%s' for user '%s': %v", input.ImagePath, email, err)
			if strings.Contains(err.Error(), "unauthorized") {
				Forbidden(c, "You are not authorized to delete this image.")
				return
			}
			InternalServerError(c, "Failed to delete image: "+err.Error())
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully."})
}

// GetImageURL returns a presigned URL for accessing an image
func (h *ImageHandler) GetImageURL(c *gin.Context) {
	email := c.GetString("email")

	imagePath := c.Query("imagePath")
	if imagePath == "" {
		BadRequest(c, "imagePath query parameter is required")
		return
	}

	// Get presigned URL
	imageURL, err := h.storageService.GetImageURL(c.Request.Context(), email, imagePath)
	if err != nil {
		log.Printf("[ERROR] Failed to get image URL for '%s' for user '%s': %v", imagePath, email, err)
		if strings.Contains(err.Error(), "unauthorized") {
			Forbidden(c, "You are not authorized to access this image.")
			return
		}
		InternalServerError(c, "Failed to get image URL: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": imageURL})
}

// isValidImageType checks if the uploaded file is a valid image type
func isValidImageType(fileHeader *multipart.FileHeader) bool {
	// Check file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	validExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !validExtensions[ext] {
		return false
	}

	// Check MIME type
	contentType := fileHeader.Header.Get("Content-Type")
	validMimeTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	return validMimeTypes[contentType]
}