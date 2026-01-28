# twitterdotnet - Technical Specification

## Overview

A minimal Twitter clone supporting tweets, likes, replies, and follows. Built with TDD methodology. Designed for local development with a path to AWS deployment.

## Feature Scope

| Feature | In Scope | Notes |
|---------|----------|-------|
| Tweets | Yes | 140 char limit, image attachments |
| Likes | Yes | Toggle like/unlike |
| Replies | Yes | Threaded under parent tweet |
| Follows | Yes | Follow/unfollow users |
| Timeline | Yes | Chronological, followed users only |
| Auth | Yes | Basic username/password |
| Search | No | - |
| DMs | No | - |
| Notifications | No | - |
| Retweets | No | - |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   React     │────▶│ TypeScript  │────▶│   C#/.NET 8     │
│   Frontend  │     │ BFF         │     │   Core Services │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            │                │
                    ▼                            ▼                ▼
              ┌──────────┐              ┌─────────────┐    ┌──────────┐
              │ DynamoDB │              │ DynamoDB    │    │    S3    │
              │ (Users)  │              │ (Tweets)    │    │ (Images) │
              └──────────┘              └─────────────┘    └──────────┘
```

### Layer Responsibilities

**React Frontend**
- SPA with React 18+ and Vite
- Tailwind CSS for styling
- Handles UI rendering, local state
- Calls BFF APIs only (never direct to core services)

**TypeScript BFF (Backend for Frontend)**
- Express.js
- Session management, auth tokens
- Aggregates/transforms data from core services
- Rate limiting, request validation

**C#/.NET Core Services**
- .NET 8 (LTS, cross-platform)
- Domain logic: tweets, users, follows, likes
- DynamoDB and S3 access via AWS SDK for .NET
- Clean separation: one service or modular monolith

## Data Model

### DynamoDB Tables

#### Users Table
```
PK: USER#<user_id>
SK: PROFILE

Attributes:
- user_id: string (ULID)
- username: string (unique, lowercase)
- display_name: string
- password_hash: string
- created_at: ISO8601
```

GSI: `username-index` (username → user_id lookup)

#### Tweets Table
```
PK: TWEET#<tweet_id>
SK: META

Attributes:
- tweet_id: string (ULID, sortable by time)
- user_id: string
- content: string (max 140)
- image_key: string (optional, S3 key)
- reply_to: string (optional, parent tweet_id)
- created_at: ISO8601
- like_count: number
- reply_count: number
```

#### Timeline Table (Fanout on Write)
```
PK: TIMELINE#<user_id>
SK: <tweet_id> (ULID, enables chronological sort)

Attributes:
- tweet_id: string
- author_id: string
```

#### Follows Table
```
PK: USER#<user_id>
SK: FOLLOWS#<target_user_id>

Attributes:
- created_at: ISO8601
```

GSI: `followers-index` - Query who follows a user
```
PK: FOLLOWING#<target_user_id>
SK: USER#<user_id>
```

#### Likes Table
```
PK: TWEET#<tweet_id>
SK: LIKE#<user_id>

Attributes:
- created_at: ISO8601
```

GSI: `user-likes-index` - Query tweets a user has liked
```
PK: USER#<user_id>
SK: LIKE#<tweet_id>
```

### S3 Structure

```
bucket: twitterdotnet-images-{env}
├── uploads/
│   └── {user_id}/{tweet_id}/{filename}
```

## API Design

### BFF Endpoints (Frontend → BFF)

#### Auth
```
POST /api/auth/register
  Body: { username, password, display_name }
  Response: { user_id, token }

POST /api/auth/login
  Body: { username, password }
  Response: { user_id, token }

POST /api/auth/logout
  Response: { success: true }
```

#### Tweets
```
POST /api/tweets
  Body: { content, image? (multipart), reply_to? }
  Response: { tweet }

GET /api/tweets/:tweet_id
  Response: { tweet, replies[] }

DELETE /api/tweets/:tweet_id
  Response: { success: true }
```

#### Timeline
```
GET /api/timeline?cursor=<ulid>&limit=20
  Response: { tweets[], next_cursor }
```

#### Users
```
GET /api/users/:username
  Response: { user, recent_tweets[] }

POST /api/users/:username/follow
  Response: { following: true }

DELETE /api/users/:username/follow
  Response: { following: false }
```

#### Likes
```
POST /api/tweets/:tweet_id/like
  Response: { liked: true, like_count }

DELETE /api/tweets/:tweet_id/like
  Response: { liked: false, like_count }
```

### Core Service Endpoints (BFF → Core)

Internal gRPC or REST. Same shape as BFF but without auth middleware (BFF handles auth, passes user_id in headers).

## Authentication

**Approach**: JWT tokens with refresh

1. User registers/logs in via BFF
2. BFF validates credentials against Core service
3. BFF issues JWT (15min expiry) + refresh token (7 days)
4. JWT stored in httpOnly cookie
5. Refresh token in separate httpOnly cookie
6. BFF validates JWT on each request, refreshes if needed

**Password Storage**: bcrypt, cost factor 12

## Image Upload Flow

1. Frontend sends multipart form to BFF
2. BFF validates file type (jpg, png, gif, webp) and size (max 5MB)
3. BFF uploads to S3 via presigned URL or direct SDK call
4. BFF passes S3 key to Core service when creating tweet
5. Frontend receives CloudFront/S3 URL for display

MVP: Direct S3 URLs. Future: CloudFront CDN.

## Timeline Strategy

**Fanout on Write** (suitable for MVP scale):

1. User posts tweet
2. Core service writes to Tweets table
3. Core service queries user's followers
4. Core service writes entry to each follower's Timeline table
5. Followers query their Timeline table for chronological feed

**Tradeoffs**:
- Write amplification (acceptable at local/small scale)
- Simple reads (single query for timeline)
- Would need hybrid approach at scale (fanout for normal users, pull for celebrities)

## Project Structure

```
twitterdotnet/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # With co-located .test.tsx files
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/             # BFF client
│   │   └── types/
│   ├── e2e/                 # Playwright E2E tests
│   └── package.json
│
├── bff/                      # Express.js BFF
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/        # Core service clients
│   │   └── types/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
│
├── core/                     # C#/.NET 8
│   ├── src/
│   │   ├── Twitterdotnet.Api/           # ASP.NET Core Web API
│   │   ├── Twitterdotnet.Domain/        # Domain models, interfaces
│   │   └── Twitterdotnet.Infrastructure/ # DynamoDB, S3 implementations
│   ├── tests/
│   │   └── Twitterdotnet.Tests/
│   │       ├── Unit/
│   │       └── Integration/
│   └── Twitterdotnet.sln
│
├── infra/                    # Terraform
│   ├── modules/
│   │   ├── dynamodb/
│   │   ├── s3/
│   │   ├── ecs/
│   │   └── networking/
│   ├── environments/
│   │   ├── local/
│   │   └── prod/
│   └── main.tf
│
├── docker-compose.yml        # Local development
├── .github/
│   └── workflows/           # CI/CD (Harness integration)
└── README.md
```

## Local Development

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_BFF_URL=http://localhost:4000

  bff:
    build: ./bff
    ports: ["4000:4000"]
    environment:
      - CORE_SERVICE_URL=http://core:5000

  core:
    build: ./core
    ports: ["5000:5000"]
    environment:
      - AWS__ServiceURL=http://localstack:4566

  localstack:
    image: localstack/localstack
    ports: ["4566:4566"]
    environment:
      - SERVICES=dynamodb,s3
```

All services run as Linux containers on Mac/Linux/Windows.

## AWS Deployment (Future)

### ECS Fargate Services
- `twitterdotnet-bff`: 0.5 vCPU, 1GB RAM
- `twitterdotnet-core`: 0.5 vCPU, 1GB RAM

### Terraform Resources
- VPC with public/private subnets
- ALB for BFF (public)
- Internal ALB for Core (private)
- ECS Cluster + Services
- DynamoDB tables (on-demand billing)
- S3 bucket + bucket policy
- IAM roles for ECS tasks

### Harness/Port Integration
- Harness pipelines for build/deploy
- Port catalog for service visibility

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| .NET Version | .NET 8 (LTS) | Cross-platform, runs on Mac |
| Real-time | Polling only | MVP simplicity |
| Repo structure | Monorepo | Single repo for all components |
| Frontend styling | Tailwind CSS | Utility-first, fast iteration |
| BFF framework | Express.js | Mature ecosystem |
| Testing | TDD with unit, integration, E2E | Full coverage |

## Repository

GitHub: https://github.com/michaellady/twitter.net

## Testing Strategy

**Approach: TDD** - Write tests first, then implement.

### Unit Tests

| Layer | Framework | Focus |
|-------|-----------|-------|
| Frontend | Vitest + React Testing Library | Components, hooks |
| BFF | Jest | Route handlers, middleware |
| Core | xUnit | Domain logic, services |

### Integration Tests

| Layer | Framework | Focus |
|-------|-----------|-------|
| BFF | Jest + Supertest | API endpoints with mocked Core |
| Core | xUnit + WebApplicationFactory | API endpoints with LocalStack |

### E2E Tests

| Tool | Focus |
|------|-------|
| Playwright | Full user flows (register, tweet, follow, like) |

### Test Structure

```
frontend/
├── src/
│   └── components/
│       └── Tweet/
│           ├── Tweet.tsx
│           └── Tweet.test.tsx    # Co-located unit tests
└── e2e/
    └── flows/
        └── timeline.spec.ts      # Playwright E2E

bff/
├── src/
│   └── routes/
│       └── tweets.ts
└── tests/
    ├── unit/
    │   └── routes/tweets.test.ts
    └── integration/
        └── tweets.integration.test.ts

core/
├── src/
│   └── TwitterClone.Domain/
│       └── Services/TweetService.cs
└── tests/
    └── TwitterClone.Tests/
        ├── Unit/
        │   └── TweetServiceTests.cs
        └── Integration/
            └── TweetsControllerTests.cs
```

### Coverage Targets

| Layer | Target |
|-------|--------|
| Core Domain | 90%+ |
| BFF Routes | 80%+ |
| Frontend Components | 70%+ |

## Tracer Bullet

**Goal**: Prove the architecture end-to-end with the thinnest possible vertical slice.

### Tracer Bullet Scope

Post a tweet and see it on a timeline. No auth, no images, no replies, no likes.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │───▶│     BFF      │───▶│    Core      │───▶│  DynamoDB    │
│              │    │              │    │              │    │              │
│ - Text input │    │ - POST /tweet│    │ - Save tweet │    │ - Tweets tbl │
│ - Tweet list │    │ - GET /feed  │    │ - List tweets│    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### What the Tracer Proves

| Layer | Validates |
|-------|-----------|
| Frontend | React + Vite + Tailwind builds and runs |
| Frontend → BFF | HTTP client works, CORS configured |
| BFF | Express routing, request/response handling |
| BFF → Core | Service-to-service HTTP communication |
| Core | ASP.NET Core Web API, DI, configuration |
| Core → DynamoDB | AWS SDK, table operations, LocalStack |
| Docker | All services containerize and network together |
| Tests | Test infrastructure works at each layer |

### Tracer Bullet Features

**Tweet (simplified)**
- POST tweet with hardcoded user_id ("user-1")
- 140 char content only
- No images, no reply_to

**Feed (simplified)**
- GET all tweets (no timeline fanout yet)
- Chronological order, newest first
- No pagination

### Tracer Bullet API

```
# BFF
POST /api/tweets        { content: string }     → { tweet }
GET  /api/feed                                  → { tweets[] }

# Core (internal)
POST /tweets            { user_id, content }    → { tweet }
GET  /tweets                                    → { tweets[] }
```

### Tracer Bullet Data Model

```
# Tweets Table (minimal)
PK: TWEET#<tweet_id>
SK: META

Attributes:
- tweet_id: string (ULID)
- user_id: string (hardcoded "user-1")
- content: string
- created_at: ISO8601
```

### Tracer Bullet UI

```
┌─────────────────────────────────────┐
│  twitterdotnet                      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ What's happening?               │ │
│ │ [________________________] [Tweet]│
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ user-1 · 2m ago                 │ │
│ │ Hello world!                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ user-1 · 5m ago                 │ │
│ │ First tweet                     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Tracer Bullet Implementation Order

1. **Infrastructure** - docker-compose with LocalStack, create DynamoDB table
2. **Core** - .NET 8 project, health endpoint, POST/GET tweets with DynamoDB
3. **Core Tests** - Unit + integration tests for tweet operations
4. **BFF** - Express project, health endpoint, proxy to Core
5. **BFF Tests** - Unit + integration tests
6. **Frontend** - Vite + React + Tailwind scaffold, tweet form, feed display
7. **Frontend Tests** - Component tests
8. **E2E** - Playwright test: post tweet, verify it appears in feed
9. **Verify** - `docker-compose up`, manual smoke test

### Success Criteria

- [ ] `docker-compose up` starts all services
- [ ] Can post a tweet from browser
- [ ] Tweet appears in feed after refresh
- [ ] All tests pass (unit, integration, E2E)
- [ ] Each layer has at least one test

---

## Full Implementation Order (Post-Tracer)

1. Core: User registration, auth
2. Core: Tweet CRUD (full: images, replies)
3. Core: Follows, Timeline fanout
4. Core: Likes
5. BFF: Auth endpoints
6. BFF: Full tweet/timeline endpoints
7. Frontend: Auth pages
8. Frontend: Full timeline, compose, tweet detail
9. Image upload flow
10. Terraform + AWS deployment
