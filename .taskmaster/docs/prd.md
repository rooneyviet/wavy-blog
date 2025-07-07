# Product Requirements Document: Wavy Blog Backend

## 1. Overview

This document outlines the requirements for the backend implementation of the Wavy Blog application. The backend will be a Go-based service using the Gin framework, running entirely within a Docker environment. It will provide a RESTful API for the existing frontend to consume.

**IMPORTANT NOTE:** There is no `Go` installation on the host machine. All development, building, and running of the backend service **MUST** be done through Docker Compose, using the `docker compose -f docker-compose.dev.yml up --build` command.

## 2. Services

The `docker-compose.dev.yml` file will be updated to include two new services:

1.  **`api-backend`**: The main Go/Gin application service.
2.  **`localstack`**: A local cloud service emulator for AWS services, specifically for DynamoDB.

## 3. Backend Folder Structure

A new `backend` directory will be created with the following structure:

```
backend/
├── cmd/
│   └── api/
│       └── main.go         # Main application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/       # HTTP handlers for API routes
│   │   │   ├── posts.go
│   │   │   └── users.go
│   │   └── router.go       # Gin router setup
│   ├── config/
│   │   └── config.go       # Configuration management
│   ├── domain/             # Core domain models (structs)
│   │   ├── post.go
│   │   └── user.go
│   └── repository/
│       ├── dynamodb/       # DynamoDB implementation
│       │   └── dbrepo.go
│       └── repository.go   # Repository interface
├── Dockerfile.dev          # Dockerfile for development
└── .env.dev                # Environment variables for development
```

## 4. Database Design (DynamoDB Single-Table)

We will use a single-table design in DynamoDB to store all application data.

- **Table Name**: `WavyBlog`
- **Primary Key**:
  - Partition Key (PK): `string`
  - Sort Key (SK): `string`

### Entity Schemas:

**User**

- **PK**: `USER#<UserID>`
- **SK**: `METADATA#<UserID>`
- **Attributes**: `UserID`, `Username`, `Email`, `PasswordHash`, `CreatedAt`, `UpdatedAt`

**Post**

- **PK**: `POST#<PostID>`
- **SK**: `METADATA#<PostID>`
- **Attributes**: `PostID`, `Title`, `Content`, `AuthorID`, `Category`, `ThumbnailURL`, `CreatedAt`, `UpdatedAt`

**Post by User (for querying posts by a specific user)**

- **PK**: `USER#<UserID>`
- **SK**: `POST#<PostID>`
- **Attributes**: (Mirrors Post attributes for efficient querying)

**Post by Category (for querying posts by category)**

- **PK**: `CATEGORY#<CategoryName>`
- **SK**: `POST#<PostID>`
- **Attributes**: (Mirrors Post attributes for efficient querying)

## 5. API Endpoints

The backend will expose the following RESTful API endpoints under the `/api` prefix.

### User Management

- `POST /users/register`: Register a new user.
- `POST /users/login`: Authenticate a user and return a token.
- `GET /users`: Get a list of all users (Admin).
- `GET /users/:id`: Get a single user by ID (Admin).

### Post Management

- `POST /posts`: Create a new blog post.
- `GET /posts`: Get a list of all blog posts (paginated).
- `GET /posts/:id`: Get a single post by ID.
- `PUT /posts/:id`: Update a post.
- `DELETE /posts/:id`: Delete a post.

### Category Management

- `GET /categories`: Get a list of all unique post categories.

## 6. High-Level Implementation Plan

1.  **Task 1: Docker Setup:**
    - Update `docker-compose.dev.yml` to include `api-backend` and `localstack` services.
    - Create `backend/Dockerfile.dev` for the Go service.
    - Create `backend/.env.dev` with necessary environment variables.
2.  **Task 2: Backend Scaffolding:**
    - Create the folder structure inside the `backend` directory as defined above.
    - Create the `main.go` entry point.
3.  **Task 3: Configuration & Dependencies:**
    - Implement configuration loading in `internal/config/config.go`.
    - Set up Go modules (`go mod init`) and add dependencies (Gin, AWS SDK for Go v2).
4.  **Task 4: Domain Models & Repository:**
    - Define the `User` and `Post` structs in the `internal/domain/` directory.
    - Define the repository interface in `internal/repository/repository.go`.
5.  **Task 5: DynamoDB Implementation:**
    - Implement the repository interface for DynamoDB in `internal/repository/dynamodb/dbrepo.go`.
    - Include logic to connect to LocalStack's DynamoDB instance.
    - Implement a utility to create the `WavyBlog` table on startup if it doesn't exist.
6.  **Task 6: API Router & Handlers:**
    - Set up the Gin router in `internal/api/router.go`.
    - Implement the HTTP handlers for all defined endpoints in `internal/api/handlers/`.
7.  **Task 7: Frontend Integration:**
    - Ensure the frontend's `API_HOST` environment variable correctly points to the new backend service.
    - Verify that the frontend can successfully make requests to the backend and handle the responses.
