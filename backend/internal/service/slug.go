package service

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)
	hyphenRegex          = regexp.MustCompile(`-{2,}`)
)

// Slugify creates a URL-friendly slug from a string.
func Slugify(s string) string {
	slug := strings.ToLower(s)
	slug = nonAlphanumericRegex.ReplaceAllString(slug, "-")
	slug = hyphenRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

// GenerateUniqueSlug checks for the existence of a base slug and appends a counter
// if it already exists, returning a unique slug.
func GenerateUniqueSlug(baseSlug string, slugExists func(string) (bool, error)) (string, error) {
	exists, err := slugExists(baseSlug)
	if err != nil {
		return "", fmt.Errorf("failed to check if slug '%s' exists: %w", baseSlug, err)
	}
	if !exists {
		return baseSlug, nil
	}

	counter := 1
	for {
		newSlug := fmt.Sprintf("%s-%d", baseSlug, counter)
		exists, err := slugExists(newSlug)
		if err != nil {
			return "", fmt.Errorf("failed to check if slug '%s' exists: %w", newSlug, err)
		}
		if !exists {
			return newSlug, nil
		}
		counter++
	}
}