package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func NewErrorResponse(c *gin.Context, code int, message string, details string) {
	c.JSON(code, ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	})
}

func InternalServerError(c *gin.Context, details string) {
	NewErrorResponse(c, http.StatusInternalServerError, "An unexpected error occurred. Please try again later.", details)
}

func BadRequest(c *gin.Context, details string) {
	NewErrorResponse(c, http.StatusBadRequest, "The server cannot process the request due to a client error.", details)
}

func NotFound(c *gin.Context, resource string) {
	NewErrorResponse(c, http.StatusNotFound, "The requested resource was not found.", resource+" not found")
}

func Unauthorized(c *gin.Context, details string) {
	NewErrorResponse(c, http.StatusUnauthorized, "Authentication is required and has failed or has not yet been provided.", details)
}

func Forbidden(c *gin.Context, details string) {
	NewErrorResponse(c, http.StatusForbidden, "You do not have permission to access this resource.", details)
}

func Conflict(c *gin.Context, details string) {
	NewErrorResponse(c, http.StatusConflict, "A conflict occurred with the current state of the resource.", details)
}