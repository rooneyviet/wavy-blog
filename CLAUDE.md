# Development Environment Guide

This guide covers essential commands and procedures for the development environment.

## Docker Usage

All services are managed via Docker Compose. Refer to the [`docker-compose.dev.yml`](docker-compose.dev.yml:1) for detailed service configurations.

### General Commands

- **Run the application:**
  ```bash
  docker compose -f docker-compose.dev.yml up --build
  ```

### Frontend Commands

- **Install dependencies:**
  ```bash
  docker compose -f docker-compose.dev.yml run --rm frontend yarn install
  ```
- **Add a new package:**
  ```bash
  docker compose -f docker-compose.dev.yml run --rm frontend yarn add {package_name}
  ```

bru run Login.bru --env demo

### Backend Commands (DynamoDB)

- **Run DynamoDB commands via `awslocal`:**
  ```bash
  docker exec localstack awslocal dynamodb [command]
  ```
- **Examples:**
  - Scan the `WavyBlog` table:
    ```bash
    docker exec localstack awslocal dynamodb scan --table-name WavyBlog
    ```
  - Delete the `WavyBlog` table:
    ```bash
    docker exec localstack awslocal dynamodb delete-table --table-name WavyBlog
    ```

### Port Mapping

- **Backend API:** `http://localhost:8010`
- **Frontend App:** `http://localhost:3020`

## Debugging Workflow

When an error is reported, follow this systematic approach:

1.  **Isolate the Issue:** Review the provided error message and check the related code to understand the context.
2.  **Gather Information:** Use various debugging techniques to get more insight. This may include:
    - Adding `console.log` or `fmt.Println` statements.
    - Using a debugger.
    - Running specific commands to check the state of the system.
3.  **Analyze Findings:** Examine the debug output to identify the root cause of the problem.
4.  **Propose a Solution:** Formulate a clear solution to fix the issue.
5.  **Implement the Fix:** Once the proposed solution is approved, apply the necessary code changes.

**IMPORTANT:** Focus exclusively on fixing the reported error. Do not address unrelated issues or refactor code outside the scope of the bug.

---

# NextJS Style Guide and Clean Architecture Principles

This guide combines general React best practices with Clean Architecture principles to help build robust, scalable, and maintainable applications.

## 1. Core Principles

- **Separation of Concerns (SoC):**
  - Clearly divide responsibilities between different parts of your application (UI, state management, business logic, data fetching).
  - Strive for components and modules that do one thing well.
- **Dependency Inversion Principle (DIP):**
  - High-level modules (e.g., business logic) should not depend on low-level modules (e.g., specific data fetching libraries). Both should depend on abstractions (interfaces/types).
  - This promotes loose coupling and testability.
- **Single Responsibility Principle (SRP):**
  - Applied to components, functions, and modules. Each should have only one reason to change.
- **Don't Repeat Yourself (DRY):**
  - Avoid code duplication by abstracting common logic into reusable functions, hooks, or components.

## 2. Application Architecture (Inspired by Clean Architecture)

Structure your application into logical layers to manage complexity and improve maintainability.

### 2.1. View Layer (Presentation)

- **Purpose:** Responsible for rendering the UI and handling user interactions.
- **Characteristics:**
  - Contains React components (functional components with Hooks are preferred).
  - Components should be "dumb" or "presentational" as much as possible, receiving data and callbacks via props.
  - Focus on how things look and feel.
  - Minimal business logic.
- **Example:**

  ```tsx
  // src/components/User/UserProfile.tsx
  interface UserProfileProps {
    name: string;
    email: string;
    onEdit: () => void;
  }

  const UserProfile: React.FC<UserProfileProps> = ({ name, email, onEdit }) => (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
      <button onClick={onEdit}>Edit Profile</button>
    </div>
  );

  export default UserProfile;
  ```

### 2.2. UseCase Layer (Application Business Logic)

- **Purpose:** Orchestrates the application's specific business rules and workflows. Connects the View Layer to the Domain/Repository Layers.
- **Characteristics:**
  - Contains application-specific logic (e.g., what happens when a user submits a form).
  - May transform data from repositories into a format suitable for the View Layer (ViewModels).
  - Should be independent of UI frameworks.
  - Often implemented as functions or classes.
- **Example:**

  ```typescript
  // src/usecases/User/fetchUserProfileUseCase.ts
  import { userRepository } from "@/repositories/UserRepository"; // Depends on abstraction
  import { UserProfileViewModel } from "@/viewmodels/UserProfileViewModel";

  export const fetchUserProfileUseCase = async (
    userId: string
  ): Promise<UserProfileViewModel | null> => {
    const user = await userRepository.getUserById(userId);
    if (!user) return null;
    return {
      id: user.id,
      displayName: `${user.firstName} ${user.lastName}`,
      emailAddress: user.email,
      // ... other view-specific transformations
    };
  };
  ```

### 2.3. Domain Layer / Services (Core Business Logic & Entities)

- **Purpose:** Contains enterprise-wide business logic and business objects (entities). This logic is independent of any application-specific behavior.
- **Characteristics:**
  - Pure business rules, calculations, validations.
  - Should have no dependencies on UI, databases, or external frameworks.
  - Entities represent core business concepts.
- **Example:**

  ```typescript
  // src/domain/services/OrderService.ts
  import { Order, OrderItem } from "@/domain/entities/Order";

  export class OrderService {
    static calculateTotal(order: Order): number {
      return order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    static canCancelOrder(order: Order): boolean {
      return order.status === "PENDING";
    }
  }
  ```

### 2.4. Repository Layer (Data Abstraction)

- **Purpose:** Abstracts data access logic. Provides a clean API for UseCases to interact with data sources without knowing the underlying implementation (e.g., REST API, localStorage, GraphQL).
- **Characteristics:**
  - Defines interfaces for data operations (CRUD).
  - Implementations (Adapters) handle the actual data fetching/storage.
- **Example (Interface):**

  ```typescript
  // src/repositories/UserRepository.ts
  import { User } from "@/domain/entities/User";

  export interface IUserRepository {
    getUserById(id: string): Promise<User | null>;
    saveUser(user: User): Promise<void>;
  }
  ```

### 2.5. Adapter Layer (Data Implementation)

- **Purpose:** Concrete implementations of Repository interfaces. Interacts with external systems like databases, APIs, etc.
- **Characteristics:**
  - Translates data between the format used by the external system and the domain entities.
- **Example (Implementation):**

  ```typescript
  // src/adapters/UserApiAdapter.ts
  import { IUserRepository } from "@/repositories/UserRepository";
  import { User } from "@/domain/entities/User";
  import apiClient from "./apiClient"; // Your HTTP client instance

  export class UserApiAdapter implements IUserRepository {
    async getUserById(id: string): Promise<User | null> {
      const response = await apiClient.get(`/users/${id}`);
      if (!response.data) return null;
      // Map API response to User domain entity
      return {
        id: response.data.id,
        firstName: response.data.first_name /* ...other fields */,
      };
    }

    async saveUser(user: User): Promise<void> {
      // Map User domain entity to API request format
      await apiClient.post("/users", {
        first_name: user.firstName /* ...other fields */,
      });
    }
  }
  // Dependency injection would typically provide this instance
  // For example, in a DI container setup:
  // container.register('IUserRepository', { useClass: UserApiAdapter });
  // export const userRepository: IUserRepository = container.resolve('IUserRepository');
  // Or a simpler manual instantiation for this example:
  export const userRepository: IUserRepository = new UserApiAdapter();
  ```

## 3. Component Design and Patterns

### 3.1. Functional Components and Hooks

- **Prefer Functional Components:** Use functional components with Hooks over class components for conciseness and easier logic reuse.
- **Custom Hooks:** Extract component logic into reusable custom Hooks (`useMyLogic()`). This is key for:
  - Separating stateful logic from rendering.
  - Sharing logic between components.
  - Improving testability.
  - Example: `useFetch` for data fetching.

### 3.2. Container vs. Presentational Components (Conceptual)

- While Clean Architecture layers provide a more formal separation, the concept is still useful:
  - **Presentational Components:** Focus on UI. Receive data and callbacks via props. (Belongs to View Layer)
  - **Container Components (or Hook-driven components):** Manage state, fetch data (often via UseCases or custom Hooks), and pass data down to presentational components. (Connects View Layer to UseCase Layer)

### 3.3. Higher-Order Components (HOCs) & Render Props

- **HOCs:** Functions that take a component and return a new component with enhanced props/behavior. Use judiciously, as Hooks often provide a more straightforward solution.
- **Render Props:** Components that take a function prop to share logic by rendering what the function returns. Hooks have largely superseded this pattern for many use cases.

## 4. State Management

- **Local State (`useState`, `useReducer`, `useMemo`):** Use for smaller-component-specific state that does not need to be shared across many components.
- **Zustand State:** Use Zustand for generatal screen state management that connects many components.

## 5. File Structure and Naming Conventions

### 5.1. Feature-First or Layer-First?

- **Feature-First (Recommended for Scalability):** Organize files by feature/module, then by layer within each feature.
  ```
  src/
    features/
      UserProfile/
        components/       # View Layer (Presentational Components)
          UserProfileDisplay.tsx
          EditProfileForm.tsx
        hooks/            # Custom hooks for this feature
          useUserProfile.ts
        usecases/         # UseCase Layer
          updateUserProfileUseCase.ts
        viewmodels/       # ViewModels specific to this feature
          UserProfileViewModel.ts
        index.ts          # Barrel file for the feature
      OrderManagement/
        # ... similar structure
    common/               # Shared components, hooks, utils
      components/
      hooks/
    domain/
      entities/
        User.ts
        Order.ts
      services/
        AuthService.ts
    repositories/         # Repository interfaces
      IUserRepository.ts
      IOrderRepository.ts
    adapters/             # Repository implementations
      UserApiAdapter.ts
      OrderApiAdapter.ts
    config/
    lib/                  # General utility functions, helpers
    App.tsx
    index.tsx
  ```
- **Layer-First:** Group files by their architectural layer. Can be simpler for smaller projects but may become harder to navigate as the project grows.
  ```
  src/
    components/  # View Layer
    pages/       # View Layer (often route components)
    hooks/       # Custom Hooks (can be feature-specific or common)
    usecases/    # UseCase Layer
    services/    # Domain Services
    repositories/# Repository Interfaces & Adapters (or separate adapters)
    domain/      # Domain Entities
    # ...
  ```

### 5.2. Naming Conventions

- **Components, HOCs, Hooks (custom):** `PascalCase` (e.g., `UserProfile.tsx`, `withAuth.tsx`, `useFormInput.ts`)
- **Files:** Match the default export name (e.g., `UserProfile.tsx` exports `UserProfile`).
- **Folders:** `camelCase` or `kebab-case` for features/modules (e.g., `userProfile` or `user-profile`). `PascalCase` if a folder directly represents a major component.
- **Functions (non-component), Variables:** `camelCase` (e.g., `fetchData`, `userName`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_USERS`)
- **Interfaces/Types (TypeScript):** `PascalCase` (e.g., `interface IUserProps`, `type UserId = string;`)
- **CSS Modules:** `ComponentName.module.css` (e.g., `UserProfile.module.css`)
- **Test Files:** `ComponentName.test.tsx` or `fileName.spec.ts`

## 6. Performance Optimization

- **Code Splitting:** Use `React.lazy()` and `Suspense` to split code by routes or features, improving initial load time.
- **Memoization:** Use `React.memo` for components, `useMemo` for expensive calculations, and `useCallback` for functions passed as props to prevent unnecessary re-renders.
- **Lazy Loading Images/Assets:** Defer loading of off-screen or non-critical assets.
- **Virtualization:** For long lists, use libraries like `react-window` or `react-virtualized`.
- **Zustand State:** Use Zustand state management to reduce re-renders and improve performance.

## 7. Styling

- **Tailwind CSS:** Always use Tailwind.

## 8. Typing (TypeScript)

- **TypeScript:** Strongly recommended for type safety, better autocompletion, and refactoring confidence.
- **Define Props and State:** Clearly type component props and state.
- **Utility Types:** Leverage TypeScript's utility types (`Partial`, `Pick`, `Omit`, etc.).
- **Avoid `any`:** Use `unknown` or more specific types instead of `any` where possible.

## 9. Linting and Formatting

- **ESLint:** Enforce code quality and consistency. Configure with React-specific plugins (`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`).
- **Prettier:** Automate code formatting for a consistent style across the codebase.
- **Integrate with Git Hooks:** Use tools like Husky and lint-staged to run linters/formatters before commits.

## 10. Testing

- **Unit Tests:** Test individual components, hooks, and utility functions in isolation (e.g., using Jest, React Testing Library).
- **Integration Tests:** Test interactions between components or layers.
- **End-to-End (E2E) Tests:** Test complete user flows (e.g., using Cypress, Playwright).
- **Strive for High Coverage:** Especially for business logic (UseCases, Services) and complex UI interactions.
- **Testability by Design:** Clean Architecture and SoC make testing easier.

---

# Gin (Go) Style Guide

This guide outlines best practices for developing the backend API using the Gin framework.

## 1. Project Structure

- **Follow a standard Go project layout.** Keep handlers, models (domain), repositories, and services in separate packages to maintain separation of concerns.
  ```
  internal/
    api/
      handlers/
      middleware/
      router.go
    config/
    domain/
    repository/
    service/
  ```

## 2. Naming Conventions

- **Packages:** Use short, concise, `lowercase` names.
- **Variables & Functions:** Use `camelCase`.
- **Exported Functions & Structs:** Use `PascalCase`.
- **Interfaces:** Use the `er` suffix for single-method interfaces (e.g., `Reader`, `Writer`). For larger interfaces, choose a descriptive name.

## 3. Error Handling

- **Handle errors explicitly.** Avoid discarding errors with the blank identifier (`_`).
- **Return errors from functions** where they occur and let the caller decide how to handle them.
- **Use custom error types** for specific application errors to provide more context.

## 4. API Development and Testing with Bruno

- **Maintain API Documentation:** After adding, updating, or deleting any API endpoint, it is crucial to update the corresponding HTTP request in the Bruno collection located at [`bruno/Wavy Blog API`](bruno/Wavy%20Blog%20API:1).

- **Running Tests:**

  - Use the Bruno CLI to run tests. You specify individual files.
  - To run specific, related tests in sequence (e.g., login then perform an action):
    ```bash
    bru run "Login.bru" "Create Post.bru" --env demo
    ```

- **Writing Comprehensive Tests:**

  - For every new or updated API, create or update the corresponding `.bru` file with a robust test suite.
  - Design tests to cover multiple scenarios:
    - **Success Cases:** Verify correct status codes (e.g., 200, 201) and response body structure.
    - **Validation Errors:** Test for expected errors when providing invalid data (e.g., missing fields, incorrect data types) and check for appropriate status codes (e.g., 400, 422).
    - **Authorization:** Test for correct behavior when a valid token is provided and when it's missing or invalid (e.g., 401, 403).
    - **Edge Cases:** Consider scenarios like empty results, handling of special characters, etc.

- **Test Implementation:**

  - Use the `tests` block in your `.bru` files to define assertions.
  - **Authentication Flow:** If an API requires an access token, the test script must first call the `Login` API, retrieve the `access_token` from the response, and set it as a variable to be used in the subsequent request.

  **Example `.bru` file with Auth Chaining and Tests:**

  ```bruno
  meta {
    name: Create Post
    type: http
    seq: 3
  }

  post {
    url: {{host}}/api/posts
    body: json
    auth: bearer
  }

  auth:bearer {
    token: {{access_token}}
  }

  body:json {
    {
      "title": "My Test Post",
      "content": "This is the content of my test post.",
      "category": "Testing",
      "thumbnailURL": "http://example.com/thumbnail.jpg"
    }
  }

  script:post-response {
    // This script runs after the request and before tests
    const jsonData = res.getBody();
    // Save the new post's ID for other requests
    if(res.getStatus() === 201) {
      bru.setVar("postID", jsonData.id);
    }
  }

  tests {
    test("should create a post successfully", function() {
      expect(res.getStatus()).to.equal(201);
      const data = res.getBody();
      expect(data.title).to.equal("My Test Post");
      expect(data.id).to.be.a('string');
    });

    test("should have correct headers", function() {
      expect(res.getHeader("Content-Type")).to.include("application/json");
    });

    // Example of a test for a validation error (would be in a separate file)
    // test("should fail if title is missing", function() {
    //   // This request would have a body without a title
    //   expect(res.getStatus()).to.equal(400);
    // });
  }
  ```

## 5. Configuration

- **Use a dedicated config package.** Load configuration from environment variables or a config file ([`config.go`](backend/internal/config/config.go:1)).
- **Do not hardcode configuration values** like database credentials or secret keys in the source code.

## 6. Logging

- **Use a structured logger** (e.g., `slog`, `zerolog`, `zap`).
- **Include contextual information** in logs, such as request IDs, to make debugging easier.
