# Frontend-Backend Integration Todo List

This document tracks all the issues and gaps identified between the frontend and backend that need to be resolved for proper integration.

## 1. Data Structure Mismatches

### User/Author Data Alignment
- [ ] **Fix Author vs User data structure mismatch**
  - Frontend expects: `Author { name, slug, imageUrl }`
  - Backend provides: `User { userID, username, email, role, createdAt, updatedAt }`
  - Need to align field names and add missing fields

- [ ] **Add user profile image support**
  - Backend User object missing `imageUrl/profileImage` field
  - Frontend displays author images but backend has no such data

### Post Data Structure Alignment
- [ ] **Align Post data structure between frontend and backend**
  - Frontend: `{ id, author: Author, publishDate, excerpt, imageUrl, readTimeMinutes }`
  - Backend: `{ slug, authorID, createdAt, updatedAt, thumbnailURL }`
  - Fix field name inconsistencies

- [ ] **Add missing Post fields to backend**
  - Add `excerpt` field for post summaries
  - Add `readTimeMinutes` calculation or field
  - Ensure `content` field is properly handled

- [ ] **Fix Post identifier inconsistency**
  - Frontend uses `id`, backend uses `slug` as primary identifier
  - Standardize on one approach

### Category Data Structure
- [ ] **Align Category data structure**
  - Frontend expects: `{ id, name }`
  - Backend provides: `{ slug, name, created_at, updated_at }`
  - Standardize identifier field

## 2. Missing Critical APIs

### Image Upload System
- [ ] **Implement image upload API for S3 storage**
  - Backend API endpoint for file uploads
  - S3 integration for storing thumbnails and user profile images
  - Return proper URLs for uploaded images

- [ ] **Connect frontend ThumbnailUpload to backend**
  - Currently frontend handles File objects but backend expects URL strings
  - Implement upload flow: File ’ API ’ S3 ’ URL ’ Post creation

### User Registration
- [ ] **Create user registration page in frontend**
  - Currently has login page but no registration
  - Backend has registration API but no frontend interface

## 3. Authentication Implementation

### JWT Token Handling
- [ ] **Implement JWT token management in frontend**
  - Store and manage access tokens
  - Handle token refresh logic
  - Automatic token rotation

- [ ] **Add authentication context/store**
  - User state management
  - Login/logout functionality
  - Current user information

- [ ] **Connect login form to authentication API**
  - Currently form doesn't submit to backend
  - Handle login success/error states
  - Redirect after successful login

### Protected Routes
- [ ] **Implement authentication guards**
  - Protect admin routes
  - Check user roles before allowing access
  - Redirect unauthorized users

- [ ] **Add Authorization headers to API calls**
  - All protected endpoints need Bearer token
  - Implement automatic header injection

## 4. Admin Functionality Integration

### CRUD Operations
- [ ] **Connect admin posts table to real API**
  - Replace dummy data with API calls
  - Implement real delete operations
  - Add loading and error states

- [ ] **Connect admin users table to real API**
  - Replace dummy data with API calls
  - Implement user management operations

- [ ] **Implement post creation form submission**
  - Connect add post form to POST /api/posts
  - Handle form validation and submission

- [ ] **Implement user creation form submission**
  - Connect add user form to POST /api/users/register
  - Handle admin user creation

### Role-Based Access Control
- [ ] **Implement role checking in admin interface**
  - Check user role before showing admin features
  - Hide/show features based on permissions
  - Backend requires admin role for some operations

## 5. Content and Display Issues

### Post Content Management
- [ ] **Implement post excerpt generation**
  - Backend should generate or store post excerpts
  - Frontend displays excerpts but backend doesn't provide them

- [ ] **Add read time calculation**
  - Backend should calculate estimated read time
  - Or frontend should calculate based on content length

- [ ] **Create individual post view page**
  - `/blog/{slug}` route doesn't exist
  - Frontend links to these pages but they're missing

### Author Information Enhancement
- [ ] **Expand User model for author profiles**
  - Add bio, social links, profile image fields
  - Support author profile pages
  - Backend currently minimal user data

## 6. Category System Integration

### Dynamic Category Management
- [ ] **Replace hardcoded categories with API data**
  - Frontend has hardcoded categories in store
  - Should load from GET /api/categories

- [ ] **Implement category management in admin**
  - Backend has admin-only category creation
  - Frontend doesn't implement this functionality

- [ ] **Add category filtering and display**
  - Support filtering posts by category
  - Display category information properly

## 7. Missing Pages and Routes

### Essential Missing Pages
- [ ] **Create individual post view page (`/blog/{slug}`)**
  - Display full post content
  - Show author information
  - Handle non-existent posts

- [ ] **Create author profile pages (`/author/{slug}`)**
  - Display author information
  - List author's posts
  - Handle author bio and social links

- [ ] **Create post edit pages (`/admin/posts/edit/{id}`)**
  - Load existing post data
  - Submit updates to PUT /api/posts/{slug}

- [ ] **Create user edit pages (`/admin/users/edit/{id}`)**
  - Load existing user data
  - Submit updates to PUT /api/users/{username}

## 8. API Integration Layer

### Replace All Dummy Data
- [ ] **Create API client infrastructure**
  - HTTP client with base configuration
  - Error handling middleware
  - Request/response interceptors

- [ ] **Replace homepage dummy data with API calls**
  - Load posts from GET /api/posts
  - Load categories for filtering
  - Handle loading and error states

- [ ] **Implement data fetching hooks**
  - usePost, usePosts, useUsers, useCategories
  - Handle loading, error, and success states
  - Implement caching where appropriate

### Error Handling and Loading States
- [ ] **Add comprehensive error handling**
  - Network errors
  - API errors (400, 401, 403, 404, 500)
  - User-friendly error messages

- [ ] **Implement loading states throughout app**
  - Skeleton loaders
  - Loading spinners
  - Progressive loading

## 9. Data Validation and Type Safety

### TypeScript Interface Alignment
- [ ] **Create backend-aligned TypeScript interfaces**
  - Match exactly with backend API schemas
  - Update all existing type usage

- [ ] **Add API response type validation**
  - Runtime validation of API responses
  - Handle unexpected data structures

## 10. Testing and Quality Assurance

### API Integration Testing
- [ ] **Test all API endpoints with frontend**
  - Verify request/response format compatibility
  - Test error scenarios
  - Validate authentication flows

- [ ] **End-to-end functionality testing**
  - Complete user workflows
  - Admin operations
  - Error recovery

---

## Priority Legend
- =4 **High Priority**: Critical for basic functionality
- =á **Medium Priority**: Important for full feature set
- =â **Low Priority**: Nice to have or optimization

## Notes
- Check off items as they are completed: `- [x]`
- Add implementation notes or references as needed
- This list may be updated as new issues are discovered during implementation