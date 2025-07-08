package dynamodb

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/wavy-blog/backend/internal/domain"
	appConfig "github.com/wavy-blog/backend/internal/config"
)

const (
	EmailIndex = "EmailIndex"
)

type DynamoDBRepo struct {
	Client *dynamodb.Client
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
			{
				AttributeName: aws.String("PK"),
				AttributeType: types.ScalarAttributeTypeS,
			},
			{
				AttributeName: aws.String("SK"),
				AttributeType: types.ScalarAttributeTypeS,
			},
			{
				AttributeName: aws.String("Email"),
				AttributeType: types.ScalarAttributeTypeS,
			},
			{
				AttributeName: aws.String("Category"),
				AttributeType: types.ScalarAttributeTypeS,
			},
			{
				AttributeName: aws.String("CreatedAt"),
				AttributeType: types.ScalarAttributeTypeS,
			},
		},
		KeySchema: []types.KeySchemaElement{
			{
				AttributeName: aws.String("PK"),
				KeyType:       types.KeyTypeHash,
			},
			{
				AttributeName: aws.String("SK"),
				KeyType:       types.KeyTypeRange,
			},
		},
		GlobalSecondaryIndexes: []types.GlobalSecondaryIndex{
			{
				IndexName: aws.String(EmailIndex),
				KeySchema: []types.KeySchemaElement{
					{
						AttributeName: aws.String("Email"),
						KeyType:       types.KeyTypeHash,
					},
				},
				Projection: &types.Projection{
					ProjectionType: types.ProjectionTypeAll,
				},
			},
			{
				IndexName: aws.String("CategoryIndex"),
				KeySchema: []types.KeySchemaElement{
					{
						AttributeName: aws.String("Category"),
						KeyType:       types.KeyTypeHash,
					},
					{
						AttributeName: aws.String("CreatedAt"),
						KeyType:       types.KeyTypeRange,
					},
				},
				Projection: &types.Projection{
					ProjectionType: types.ProjectionTypeAll,
				},
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
	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	item["SK"] = &types.AttributeValueMemberS{Value: "METADATA#" + user.UserID}

	_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.TableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to put item: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	result, err := r.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.TableName),
		IndexName:              aws.String(EmailIndex),
		KeyConditionExpression: aws.String("Email = :email"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":email": &types.AttributeValueMemberS{Value: email},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query user by email: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	var user domain.User
	err = attributevalue.UnmarshalMap(result.Items[0], &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}
	return &user, nil
}

func (r *DynamoDBRepo) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + userID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}
	if result.Item == nil {
		return nil, fmt.Errorf("user not found")
	}

	var user domain.User
	err = attributevalue.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}
	return &user, nil
}

func (r *DynamoDBRepo) GetAllUsers(ctx context.Context) ([]*domain.User, error) {
	result, err := r.Client.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(r.TableName),
		FilterExpression: aws.String("begins_with(PK, :pk)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: "USER#"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan users: %w", err)
	}

	var users []*domain.User
	err = attributevalue.UnmarshalListOfMaps(result.Items, &users)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal users: %w", err)
	}
	return users, nil
}

func (r *DynamoDBRepo) CreatePost(ctx context.Context, post *domain.Post) error {
	// Main post item
	item, err := attributevalue.MarshalMap(post)
	if err != nil {
		return fmt.Errorf("failed to marshal post: %w", err)
	}
	item["SK"] = &types.AttributeValueMemberS{Value: "METADATA#" + post.PostID}

	// Post by user item
	postByUserItem := make(map[string]types.AttributeValue)
	for k, v := range item {
		postByUserItem[k] = v
	}
	postByUserItem["PK"] = &types.AttributeValueMemberS{Value: "USER#" + post.AuthorID}
	postByUserItem["SK"] = &types.AttributeValueMemberS{Value: post.PostID}

	// Post by category item
	postByCategoryItem := make(map[string]types.AttributeValue)
	for k, v := range item {
		postByCategoryItem[k] = v
	}
	postByCategoryItem["PK"] = &types.AttributeValueMemberS{Value: "CATEGORY#" + post.Category}
	postByCategoryItem["SK"] = &types.AttributeValueMemberS{Value: post.PostID}

	_, err = r.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Put: &types.Put{
					TableName: aws.String(r.TableName),
					Item:      item,
				},
			},
			{
				Put: &types.Put{
					TableName: aws.String(r.TableName),
					Item:      postByUserItem,
				},
			},
			{
				Put: &types.Put{
					TableName: aws.String(r.TableName),
					Item:      postByCategoryItem,
				},
			},
		},
	})

	if err != nil {
		return fmt.Errorf("failed to put items: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) GetPostByID(ctx context.Context, postID string) (*domain.Post, error) {
	result, err := r.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: postID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + postID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
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
	filter := "begins_with(PK, :pk)"
	exprAttrVals := map[string]types.AttributeValue{
		":pk": &types.AttributeValueMemberS{Value: "POST#"},
	}

	if postName != nil && *postName != "" {
		filter += " and contains(Title, :title)"
		exprAttrVals[":title"] = &types.AttributeValueMemberS{Value: *postName}
	}

	result, err := r.Client.Scan(ctx, &dynamodb.ScanInput{
		TableName:                 aws.String(r.TableName),
		FilterExpression:          aws.String(filter),
		ExpressionAttributeValues: exprAttrVals,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan posts: %w", err)
	}

	var posts []*domain.Post
	err = attributevalue.UnmarshalListOfMaps(result.Items, &posts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal posts: %w", err)
	}
	return posts, nil
}

func (r *DynamoDBRepo) GetPostsByUser(ctx context.Context, userID string, postName *string) ([]*domain.Post, error) {
	keyCondExpr := "PK = :pk and begins_with(SK, :sk)"
	exprAttrVals := map[string]types.AttributeValue{
		":pk": &types.AttributeValueMemberS{Value: "USER#" + userID},
		":sk": &types.AttributeValueMemberS{Value: "POST#"},
	}
	filterExpr := ""

	if postName != nil && *postName != "" {
		filterExpr = "contains(Title, :title)"
		exprAttrVals[":title"] = &types.AttributeValueMemberS{Value: *postName}
	}

	queryInput := &dynamodb.QueryInput{
		TableName:                 aws.String(r.TableName),
		KeyConditionExpression:    aws.String(keyCondExpr),
		ExpressionAttributeValues: exprAttrVals,
	}

	if filterExpr != "" {
		queryInput.FilterExpression = aws.String(filterExpr)
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
		IndexName:              aws.String("CategoryIndex"),
		KeyConditionExpression: aws.String("Category = :category"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":category": &types.AttributeValueMemberS{Value: category},
		},
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

func (r *DynamoDBRepo) GetUniqueCategories(ctx context.Context) ([]string, error) {
	result, err := r.Client.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(r.TableName),
		FilterExpression: aws.String("begins_with(PK, :pk)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: "CATEGORY#"},
		},
		ProjectionExpression: aws.String("Category"),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan categories: %w", err)
	}

	categories := make(map[string]bool)
	for _, item := range result.Items {
		var post domain.Post
		err := attributevalue.UnmarshalMap(item, &post)
		if err == nil {
			categories[post.Category] = true
		}
	}

	uniqueCategories := make([]string, 0, len(categories))
	for category := range categories {
		uniqueCategories = append(uniqueCategories, category)
	}

	return uniqueCategories, nil
}

func (r *DynamoDBRepo) UpdateUser(ctx context.Context, user *domain.User) error {
	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	item["SK"] = &types.AttributeValueMemberS{Value: "METADATA#" + user.UserID}

	_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.TableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to put item: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) DeleteUser(ctx context.Context, userID string) error {
	_, err := r.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + userID},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) UpdatePost(ctx context.Context, post *domain.Post) error {
	item, err := attributevalue.MarshalMap(post)
	if err != nil {
		return fmt.Errorf("failed to marshal post: %w", err)
	}

	item["SK"] = &types.AttributeValueMemberS{Value: "METADATA#" + post.PostID}

	_, err = r.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.TableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to put item: %w", err)
	}
	return nil
}

func (r *DynamoDBRepo) DeletePost(ctx context.Context, postID string) error {
	_, err := r.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: postID},
			"SK": &types.AttributeValueMemberS{Value: "METADATA#" + postID},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}
	return nil
}