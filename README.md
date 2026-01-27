# twitter.net

A Twitter clone for learning and experimentation.

## Prerequisites

- Docker and Docker Compose
- AWS CLI (optional, for manual LocalStack interaction)

## Quick Start

```bash
# Start all services
docker-compose up

# Or run in detached mode
docker-compose up -d
```

This starts:
- **LocalStack** (port 4566) - Local AWS services (DynamoDB, S3)
- **Core** (port 8081) - Tweet domain logic
- **BFF** (port 8080) - Backend for Frontend API gateway
- **Frontend** (port 3000) - Web UI

## Services

| Service | Port | Description |
|---------|------|-------------|
| LocalStack | 4566 | AWS DynamoDB and S3 emulation |
| Core | 8081 | Tweet domain service |
| BFF | 8080 | API gateway for frontend |
| Frontend | 3000 | Web application |

## Health Checks

All services expose health endpoints:

```bash
curl http://localhost:4566/_localstack/health  # LocalStack
curl http://localhost:8081/health               # Core
curl http://localhost:8080/health               # BFF
curl http://localhost:3000/health               # Frontend
```

## LocalStack Resources

On startup, LocalStack automatically creates:
- **DynamoDB Table**: `Tweets` with GSI on `userId-createdAt`
- **S3 Bucket**: `twitter-net-media` for future media storage

### Interacting with LocalStack

```bash
# List DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Describe Tweets table
aws --endpoint-url=http://localhost:4566 dynamodb describe-table --table-name Tweets

# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Development

```bash
# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f core
```

## Architecture

```
Frontend (3000) --> BFF (8080) --> Core (8081) --> LocalStack (4566)
                                                       |
                                                  DynamoDB + S3
```
