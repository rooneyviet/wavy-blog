# DynamoDB Structure Documentation

## Table Configuration
- **Table Name**: `WavyBlog` (configurable via `DYNAMODB_TABLE` environment variable)
- **Billing Mode**: Pay-per-request
- **Endpoint**: LocalStack (local development) - `http://localhost:4566`

## Primary Key Structure
- **Partition Key (PK)**: String - Entity identification with prefixes
- **Sort Key (SK)**: String - Metadata and additional sorting

## Global Secondary Indexes (GSIs)

| GSI | Purpose | Partition Key | Sort Key | Key Pattern | Projection |
|-----|---------|---------------|----------|-------------|------------|
| **GSI1** | Query posts by author/user | `GSI1PK` (String) | `GSI1SK` (String) | PK: `"POSTS_BY_USER#<username>"`<br>SK: `"POST#<CreatedAt_RFC3339>"` | All attributes |
| **GSI2** | Query posts by category | `GSI2PK` (String) | `GSI2SK` (String) | PK: `"POSTS_BY_CAT#<category>"`<br>SK: `"POST#<CreatedAt_RFC3339>"` | All attributes |
| **GSI3** | Query all entities by type<br>(eliminates Scan operations) | `EntityType` (String) | `PK` (String) | PK: `"USER"`, `"POST"`, or `"CATEGORY"`<br>SK: Primary key of the entity | All attributes |

### GSI Key Pattern Examples
| GSI | Example Partition Key | Example Sort Key |
|-----|----------------------|------------------|
| GSI1 | `"POSTS_BY_USER#john_doe"` | `"POST#2024-01-15T10:30:00Z"` |
| GSI2 | `"POSTS_BY_CAT#technology"` | `"POST#2024-01-15T10:30:00Z"` |
| GSI3 | `"POST"` | `"POST#my-first-post"` |

## Entity Models

### User Entity
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| PK | String | Partition Key | `"USER#john_doe"` |
| SK | String | Sort Key | `"METADATA#john_doe"` |
| EntityType | String | Entity identifier for GSI3 | `"USER"` |
| UserID | String | Unique user identifier | `"usr_123456"` |
| Username | String | User's username | `"john_doe"` |
| Email | String | User's email address | `"john@example.com"` |
| PasswordHash | String | Hashed password | `"$2a$10$..."` |
| Role | String | User role | `"user"` or `"admin"` |
| AvatarURL | String | User's avatar/profile image URL | `"https://example.com/user-avatar.jpg"` |
| CreatedAt | Timestamp | Creation timestamp | `"2024-01-15T10:30:00Z"` |
| UpdatedAt | Timestamp | Last update timestamp | `"2024-01-15T10:30:00Z"` |

### UserEmail Entity (Uniqueness Enforcement)
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| PK | String | Partition Key | `"USEREMAIL#john@example.com"` |
| SK | String | Sort Key | `"USEREMAIL#john@example.com"` |
| Username | String | Associated username | `"john_doe"` |

### Post Entity
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| PK | String | Partition Key | `"POST#my-first-post"` |
| SK | String | Sort Key | `"METADATA#my-first-post"` |
| EntityType | String | Entity identifier for GSI3 | `"POST"` |
| GSI1PK | String | GSI1 Partition Key | `"POSTS_BY_USER#john_doe"` |
| GSI1SK | String | GSI1 Sort Key | `"POST#2024-01-15T10:30:00Z"` |
| GSI2PK | String | GSI2 Partition Key | `"POSTS_BY_CAT#technology"` |
| GSI2SK | String | GSI2 Sort Key | `"POST#2024-01-15T10:30:00Z"` |
| PostID | String | Unique post identifier | `"post_789012"` |
| Slug | String | URL-friendly post identifier | `"my-first-post"` |
| Title | String | Post title | `"My First Post"` |
| Content | String | Post content (markdown) | `"# Hello World\nThis is my first post..."` |
| AuthorID | String | Author's username | `"john_doe"` |
| Category | String | Post category slug | `"technology"` |
| ThumbnailURL | String | Post thumbnail image URL | `"https://example.com/thumb.jpg"` |
| Status | String | Publication status | `"published"` or `"draft"` |
| CreatedAt | Timestamp | Creation timestamp | `"2024-01-15T10:30:00Z"` |
| UpdatedAt | Timestamp | Last update timestamp | `"2024-01-15T10:30:00Z"` |

### Category Entity
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| PK | String | Partition Key | `"CATEGORY#technology"` |
| SK | String | Sort Key | `"METADATA#technology"` |
| EntityType | String | Entity identifier for GSI3 | `"CATEGORY"` |
| Slug | String | URL-friendly category identifier | `"technology"` |
| Name | String | Category display name | `"Technology"` |
| Description | String | Category description (optional) | `"Posts about technology and programming"` |
| CreatedAt | Timestamp | Creation timestamp | `"2024-01-15T10:30:00Z"` |
| UpdatedAt | Timestamp | Last update timestamp | `"2024-01-15T10:30:00Z"` |

### Slug Uniqueness Entity
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| PK | String | Partition Key | `"SLUG#my-first-post"` |
| SK | String | Sort Key | `"SLUG#my-first-post"` |

## Access Patterns

1. **Get User by Username**: `PK = "USER#<username>"`
2. **Get User by Email**: Lookup via UserEmail entity, then User entity
3. **Get All Users**: Query GSI3 where `EntityType = "USER"`
4. **Get Post by Slug**: `PK = "POST#<slug>"`
5. **Get All Posts (Paginated)**: Query GSI3 where `EntityType = "POST"` with pagination support
6. **Get Posts by User**: Query GSI1 where `GSI1PK = "POSTS_BY_USER#<username>"`
7. **Get Posts by Category**: Query GSI2 where `GSI2PK = "POSTS_BY_CAT#<categorySlug>"`
8. **Get Category by Slug**: `PK = "CATEGORY#<categorySlug>"`
9. **Get All Categories**: Query GSI3 where `EntityType = "CATEGORY"`
10. **Check Slug Uniqueness**: `PK = "SLUG#<slug>"`

## Design Principles

- **Single Table Design**: All entities in one table with proper prefixing
- **No Scan Operations**: GSI3 eliminates expensive scans
- **Transactional Integrity**: Critical operations use DynamoDB transactions
- **Unique Constraints**: Email and slug uniqueness enforced via separate entities  
- **Category Validation**: Posts reference categories by slug with existence validation
- **Time-based Sorting**: Posts sorted by creation date using RFC3339 format
- **Efficient Pagination**: Uses DynamoDB's LastEvaluatedKey for cursor-based pagination
- **Default Data Seeding**: Automatic creation of default "Uncategorized" category

## Default Seeded Data

When the table is first created, the following default data is automatically seeded:

### Default "Uncategorized" Category
| Attribute | Value |
|-----------|-------|
| PK | `"CATEGORY#uncategorized"` |
| SK | `"METADATA#uncategorized"` |
| EntityType | `"CATEGORY"` |
| Slug | `"uncategorized"` |
| Name | `"Uncategorized"` |
| Description | `"Default category for posts without a specific category"` |
| CreatedAt | (Seeding timestamp) |
| UpdatedAt | (Seeding timestamp) |

**Special Properties:**
- This category cannot be deleted through the API
- It serves as a fallback for posts without specific categories
- Created automatically when table is first initialized

## Pagination Implementation

The `GetAllPosts` and `GetImages` APIs support pagination through:

- **Page Size**: Configurable limit (1-100 items, default: 20)
- **Page Index**: 1-based page numbering for user-friendly navigation
- **Total Count**: Total number of items available across all pages
- **Internal Cursor Management**: DynamoDB's `LastEvaluatedKey` handled internally by backend
- **Stateless**: No server-side state required for pagination

### Pagination Flow

1. **First Request**: Client calls `/api/posts?pageSize=20&pageIndex=1`
2. **Response**: Returns paginated object with `{pageIndex, pageSize, total, posts}`
3. **Next Request**: Client calls `/api/posts?pageSize=20&pageIndex=2`
4. **Continue**: Client can calculate maximum pages using `Math.ceil(total / pageSize)`

### Implementation Notes

- **1-based Indexing**: API uses 1-based page numbers (pageIndex=1 is first page)
- **Backend Conversion**: Handler converts 1-based to 0-based for internal DynamoDB operations
- **Total Count**: Backend performs separate count query to determine total items
- **Cursor Skipping**: For `pageIndex > 1`, backend skips previous pages by iterating through DynamoDB results
- **Consistent Response Format**: Both posts and images APIs use identical pagination structure
- **No hasMore/hasNextPage**: Clients calculate remaining pages using total count
- This approach trades some efficiency for API simplicity and consistency
- Consider caching or alternative strategies for very large page indices