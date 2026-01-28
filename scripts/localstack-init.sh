#!/bin/bash
# LocalStack initialization script
# Creates required AWS resources on startup

set -e

echo "Initializing LocalStack resources..."

# Wait for LocalStack to be ready
awslocal dynamodb wait table-not-exists --table-name Tweets 2>/dev/null || true

# Create Tweets DynamoDB table
echo "Creating Tweets table..."
awslocal dynamodb create-table \
    --table-name Tweets \
    --attribute-definitions \
        AttributeName=tweet_id,AttributeType=S \
    --key-schema \
        AttributeName=tweet_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

echo "Waiting for Tweets table to be active..."
awslocal dynamodb wait table-exists --table-name Tweets

# Create Users DynamoDB table
echo "Creating Users table..."
awslocal dynamodb create-table \
    --table-name Users \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=username,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[{\"IndexName\":\"username-index\",\"KeySchema\":[{\"AttributeName\":\"username\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST

echo "Waiting for Users table to be active..."
awslocal dynamodb wait table-exists --table-name Users

# Create Follows DynamoDB table
echo "Creating Follows table..."
awslocal dynamodb create-table \
    --table-name Follows \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[{\"IndexName\":\"followers-index\",\"KeySchema\":[{\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST

echo "Waiting for Follows table to be active..."
awslocal dynamodb wait table-exists --table-name Follows

# Create Likes DynamoDB table
echo "Creating Likes table..."
awslocal dynamodb create-table \
    --table-name Likes \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[{\"IndexName\":\"user-likes-index\",\"KeySchema\":[{\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST

echo "Waiting for Likes table to be active..."
awslocal dynamodb wait table-exists --table-name Likes

# Create S3 bucket for media (future use)
echo "Creating media bucket..."
awslocal s3 mb s3://twitter-net-media 2>/dev/null || true

# Create Timeline DynamoDB table (for fanout-on-write)
echo "Creating Timeline table..."
awslocal dynamodb create-table \
    --table-name Timeline \
    --attribute-definitions \
        AttributeName=user_id,AttributeType=S \
        AttributeName=tweet_id,AttributeType=S \
    --key-schema \
        AttributeName=user_id,KeyType=HASH \
        AttributeName=tweet_id,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST

echo "Waiting for Timeline table to be active..."
awslocal dynamodb wait table-exists --table-name Timeline

echo "LocalStack initialization complete!"
echo "Resources created:"
awslocal dynamodb list-tables
awslocal s3 ls
