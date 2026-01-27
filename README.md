# twitter.net

A minimal Twitter clone demonstrating end-to-end vertical slice architecture.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│    BFF      │────▶│    Core     │────▶│  DynamoDB   │
│  (React)    │     │  (Node.js)  │     │  (C#/.NET)  │     │ (LocalStack)│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     :3000               :8080               :8081              :4566
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- .NET 8 SDK (for local development)
- AWS CLI (optional, for manual LocalStack interaction)

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Service URLs

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React web app |
| BFF | 8080 | Backend for Frontend API |
| Core API | 8081 | Domain logic and persistence |
| LocalStack | 4566 | AWS services (DynamoDB) |

## Health Checks

```bash
curl http://localhost:4566/_localstack/health  # LocalStack
curl http://localhost:8081/health               # Core
curl http://localhost:8080/health               # BFF
curl http://localhost:3000/health               # Frontend
```

## Development

### Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev     # Hot reload at http://localhost:3000
npm test        # Run unit tests
```

### BFF (Node.js + TypeScript)

```bash
cd bff
npm install
npm run dev     # Hot reload at http://localhost:8080
npm test        # Run unit tests
```

### Core API (C# / .NET 8)

```bash
cd core
dotnet restore
dotnet watch run    # Hot reload at http://localhost:8081
dotnet test         # Run unit tests
```

## Testing

### Run All Tests

```bash
# Unit tests for each layer
cd frontend && npm test
cd bff && npm test
cd core && dotnet test

# E2E tests (requires services running)
npx playwright test
```

### Full Verification

Run the complete verification script:

```bash
./scripts/verify.sh
```

This will:
1. Start all services
2. Run health checks
3. Execute unit tests
4. Execute integration tests
5. Execute E2E tests
6. Guide through manual smoke test

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

## Project Structure

```
twitter_net/
├── docker-compose.yml    # Service orchestration
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   └── hooks/        # React hooks
│   └── tests/            # Vitest tests
├── bff/                  # Backend for Frontend
│   ├── src/
│   │   └── routes/       # Express routes
│   └── tests/            # Jest tests
├── src/Core/             # Domain logic (C#)
├── tests/                # Integration + E2E tests
└── scripts/
    └── verify.sh         # Verification script
```

## Tracer Bullet Scope

This MVP includes:
- ✅ Post a tweet
- ✅ View tweets in feed
- ✅ Persistence to DynamoDB

Not included (future work):
- User authentication
- Images/media
- Replies
- Likes
- Search

## Troubleshooting

### Services won't start

```bash
# Check if ports are in use
lsof -i :3000 -i :8080 -i :8081 -i :4566

# Clean restart
docker-compose down -v
docker-compose up -d --build
```

### LocalStack issues

```bash
# Verify DynamoDB table exists
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Check LocalStack logs
docker-compose logs localstack
```

### Test failures

```bash
# Run with verbose output
npm test -- --verbose
dotnet test --verbosity detailed
```

## License

MIT
