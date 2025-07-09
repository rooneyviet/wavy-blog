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
	"github.com/wavy-blog/backend/internal/domain"
	appConfig "github.com/wavy-blog/backend/internal/config"
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

func (r *DynamoDBRepo) CreatePost(ctx context.Context, post *domain.Post) error {
	post.PK = "POST#" + post.PostID
	post.SK = "METADATA#" + post.PostID
	post.EntityType = "POST"
	post.GSI1PK = "POSTS_BY_USER#" + post.AuthorID
	post.GSI1SK = "POST#" + post.CreatedAt.Format(time.RFC3339)
	post.GSI2PK = "POSTS_BY_CAT#" + post.Category
	post.GSI2SK = "POST#" + post.CreatedAt.Format(time.RFC3339)

	item, err := attributevalue.MarshalMap(post)
	if err != nil {
		return fmt.Errorf("failed to marshal post: %w", err)
	}

	_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.TableName),
		Item:      item,
	})

	if err != nil {
		return fmt.Errorf("failed to put post item: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) GetPostByID(ctx context.Context, postID string) (*domain.Post, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "POST#" + postID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + postID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}
	if result.Item == nil {
		return nil, fmt.Errorf("post not found")
	}

	var post domain.Post
	err = attributevalue.UnmarshalMap(result.Item, &post)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal post: %w", err)
	}
	return &post, nil
}

func (r *DynamoDBRepo) GetAllPosts(ctx context.Context, postName *string) ([]*domain.Post, error) {
	keyCondExpr := "EntityType = :type"
	exprAttrVals := map[string]types.AttributeValue{
		":type": &types.AttributeValueMemberS{Value: "POST"},
	}
	
	queryInput := &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI3),
		KeyConditionExpression: aws.String(keyCondExpr),
		ExpressionAttributeValues: exprAttrVals,
	}

	if postName != nil && *postName != "" {
		queryInput.FilterExpression = aws.String("contains(Title, :title)")
		exprAttrVals[":title"] = &types.AttributeValueMemberS{Value: *postName}
	}

	result, err := r.Client.Query(ctx, queryInput)
	if err != nil {
		return nil, fmt.Errorf("failed to query all posts: %w", err)
	}

	var posts []*domain.Post
	err = attributevalue.UnmarshalListOfMaps(result.Items, &posts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal posts: %w", err)
	}
	return posts, nil
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

func (r *DynamoDBRepo) GetPostsByCategory(ctx context.Context, category string) ([]*domain.Post, error) {
	result, err := r.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(GSI2),
		KeyConditionExpression: aws.String("GSI2PK = :pk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: "POSTS_BY_CAT#" + category},
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
	category.PK = "CATEGORY#" + category.Name
	category.SK = "METADATA#" + category.Name
	category.EntityType = "CATEGORY"
	
	item, err := attributevalue.MarshalMap(category)
	if err != nil {
		return fmt.Errorf("failed to marshal category: %w", err)
	}

	_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(r.TableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	})
	if err != nil {
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			return fmt.Errorf("category already exists")
		}
		return fmt.Errorf("failed to put category item: %w", err)
	}
	return nil
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
			return fmt.Errorf("failed to batch delete user and post items: %w", err)
		}
	}

	return nil
}

func (r *DynamoDBRepo) UpdatePost(ctx context.Context, post *domain.Post) error {
	// The handler has already fetched the post, so we receive the updated domain object.
	// We just need to persist the changes.

	// Build the update expression and attribute values dynamically.
	updateExpr := "SET Title = :title, Content = :content, ThumbnailURL = :thumb, UpdatedAt = :updatedAt, Category = :cat, GSI2PK = :gsi2pk, GSI2SK = :gsi2sk"
	exprAttrVals := map[string]interface{}{
		":title":     post.Title,
		":content":   post.Content,
		":thumb":     post.ThumbnailURL,
		":updatedAt": post.UpdatedAt,
		":cat":       post.Category,
		":gsi2pk":   "POSTS_BY_CAT#" + post.Category,
		":gsi2sk":   "POST#" + post.UpdatedAt.Format(time.RFC3339), // Use UpdatedAt for fresh content sorting
	}

	marshaledVals, err := attributevalue.MarshalMap(exprAttrVals)
	if err != nil {
		return fmt.Errorf("failed to marshal expression values for update: %w", err)
	}

	_, err = r.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "POST#" + post.PostID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + post.PostID},
		},
		UpdateExpression:          aws.String(updateExpr),
		ExpressionAttributeValues: marshaledVals,
		ConditionExpression:       aws.String("attribute_exists(PK)"), // Ensure the post exists before updating
		ReturnValues:              types.ReturnValueUpdatedNew,
	})

	if err != nil {
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			return fmt.Errorf("post not found")
		}
		return fmt.Errorf("failed to update post: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) DeletePost(ctx context.Context, postID string) error {
	_, err := r.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "POST#" + postID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + postID},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}
	return nil
}