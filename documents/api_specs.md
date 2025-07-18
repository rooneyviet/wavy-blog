# Wavy Blog API Specifications

This document provides comprehensive specifications for all API endpoints in the Wavy Blog application.

## Base URL

All API endpoints are prefixed with `/api`

## Authentication

- **Bearer Token**: Protected endpoints require `Authorization: Bearer <access_token>` header
- **Refresh Token**: Stored as HTTP-only cookie named `refresh_token`
- **User Roles**: `"author"` (default) and `"admin"`

## User Management APIs

### User Registration

| Field                | Value                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Method**           | POST                                                                                 |
| **URL**              | `/api/users/register`                                                                |
| **Authentication**   | Not required                                                                         |
| **Request Body**     | `{"username": "string", "email": "string", "password": "string"}`                    |
| **Validation**       | username: required, email: required + valid format, password: required + min 8 chars |
| **Success Response** | 201: `{"message": "User account created successfully."}`                             |
| **Error Responses**  | 400: Invalid payload, 409: Username/email exists, 500: Server error                  |

### User Login

| Field                   | Value                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| **Method**              | POST                                                              |
| **URL**                 | `/api/users/login`                                                |
| **Authentication**      | Not required                                                      |
| **Request Body**        | `{"email": "string", "password": "string"}`                       |
| **Success Response**    | 200: `{"access_token": "string", "user": {...}}`                  |
| **Additional Behavior** | Sets HTTP-only `refresh_token` cookie                             |
| **Error Responses**     | 400: Invalid payload, 401: Invalid credentials, 500: Server error |

### Refresh Access Token

| Field                   | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| **Method**              | POST                                                          |
| **URL**                 | `/api/users/refresh`                                          |
| **Authentication**      | Requires `refresh_token` cookie                               |
| **Request Body**        | None                                                          |
| **Success Response**    | 200: `{"access_token": "string", "user": {...}}`              |
| **Additional Behavior** | Rotates refresh token, sets new cookie                        |
| **Error Responses**     | 401: Missing/invalid/expired refresh token, 500: Server error |

### Get User by Username

| Field                | Value                                                           |
| -------------------- | --------------------------------------------------------------- |
| **Method**           | GET                                                             |
| **URL**              | `/api/users/:username`                                          |
| **Authentication**   | Required (Bearer token)                                         |
| **Path Parameters**  | `username`: string                                              |
| **Success Response** | 200: User object with userID, username, email, role, timestamps |
| **Error Responses**  | 401: Unauthorized, 404: User not found                          |

### Update User

| Field                | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Method**           | PUT                                                                                        |
| **URL**              | `/api/users/:username`                                                                     |
| **Authentication**   | Required (Bearer token)                                                                    |
| **Authorization**    | User can update own profile, admin can update any user                                     |
| **Path Parameters**  | `username`: string                                                                         |
| **Request Body**     | `{"username": "string?", "email": "string?", "role": "string?"}`                           |
| **Success Response** | 200: `{"message": "User account updated successfully."}`                                   |
| **Error Responses**  | 400: Invalid payload, 401: Unauthorized, 403: Forbidden, 404: Not found, 500: Server error |

### Delete User

| Field                | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| **Method**           | DELETE                                                   |
| **URL**              | `/api/users/:username`                                   |
| **Authentication**   | Required (Bearer token)                                  |
| **Authorization**    | User can delete own account, admin can delete any user   |
| **Path Parameters**  | `username`: string                                       |
| **Success Response** | 200: `{"message": "User account deleted successfully."}` |
| **Error Responses**  | 401: Unauthorized, 403: Forbidden, 500: Server error     |

### Get All Users (Admin Only)

| Field                | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Method**           | GET                                                              |
| **URL**              | `/api/users`                                                     |
| **Authentication**   | Required (Bearer token)                                          |
| **Authorization**    | Admin role required                                              |
| **Success Response** | 200: Array of user objects                                       |
| **Error Responses**  | 401: Unauthorized, 403: Forbidden (not admin), 500: Server error |

## Post Management APIs

### Create Post

| Field                | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Method**           | POST                                                                                        |
| **URL**              | `/api/posts`                                                                                |
| **Authentication**   | Required (Bearer token)                                                                     |
| **Request Body**     | `{"title": "string", "content": "string", "category": "string", "thumbnailURL": "string?"}` |
| **Validation**       | title: required, content: required, category: required                                      |
| **Success Response** | 201: Post object with auto-generated slug                                                   |
| **Error Responses**  | 400: Invalid payload, 401: Unauthorized, 500: Server error                                  |

### Get Post by Slug

| Field                | Value                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Method**           | GET                                                                                      |
| **URL**              | `/api/posts/:slug`                                                                       |
| **Authentication**   | Not required                                                                             |
| **Path Parameters**  | `slug`: string                                                                           |
| **Success Response** | 200: Post object with slug, title, content, authorID, category, thumbnailURL, timestamps |
| **Error Responses**  | 404: Post not found                                                                      |

### Get All Posts

| Field                | Value                                        |
| -------------------- | -------------------------------------------- |
| **Method**           | GET                                          |
| **URL**              | `/api/posts`                                 |
| **Authentication**   | Not required                                 |
| **Query Parameters** | `postName`: string (optional, for filtering) |
| **Success Response** | 200: Array of post objects                   |
| **Error Responses**  | 500: Server error                            |

### Update Post

| Field                | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Method**           | PUT                                                                                         |
| **URL**              | `/api/posts/:slug`                                                                          |
| **Authentication**   | Required (Bearer token)                                                                     |
| **Authorization**    | Author can update own posts, admin can update any post                                      |
| **Path Parameters**  | `slug`: string                                                                              |
| **Request Body**     | `{"title": "string", "content": "string", "category": "string", "thumbnailURL": "string?"}` |
| **Success Response** | 200: Updated post object (slug may change if title changed)                                 |
| **Error Responses**  | 400: Invalid payload, 401: Unauthorized, 403: Forbidden, 404: Not found, 500: Server error  |

### Delete Post

| Field                | Value                                                                |
| -------------------- | -------------------------------------------------------------------- |
| **Method**           | DELETE                                                               |
| **URL**              | `/api/posts/:slug`                                                   |
| **Authentication**   | Required (Bearer token)                                              |
| **Authorization**    | Author can delete own posts, admin can delete any post               |
| **Path Parameters**  | `slug`: string                                                       |
| **Success Response** | 200: `{"message": "Post deleted successfully."}`                     |
| **Error Responses**  | 401: Unauthorized, 403: Forbidden, 404: Not found, 500: Server error |

## Category Management APIs

### Create Category (Admin Only)

| Field                | Value                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Method**           | POST                                                                                             |
| **URL**              | `/api/categories`                                                                                |
| **Authentication**   | Required (Bearer token)                                                                          |
| **Authorization**    | Admin role required                                                                              |
| **Request Body**     | `{"name": "string"}`                                                                             |
| **Validation**       | name: required                                                                                   |
| **Success Response** | 201: Category object with auto-generated slug                                                    |
| **Error Responses**  | 400: Invalid payload, 401: Unauthorized, 403: Forbidden, 409: Category exists, 500: Server error |

### Get All Categories

| Field                | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| **Method**           | GET                                                        |
| **URL**              | `/api/categories`                                          |
| **Authentication**   | Not required                                               |
| **Success Response** | 200: Array of category objects with slug, name, timestamps |
| **Error Responses**  | 500: Server error                                          |

### Get Posts by Category

| Field                | Value                                                |
| -------------------- | ---------------------------------------------------- |
| **Method**           | GET                                                  |
| **URL**              | `/api/categories/:categoryName/posts`                |
| **Authentication**   | Not required                                         |
| **Path Parameters**  | `categoryName`: string                               |
| **Success Response** | 200: Array of post objects in the specified category |
| **Error Responses**  | 500: Server error                                    |

## Response Schemas

### User Object

```json
{
  "userID": "string",
  "username": "string",
  "email": "string",
  "role": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Post Object

```json
{
  "slug": "string",
  "title": "string",
  "content": "string",
  "authorID": "string",
  "category": "string",
  "thumbnailURL": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Category Object

```json
{
  "slug": "string",
  "name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Error Response Format

```json
{
  "code": "number",
  "message": "string",
  "details": "string"
}
```

## Data Types & Validation Rules

| Field Type    | Description             | Validation                               |
| ------------- | ----------------------- | ---------------------------------------- |
| **Email**     | Valid email format      | Standard email format validation         |
| **Password**  | User password           | Minimum 8 characters, hashed with bcrypt |
| **Username**  | User identifier         | Required, unique                         |
| **Slug**      | URL-friendly identifier | Auto-generated from title/name           |
| **Timestamp** | Date/time               | ISO 8601 format strings                  |
| **UUID**      | User identifier         | String format                            |
| **Role**      | User permission level   | "author" (default) or "admin"            |

## Authorization Rules

| Rule              | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| **Self-Access**   | Users can access and modify their own resources              |
| **Admin Access**  | Admins can access and modify any resources                   |
| **Admin-Only**    | Some endpoints (like creating categories) require admin role |
| **Public Access** | Reading posts and categories doesn't require authentication  |

## HTTP Status Codes

| Code    | Description           | Common Usage                                             |
| ------- | --------------------- | -------------------------------------------------------- |
| **200** | OK                    | Successful GET, PUT, DELETE operations                   |
| **201** | Created               | Successful POST operations                               |
| **400** | Bad Request           | Invalid request payload or validation errors             |
| **401** | Unauthorized          | Missing or invalid authentication token                  |
| **403** | Forbidden             | Valid token but insufficient permissions                 |
| **404** | Not Found             | Requested resource doesn't exist                         |
| **409** | Conflict              | Resource already exists (username, email, category name) |
| **500** | Internal Server Error | Server-side errors                                       |
