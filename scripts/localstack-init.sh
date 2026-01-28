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

# Create S3 bucket for media (future use)
echo "Creating media bucket..."
awslocal s3 mb s3://twitter-net-media 2>/dev/null || true

echo "LocalStack initialization complete!"
echo "Resources created:"
awslocal dynamodb list-tables
awslocal s3 ls
