# AGENTS.md - Development Commands & Guidelines

## Build/Test Commands

- **Start dev environment:** `docker compose -f docker-compose.dev.yml up --build`
- **Frontend lint:** `docker compose -f docker-compose.dev.yml run --rm frontend yarn lint`
- **Frontend build:** `docker compose -f docker-compose.dev.yml run --rm frontend yarn build`
- **Frontend install package:** `docker compose -f docker-compose.dev.yml run --rm frontend add {package_name}`
- **Run single API test:** `bru run "Login.bru" --env demo`
- **Run test sequence:** `bru run "Login.bru" "CreatePost.bru" --env demo`
- **Go commands:** All Go commands run in Docker: Example:`docker compose -f docker-compose.dev.yml build api-backend`
- **DynamoDB commands:** `docker exec localstack awslocal dynamodb [command]`
- **Scan the `WavyBlog` table:** `docker exec localstack awslocal dynamodb scan --table-name WavyBlog`
- **Delete the `WavyBlog` table:** `docker exec localstack awslocal dynamodb delete-table --table-name WavyBlog`
- **Shadcn add new components:** `cd frontend && npx shadcn@latest add {component_name}`

## Code Style Guidelines

- **TypeScript:** Use strict typing, avoid `any`, prefer `unknown`
- **Components:** PascalCase files/exports, functional components with hooks. Use shadcn, or create custom components.
- **Variables/Functions:** camelCase, constants UPPER_SNAKE_CASE
- **Imports:** Absolute paths with `@/` prefix, group by external/internal
- **Error Handling:** Explicit error handling, custom error types for Go
- **Architecture:** Clean Architecture layers - View/UseCase/Domain/Repository/Adapter
- **State:** Zustand for global state, local state for component-specific
- **Data Fetching:** Server-side prefetching with TanStack Query, Server Actions for mutations. Never use client-side API fetch calls.
- **Styling:** Tailwind CSS only, no CSS modules
- **Validation:** Zod form and input validation.

## 1. Core Principles

- **Separation of Concerns (SoC):**
- **Dependency Inversion Principle (DIP):**
- **Single Responsibility Principle (SRP):**
- **Don't Repeat Yourself (DRY):**

## Documentation Requirements

- Update `documents/api_specs.md` for API changes
- Update `documents/dynamodb_structure.md` for database changes
- Update Bruno `.bru` files for new/modified endpoints with comprehensive test coverage
