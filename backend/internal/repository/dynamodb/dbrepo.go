package dynamodb

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	appConfig "github.com/wavy-blog/backend/internal/config"
	"github.com/wavy-blog/backend/internal/domain"
	"github.com/wavy-blog/backend/internal/service"
)

const (
	GSI1 = "GSI1"
	GSI2 = "GSI2"
	GSI3 = "GSI3"
)

type DynamoDBRepo struct {
	Client    *dynamodb.Client
	TableName string
}

func New(cfg *appConfig.Config) *DynamoDBRepo {
	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(cfg.AWSRegion),
		config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: cfg.DynamoDBEndpoint}, nil
			}),
		),
	)
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	client := dynamodb.NewFromConfig(awsCfg)

	repo := &DynamoDBRepo{
		Client:    client,
		TableName: cfg.DynamoDBTableName,
	}

	repo.ensureTableExists()
	return repo
}

func (r *DynamoDBRepo) ensureTableExists() {
	_, err := r.Client.DescribeTable(context.TODO(), &dynamodb.DescribeTableInput{
		TableName: aws.String(r.TableName),
	})

	if err == nil {
		log.Printf("Table %s already exists.", r.TableName)
		return
	}

	log.Printf("Table %s not found, creating...", r.TableName)
	_, err = r.Client.CreateTable(context.TODO(), &dynamodb.CreateTableInput{
		TableName: aws.String(r.TableName),
		AttributeDefinitions: []types.AttributeDefinition{
			{AttributeName: aws.String("PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("SK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI1PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI1SK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI2PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI2SK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("EntityType"), AttributeType: types.ScalarAttributeTypeS},
		},
		KeySchema: []types.KeySchemaElement{
			{AttributeName: aws.String("PK"), KeyType: types.KeyTypeHash},
			{AttributeName: aws.String("SK"), KeyType: types.KeyTypeRange},
		},
		GlobalSecondaryIndexes: []types.GlobalSecondaryIndex{
			{
				IndexName: aws.String(GSI1),
				KeySchema: []types.KeySchemaElement{
					{AttributeName: aws.String("GSI1PK"), KeyType: types.KeyTypeHash},
					{AttributeName: aws.String("GSI1SK"), KeyType: types.KeyTypeRange},
				},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
			{
				IndexName: aws.String(GSI2),
				KeySchema: []types.KeySchemaElement{
					{AttributeName: aws.String("GSI2PK"), KeyType: types.KeyTypeHash},
					{AttributeName: aws.String("GSI2SK"), KeyType: types.KeyTypeRange},
				},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
			{
				IndexName: aws.String(GSI3),
				KeySchema: []types.KeySchemaElement{
					{AttributeName: aws.String("EntityType"), KeyType: types.KeyTypeHash},
					{AttributeName: aws.String("PK"), KeyType: types.KeyTypeRange},
				},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
		},
		BillingMode: types.BillingModePayPerRequest,
	})

	if err != nil {
		log.Fatalf("failed to create table, %v", err)
	}

	log.Printf("Table %s created.", r.TableName)
	r.seedDefaultData()
}

func (r *DynamoDBRepo) seedDefaultData() {
	ctx := context.TODO()
	
	// Check if "Uncategorized" category already exists
	existingCategory, err := r.GetCategoryBySlug(ctx, "uncategorized")
	if err != nil {
		log.Printf("Error checking for existing Uncategorized category: %v", err)
		return
	}
	
	if existingCategory != nil {
		log.Printf("Default 'Uncategorized' category already exists, skipping seeding")
		return
	}
	
	// Create default "Uncategorized" category
	defaultCategory := &domain.Category{
		Name:        "Uncategorized",
		Description: "Default category for posts without a specific category",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// Use the same logic as CreateCategory but without slug uniqueness check since this is seeding
	baseSlug := service.Slugify(defaultCategory.Name)
	defaultCategory.Slug = baseSlug
	defaultCategory.PK = "CATEGORY#" + defaultCategory.Slug
	defaultCategory.SK = "METADATA#" + defaultCategory.Slug
	defaultCategory.EntityType = "CATEGORY"
	
	categoryItem, err := attributevalue.MarshalMap(defaultCategory)
	if err != nil {
		log.Printf("Failed to marshal default category: %v", err)
		return
	}
	
	slugUniquenessItem := domain.SlugUniqueness{
		PK: "SLUG#" + defaultCategory.Slug,
		SK: "SLUG#" + defaultCategory.Slug,
	}
	slugItem, err := attributevalue.MarshalMap(slugUniquenessItem)
	if err != nil {
		log.Printf("Failed to marshal slug uniqueness item: %v", err)
		return
	}
	
	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Put: &types.Put{
					TableName: aws.String(r.TableName),
					Item:      categoryItem,
				},
			},
			{
				Put: &types.Put{
					TableName: aws.String(r.TableName),
					Item:      slugItem,
				},
			},
		},
	})
	
	if err != nil {
		log.Printf("Failed to create default 'Uncategorized' category: %v", err)
		return
	}
	
	log.Printf("Default 'Uncategorized' category created successfully")
}

func (r *DynamoDBRepo) CreateUser(ctx context.Context, user *domain.User) error {
	user.PK = "USER#" + user.Username
	user.SK = "METADATA#" + user.Username
	user.EntityType = "USER"
	userItem, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	emailUniquenessItem := domain.UserEmail{
		PK:       "USEREMAIL#" + user.Email,
		SK:       "USEREMAIL#" + user.Email,
		Username: user.Username,
	}
	emailItem, err := attributevalue.MarshalMap(emailUniquenessItem)
	if err != nil {
		return fmt.Errorf("failed to marshal email uniqueness item: %w", err)
	}

	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                userItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                emailItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
		},
	})

	if err != nil {
		// Check for transaction cancellation due to condition failure
		if strings.Contains(err.Error(), "TransactionCanceledException") {
			return fmt.Errorf("username or email already exists")
		}
		return fmt.Errorf("failed to create user transaction: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	// Step 1: Get the UserEmail item to find the username.
	emailItemResult, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USEREMAIL#" + email},
			"SK": &types.AttributeValueMemberS{Value: "USEREMAIL#" + email},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get email item: %w", err)
	}
	if emailItemResult.Item == nil {
		return nil, nil // No user with this email exists.
	}

	var emailItem domain.UserEmail
	err = attributevalue.UnmarshalMap(emailItemResult.Item, &emailItem)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal email item: %w", err)
	}

	if emailItem.Username == "" {
		return nil, fmt.Errorf("email item does not contain a username")
	}

	// Step 2: Use the username to get the full user item.
	return r.GetUserByUsername(ctx, emailItem.Username)
}

func (r *DynamoDBRepo) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + username},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + username},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}
	if result.Item == nil {
		return nil, nil // User not found
	}

	var user domain.User
	err = attributevalue.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}
	return &user, nil
}

func (r *DynamoDBRepo) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	// In the new model, the primary way to get a user is by username.
	// If UserID is the username, we can use GetUserByUsername.
	return r.GetUserByUsername(ctx, userID)
}

func (r *DynamoDBRepo) GetUserByRefreshToken(ctx context.Context, refreshToken string) (*domain.User, error) {
	// Query all users and filter by refresh token
	// Note: In a production system, you might want to create a GSI for refresh tokens
	// for better performance, but for now we'll scan all users
	result, err := r.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI3),
		KeyConditionExpression: aws.String("EntityType = :type"),
		FilterExpression:       aws.String("RefreshToken = :token AND RefreshTokenExpiresAt > :now"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":type":  &types.AttributeValueMemberS{Value: "USER"},
			":token": &types.AttributeValueMemberS{Value: refreshToken},
			":now":   &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query user by refresh token: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, nil // No user found with this refresh token
	}

	// Return the first matching user
	var user domain.User
	err = attributevalue.UnmarshalMap(result.Items[0], &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}
	return &user, nil
}

func (r *DynamoDBRepo) GetAllUsers(ctx context.Context) ([]*domain.User, error) {
	result, err := r.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI3),
		KeyConditionExpression: aws.String("EntityType = :type"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":type": &types.AttributeValueMemberS{Value: "USER"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query all users: %w", err)
	}

	var users []*domain.User
	err = attributevalue.UnmarshalListOfMaps(result.Items, &users)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal users: %w", err)
	}
	return users, nil
}

func (r *DynamoDBRepo) SlugExists(ctx context.Context, slug string) (bool, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
			"SK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
		},
	})
	if err != nil {
		return false, fmt.Errorf("failed to check slug existence: %w", err)
	}
	return result.Item != nil, nil
}

func (r *DynamoDBRepo) CreatePost(ctx context.Context, post *domain.Post) error {
	baseSlug := service.Slugify(post.Title)
	slug, err := service.GenerateUniqueSlug(baseSlug, func(s string) (bool, error) {
		return r.SlugExists(ctx, s)
	})
	if err != nil {
		return fmt.Errorf("failed to generate unique slug: %w", err)
	}
	post.Slug = slug

	post.PK = "POST#" + post.Slug
	post.SK = "METADATA#" + post.Slug
	post.EntityType = "POST"
	post.GSI1PK = "POSTS_BY_USER#" + post.AuthorID
	post.GSI1SK = "POST#" + post.CreatedAt.Format(time.RFC3339)
	post.GSI2PK = "POSTS_BY_CAT#" + post.Category
	post.GSI2SK = "POST#" + post.CreatedAt.Format(time.RFC3339)

	postItem, err := attributevalue.MarshalMap(post)
	if err != nil {
		return fmt.Errorf("failed to marshal post: %w", err)
	}

	slugUniquenessItem := domain.SlugUniqueness{
		PK: "SLUG#" + post.Slug,
		SK: "SLUG#" + post.Slug,
	}
	slugItem, err := attributevalue.MarshalMap(slugUniquenessItem)
	if err != nil {
		return fmt.Errorf("failed to marshal slug uniqueness item: %w", err)
	}

	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                postItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                slugItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
		},
	})

	if err != nil {
		if strings.Contains(err.Error(), "TransactionCanceledException") {
			return fmt.Errorf("post with this slug already exists")
		}
		return fmt.Errorf("failed to create post transaction: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) GetPostBySlug(ctx context.Context, slug string) (*domain.Post, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "POST#" + slug},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + slug},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}
	if result.Item == nil {
		return nil, nil // Post not found is not an error, just means it doesn't exist
	}

	var post domain.Post
	err = attributevalue.UnmarshalMap(result.Item, &post)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal post: %w", err)
	}
	return &post, nil
}

func (r *DynamoDBRepo) GetAllPosts(ctx context.Context, postName *string, pageSize int, pageIndex int) ([]*domain.Post, int, error) {
	keyCondExpr := "EntityType = :type"
	exprAttrVals := map[string]types.AttributeValue{
		":type": &types.AttributeValueMemberS{Value: "POST"},
	}

	// First, count total posts (for pagination info)
	countQueryInput := &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI3),
		KeyConditionExpression: aws.String(keyCondExpr),
		ExpressionAttributeValues: exprAttrVals,
		Select:                 types.SelectCount,
	}

	if postName != nil && *postName != "" {
		countQueryInput.FilterExpression = aws.String("contains(Title, :title)")
		exprAttrVals[":title"] = &types.AttributeValueMemberS{Value: *postName}
	}

	// Count total matching posts
	totalCount := 0
	var countLastEvaluatedKey map[string]types.AttributeValue
	
	for {
		if countLastEvaluatedKey != nil {
			countQueryInput.ExclusiveStartKey = countLastEvaluatedKey
		}

		countResult, err := r.Client.Query(ctx, countQueryInput)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to count posts: %w", err)
		}

		totalCount += int(countResult.Count)
		
		if countResult.LastEvaluatedKey == nil {
			break
		}
		countLastEvaluatedKey = countResult.LastEvaluatedKey
	}

	// Now get the actual posts for this page
	queryInput := &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI3),
		KeyConditionExpression: aws.String(keyCondExpr),
		ExpressionAttributeValues: exprAttrVals,
		Limit:                  aws.Int32(int32(pageSize)),
	}

	if postName != nil && *postName != "" {
		queryInput.FilterExpression = aws.String("contains(Title, :title)")
	}

	// For pageIndex > 0, we need to skip previous pages
	var allPosts []*domain.Post
	var lastEvaluatedKey map[string]types.AttributeValue
	itemsToSkip := pageIndex * pageSize
	itemsSkipped := 0

	for {
		if lastEvaluatedKey != nil {
			queryInput.ExclusiveStartKey = lastEvaluatedKey
		}

		result, err := r.Client.Query(ctx, queryInput)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to query all posts: %w", err)
		}

		var currentBatch []*domain.Post
		err = attributevalue.UnmarshalListOfMaps(result.Items, &currentBatch)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal posts: %w", err)
		}

		// Apply filtering and skipping logic
		for _, post := range currentBatch {
			if itemsSkipped < itemsToSkip {
				itemsSkipped++
				continue
			}
			allPosts = append(allPosts, post)
			if len(allPosts) >= pageSize {
				break
			}
		}

		// If we have enough posts or no more data, break
		if len(allPosts) >= pageSize || result.LastEvaluatedKey == nil {
			break
		}

		lastEvaluatedKey = result.LastEvaluatedKey
	}

	return allPosts, totalCount, nil
}

func (r *DynamoDBRepo) GetPostsByUser(ctx context.Context, username string, postName *string) ([]*domain.Post, error) {
	keyCondExpr := "GSI1PK = :pk"
	exprAttrVals := map[string]types.AttributeValue{
		":pk": &types.AttributeValueMemberS{Value: "POSTS_BY_USER#" + username},
	}

	queryInput := &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI1),
		KeyConditionExpression: aws.String(keyCondExpr),
		ExpressionAttributeValues: exprAttrVals,
		ScanIndexForward:       aws.Bool(false), // Sort by SK (CreatedAt) descending
	}

	if postName != nil && *postName != "" {
		queryInput.FilterExpression = aws.String("contains(Title, :title)")
		exprAttrVals[":title"] = &types.AttributeValueMemberS{Value: *postName}
	}

	result, err := r.Client.Query(ctx, queryInput)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts by user: %w", err)
	}

	var posts []*domain.Post
	err = attributevalue.UnmarshalListOfMaps(result.Items, &posts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal posts: %w", err)
	}
	return posts, nil
}

func (r *DynamoDBRepo) GetPostsByCategory(ctx context.Context, categorySlug string) ([]*domain.Post, error) {
	result, err := r.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI2),
		KeyConditionExpression: aws.String("GSI2PK = :pk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: "POSTS_BY_CAT#" + categorySlug},
		},
		ScanIndexForward: aws.Bool(false), // Sort by SK (CreatedAt) descending
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query posts by category: %w", err)
	}

	var posts []*domain.Post
	err = attributevalue.UnmarshalListOfMaps(result.Items, &posts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal posts: %w", err)
	}
	return posts, nil
}

func (r *DynamoDBRepo) CreateCategory(ctx context.Context, category *domain.Category) error {
	baseSlug := service.Slugify(category.Name)
	slug, err := service.GenerateUniqueSlug(baseSlug, func(s string) (bool, error) {
		return r.SlugExists(ctx, s)
	})
	if err != nil {
		return fmt.Errorf("failed to generate unique slug for category: %w", err)
	}
	category.Slug = slug

	category.PK = "CATEGORY#" + category.Slug
	category.SK = "METADATA#" + category.Slug
	category.EntityType = "CATEGORY"

	categoryItem, err := attributevalue.MarshalMap(category)
	if err != nil {
		return fmt.Errorf("failed to marshal category: %w", err)
	}

	slugUniquenessItem := domain.SlugUniqueness{
		PK: "SLUG#" + category.Slug,
		SK: "SLUG#" + category.Slug,
	}
	slugItem, err := attributevalue.MarshalMap(slugUniquenessItem)
	if err != nil {
		return fmt.Errorf("failed to marshal slug uniqueness item: %w", err)
	}

	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                categoryItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                slugItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
		},
	})

	if err != nil {
		if strings.Contains(err.Error(), "TransactionCanceledException") {
			return fmt.Errorf("category with this slug already exists")
		}
		return fmt.Errorf("failed to create category transaction: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "CATEGORY#" + slug},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + slug},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	if result.Item == nil {
		return nil, nil // Category not found
	}

	var category domain.Category
	err = attributevalue.UnmarshalMap(result.Item, &category)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal category: %w", err)
	}
	return &category, nil
}

func (r *DynamoDBRepo) GetAllCategories(ctx context.Context) ([]*domain.Category, error) {
	result, err := r.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI3),
		KeyConditionExpression: aws.String("EntityType = :type"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":type": &types.AttributeValueMemberS{Value: "CATEGORY"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query all categories: %w", err)
	}

	var categories []*domain.Category
	err = attributevalue.UnmarshalListOfMaps(result.Items, &categories)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal categories: %w", err)
	}
	return categories, nil
}
func (r *DynamoDBRepo) UpdateCategory(ctx context.Context, category *domain.Category) error {
	// If the name has changed, the slug might need to change.
	// We need to check if the new slug already exists.
	newSlug := service.Slugify(category.Name)
	if newSlug != category.Slug {
		exists, err := r.SlugExists(ctx, newSlug)
		if err != nil {
			return fmt.Errorf("failed to check for existing slug during update: %w", err)
		}
		if exists {
			return fmt.Errorf("category with this slug already exists")
		}
	}

	// To "update" a category with a new slug, we must delete the old one and create a new one
	// within a transaction to ensure atomicity.
	if newSlug != category.Slug {
		// Delete old items
		deleteOldCategory := types.TransactWriteItem{
			Delete: &types.Delete{
				TableName: aws.String(r.TableName),
				Key: map[string]types.AttributeValue{
					"PK": &types.AttributeValueMemberS{Value: "CATEGORY#" + category.Slug},
					"SK": &types.AttributeValueMemberS{Value: "METADATA#" + category.Slug},
				},
			},
		}
		deleteOldSlug := types.TransactWriteItem{
			Delete: &types.Delete{
				TableName: aws.String(r.TableName),
				Key: map[string]types.AttributeValue{
					"PK": &types.AttributeValueMemberS{Value: "SLUG#" + category.Slug},
					"SK": &types.AttributeValueMemberS{Value: "SLUG#" + category.Slug},
				},
			},
		}

		// Create new items
		category.Slug = newSlug
		category.PK = "CATEGORY#" + newSlug
		category.SK = "METADATA#" + newSlug
		newItem, err := attributevalue.MarshalMap(category)
		if err != nil {
			return fmt.Errorf("failed to marshal updated category: %w", err)
		}
		newSlugUniqueness := domain.SlugUniqueness{PK: "SLUG#" + newSlug, SK: "SLUG#" + newSlug}
		newSlugItem, err := attributevalue.MarshalMap(newSlugUniqueness)
		if err != nil {
			return fmt.Errorf("failed to marshal new slug uniqueness item: %w", err)
		}

		createNewCategory := types.TransactWriteItem{
			Put: &types.Put{
				TableName: aws.String(r.TableName),
				Item:      newItem,
			},
		}
		createNewSlug := types.TransactWriteItem{
			Put: &types.Put{
				TableName: aws.String(r.TableName),
				Item:      newSlugItem,
			},
		}

		_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
			TransactItems: []types.TransactWriteItem{deleteOldCategory, deleteOldSlug, createNewCategory, createNewSlug},
		})
		if err != nil {
			return fmt.Errorf("failed to transact category update: %w", err)
		}
	} else {
		// If the slug hasn't changed, we can just do a simple PutItem.
		item, err := attributevalue.MarshalMap(category)
		if err != nil {
			return fmt.Errorf("failed to marshal category for update: %w", err)
		}
		_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(r.TableName),
			Item:      item,
		})
		if err != nil {
			return fmt.Errorf("failed to update category item: %w", err)
		}
	}

	return nil
}

func (r *DynamoDBRepo) DeleteCategory(ctx context.Context, slug string) error {
	// Check if the category is "uncategorized" - cannot be deleted
	if slug == "uncategorized" {
		return fmt.Errorf("cannot delete the default 'Uncategorized' category")
	}
	
	// Check if category has any posts
	posts, err := r.GetPostsByCategory(ctx, slug)
	if err != nil {
		return fmt.Errorf("failed to check for posts in category: %w", err)
	}
	if len(posts) > 0 {
		return fmt.Errorf("cannot delete category '%s' because it contains %d posts", slug, len(posts))
	}
	
	// Delete both category and slug uniqueness entries in a transaction
	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "CATEGORY#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "METADATA#" + slug},
					},
				},
			},
			{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
					},
				},
			},
		},
	})
	
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) DeleteCategories(ctx context.Context, slugs []string) error {
	// Validate all categories before attempting any deletions
	for _, slug := range slugs {
		// Check if the category is "uncategorized"
		if slug == "uncategorized" {
			return fmt.Errorf("cannot delete the default 'Uncategorized' category")
		}
		
		// Check if category exists
		category, err := r.GetCategoryBySlug(ctx, slug)
		if err != nil {
			return fmt.Errorf("failed to check category '%s': %w", slug, err)
		}
		if category == nil {
			return fmt.Errorf("category '%s' not found", slug)
		}
		
		// Check if category has any posts
		posts, err := r.GetPostsByCategory(ctx, slug)
		if err != nil {
			return fmt.Errorf("failed to check for posts in category '%s': %w", slug, err)
		}
		if len(posts) > 0 {
			return fmt.Errorf("cannot delete category '%s' because it contains %d posts", slug, len(posts))
		}
	}
	
	// If all validations pass, delete all categories
	// DynamoDB TransactWriteItems has a limit of 25 items, so we need to batch if more than 12 categories
	// (each category deletion requires 2 items: category + slug uniqueness)
	maxCategoriesPerBatch := 12
	
	for i := 0; i < len(slugs); i += maxCategoriesPerBatch {
		end := i + maxCategoriesPerBatch
		if end > len(slugs) {
			end = len(slugs)
		}
		
		batchSlugs := slugs[i:end]
		var transactItems []types.TransactWriteItem
		
		for _, slug := range batchSlugs {
			// Add category deletion
			transactItems = append(transactItems, types.TransactWriteItem{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "CATEGORY#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "METADATA#" + slug},
					},
				},
			})
			
			// Add slug uniqueness deletion
			transactItems = append(transactItems, types.TransactWriteItem{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
					},
				},
			})
		}
		
		_, err := r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
			TransactItems: transactItems,
		})
		
		if err != nil {
			return fmt.Errorf("failed to delete categories batch: %w", err)
		}
	}
	
	return nil
}

func (r *DynamoDBRepo) UpdateUser(ctx context.Context, user *domain.User) error {
	// The user object from the handler won't have PK/SK, so we set them.
	user.PK = "USER#" + user.Username
	user.SK = "METADATA#" + user.Username
	user.EntityType = "USER"

	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(r.TableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_exists(PK)"),
	})
	if err != nil {
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) UpdateUserRefreshToken(ctx context.Context, userID string, refreshToken string, expiresAt time.Time) error {
	// Update only the refresh token fields for the user
	_, err := r.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + userID},
		},
		UpdateExpression: aws.String("SET RefreshToken = :token, RefreshTokenExpiresAt = :expiresAt, UpdatedAt = :updatedAt"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":token":     &types.AttributeValueMemberS{Value: refreshToken},
			":expiresAt": &types.AttributeValueMemberS{Value: expiresAt.Format(time.RFC3339)},
			":updatedAt": &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
		},
		ConditionExpression: aws.String("attribute_exists(PK)"),
	})
	if err != nil {
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to update user refresh token: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) DeleteUser(ctx context.Context, username string) error {
	// First, get the user to find their email for the uniqueness item.
	user, err := r.GetUserByUsername(ctx, username)
	if err != nil {
		return fmt.Errorf("could not get user to delete: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	// Second, find all posts by this user.
	posts, err := r.GetPostsByUser(ctx, username, nil)
	if err != nil {
		return fmt.Errorf("could not get user's posts to delete: %w", err)
	}

	// Create a list of all items to delete.
	writeRequests := []types.WriteRequest{}

	// Add the user's posts to the delete list.
	for _, post := range posts {
		writeRequests = append(writeRequests, types.WriteRequest{
			DeleteRequest: &types.DeleteRequest{
				Key: map[string]types.AttributeValue{
					"PK": &types.AttributeValueMemberS{Value: post.PK},
					"SK": &types.AttributeValueMemberS{Value: post.SK},
				},
			},
		})
	}

	// Add the user item itself.
	writeRequests = append(writeRequests, types.WriteRequest{
		DeleteRequest: &types.DeleteRequest{
			Key: map[string]types.AttributeValue{
				"PK": &types.AttributeValueMemberS{Value: "USER#" + username},
				"SK": &types.AttributeValueMemberS{Value: "METADATA#" + username},
			},
		},
	})

	// Add the user's email uniqueness item.
	writeRequests = append(writeRequests, types.WriteRequest{
		DeleteRequest: &types.DeleteRequest{
			Key: map[string]types.AttributeValue{
				"PK": &types.AttributeValueMemberS{Value: "USEREMAIL#" + user.Email},
				"SK": &types.AttributeValueMemberS{Value: "USEREMAIL#" + user.Email},
			},
		},
	})

	// Batch delete items, 25 at a time (DynamoDB limit).
	for i := 0; i < len(writeRequests); i += 25 {
		end := i + 25
		if end > len(writeRequests) {
			end = len(writeRequests)
		}
		batch := writeRequests[i:end]

		_, err := r.Client.BatchWriteItem(ctx, &dynamodb.BatchWriteItemInput{
			RequestItems: map[string][]types.WriteRequest{
				r.TableName: batch,
			},
		})
		if err != nil {
			// Note: In a real-world scenario, you'd want to handle unprocessed items.
			return fmt.Errorf("failed to batch delete user and related items: %w", err)
		}
	}

	return nil
}

func (r *DynamoDBRepo) UpdatePost(ctx context.Context, oldSlug string, post *domain.Post) error {
	// If the title is updated, the slug might change.
	newSlug := service.Slugify(post.Title)
	if newSlug != oldSlug {
		// Check if the new slug is available.
		exists, err := r.SlugExists(ctx, newSlug)
		if err != nil {
			return err
		}
		if exists {
			return fmt.Errorf("new slug '%s' already exists", newSlug)
		}
		post.Slug = newSlug
	} else {
		post.Slug = oldSlug
	}

	post.PK = "POST#" + post.Slug
	post.SK = "METADATA#" + post.Slug
	post.EntityType = "POST"
	post.GSI1PK = "POSTS_BY_USER#" + post.AuthorID
	post.GSI1SK = "POST#" + post.CreatedAt.Format(time.RFC3339) // CreatedAt should not change on update
	post.GSI2PK = "POSTS_BY_CAT#" + post.Category
	post.GSI2SK = "POST#" + post.CreatedAt.Format(time.RFC3339)

	postItem, err := attributevalue.MarshalMap(post)
	if err != nil {
		return fmt.Errorf("failed to marshal post: %w", err)
	}

	// If slug has not changed, we can just PutItem
	if newSlug == oldSlug {
		_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
			TableName:           aws.String(r.TableName),
			Item:                postItem,
			ConditionExpression: aws.String("attribute_exists(PK)"),
		})
		if err != nil {
			if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
				return fmt.Errorf("post not found")
			}
			return fmt.Errorf("failed to update post: %w", err)
		}
		return nil
	}

	// If slug has changed, we need a transaction to ensure data integrity.
	// 1. Delete old slug uniqueness item
	// 2. Delete old post item
	// 3. Create new slug uniqueness item
	// 4. Create new post item
	slugUniquenessItem := domain.SlugUniqueness{
		PK: "SLUG#" + post.Slug,
		SK: "SLUG#" + post.Slug,
	}
	slugItem, err := attributevalue.MarshalMap(slugUniquenessItem)
	if err != nil {
		return fmt.Errorf("failed to marshal new slug uniqueness item: %w", err)
	}

	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "SLUG#" + oldSlug},
						"SK": &types.AttributeValueMemberS{Value: "SLUG#" + oldSlug},
					},
				},
			},
			{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "POST#" + oldSlug},
						"SK": &types.AttributeValueMemberS{Value: "METADATA#" + oldSlug},
					},
				},
			},
			{
				Put: &types.Put{
					TableName:           aws.String(r.TableName),
					Item:                slugItem,
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
			{
				Put: &types.Put{
					TableName: aws.String(r.TableName),
					Item:      postItem,
				},
			},
		},
	})

	if err != nil {
		if strings.Contains(err.Error(), "TransactionCanceledException") {
			return fmt.Errorf("failed to update post, new slug might already be taken or original post was deleted")
		}
		return fmt.Errorf("failed to execute post update transaction: %w", err)
	}

	return nil
}

func (r *DynamoDBRepo) DeletePost(ctx context.Context, slug string) error {
	_, err := r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "POST#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "METADATA#" + slug},
					},
				},
			},
			{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
					},
				},
			},
		},
	})

	if err != nil {
		return fmt.Errorf("failed to delete post and slug items: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) DeletePosts(ctx context.Context, slugs []string) error {
	// Validate all posts exist before attempting any deletions
	for _, slug := range slugs {
		post, err := r.GetPostBySlug(ctx, slug)
		if err != nil {
			return fmt.Errorf("failed to check post '%s': %w", slug, err)
		}
		if post == nil {
			return fmt.Errorf("post '%s' not found", slug)
		}
	}
	
	// DynamoDB TransactWriteItems has a limit of 25 items, so we need to batch if more than 12 posts
	// (each post deletion requires 2 items: post + slug uniqueness)
	maxPostsPerBatch := 12
	
	for i := 0; i < len(slugs); i += maxPostsPerBatch {
		end := i + maxPostsPerBatch
		if end > len(slugs) {
			end = len(slugs)
		}
		
		batchSlugs := slugs[i:end]
		var transactItems []types.TransactWriteItem
		
		for _, slug := range batchSlugs {
			// Add post deletion
			transactItems = append(transactItems, types.TransactWriteItem{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "POST#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "METADATA#" + slug},
					},
				},
			})
			
			// Add slug uniqueness deletion
			transactItems = append(transactItems, types.TransactWriteItem{
				Delete: &types.Delete{
					TableName: aws.String(r.TableName),
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
						"SK": &types.AttributeValueMemberS{Value: "SLUG#" + slug},
					},
				},
			})
		}
		
		_, err := r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
			TransactItems: transactItems,
		})
		
		if err != nil {
			return fmt.Errorf("failed to delete posts batch: %w", err)
		}
	}
	
	return nil
}